// ============================================
// Edge Function: Validar pagos por transferencia
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BankTransaction {
  fecha: string
  descripcion: string
  importe: number
  referencia?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key (admin access)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get authenticated user (must be admin)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No autorizado')
    }

    const { data: { user } } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (!user) {
      throw new Error('No autorizado')
    }

    // TODO: Verificar que el usuario sea admin
    // Por ahora, permitir cualquier usuario autenticado

    // Parse request body
    const { csvContent, fileName } = await req.json()
    
    if (!csvContent || !fileName) {
      throw new Error('Falta el contenido CSV o el nombre del archivo')
    }

    // Save bank statement
    const { data: statement, error: statementError } = await supabaseAdmin
      .from('bank_statements')
      .insert({
        uploaded_by: user.id,
        file_name: fileName,
        file_content: csvContent,
        processed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (statementError) {
      throw new Error('Error guardando extracto bancario')
    }

    // Parse CSV content
    const transactions = parseCSV(csvContent)

    // Get all pending payments
    const { data: pendingPayments, error: paymentsError } = await supabaseAdmin
      .from('payments')
      .select(`
        *,
        subscription:subscriptions(*)
      `)
      .eq('status', 'pending')

    if (paymentsError) {
      throw new Error('Error obteniendo pagos pendientes')
    }

    // Match transactions with pending payments
    const matches: Array<{
      payment: any
      transaction: BankTransaction
    }> = []

    for (const payment of pendingPayments || []) {
      // Buscar transacción que coincida con el código de pago y monto
      const matchingTransaction = transactions.find(t => {
        const codeMatch = t.descripcion.includes(payment.payment_code)
        const amountMatch = Math.abs(t.importe - payment.amount) < 1 // Tolerancia de $1
        
        return codeMatch && amountMatch
      })

      if (matchingTransaction) {
        matches.push({
          payment,
          transaction: matchingTransaction
        })
      }
    }

    // Process matches
    const results = []
    
    for (const match of matches) {
      const { payment, transaction } = match

      try {
        // Update payment status
        const { error: paymentUpdateError } = await supabaseAdmin
          .from('payments')
          .update({
            status: 'validated',
            bank_reference: transaction.referencia || transaction.descripcion,
            validated_at: new Date().toISOString(),
            validated_by: user.id
          })
          .eq('id', payment.id)

        if (paymentUpdateError) {
          throw new Error(`Error actualizando pago ${payment.payment_code}`)
        }

        // Update subscription status
        const { error: subscriptionUpdateError } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'active'
          })
          .eq('id', payment.subscription_id)

        if (subscriptionUpdateError) {
          throw new Error(`Error actualizando suscripción ${payment.subscription_id}`)
        }

        // Update user subscription status
        const { error: userUpdateError } = await supabaseAdmin
          .from('users')
          .update({
            subscription_status: 'active',
            subscription_expires_at: payment.subscription.expires_at
          })
          .eq('id', payment.user_id)

        if (userUpdateError) {
          throw new Error(`Error actualizando usuario ${payment.user_id}`)
        }

        results.push({
          payment_code: payment.payment_code,
          user_id: payment.user_id,
          amount: payment.amount,
          status: 'validated',
          message: 'Pago validado y acceso habilitado'
        })

      } catch (error) {
        console.error(`Error procesando pago ${payment.payment_code}:`, error)
        
        results.push({
          payment_code: payment.payment_code,
          user_id: payment.user_id,
          amount: payment.amount,
          status: 'error',
          message: error.message
        })
      }
    }

    // Update bank statement with match count
    await supabaseAdmin
      .from('bank_statements')
      .update({
        matches_found: results.filter(r => r.status === 'validated').length
      })
      .eq('id', statement.id)

    // Return results
    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total_transactions: transactions.length,
          pending_payments: pendingPayments?.length || 0,
          matches_found: results.filter(r => r.status === 'validated').length,
          errors: results.filter(r => r.status === 'error').length
        },
        results: results,
        statement_id: statement.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error en validate-payments:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error interno del servidor'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// ============================================
// Funciones auxiliares
// ============================================

function parseCSV(csvContent: string): BankTransaction[] {
  const lines = csvContent.trim().split('\n')
  
  if (lines.length < 2) {
    throw new Error('El CSV debe tener al menos una fila de datos')
  }

  // Parsear header
  const header = lines[0].split(',').map(h => h.trim().toLowerCase())
  
  const fechaIndex = header.findIndex(h => h.includes('fecha') || h.includes('date'))
  const descripcionIndex = header.findIndex(h => h.includes('descripcion') || h.includes('description') || h.includes('concepto'))
  const importeIndex = header.findIndex(h => h.includes('importe') || h.includes('amount') || h.includes('monto'))
  const referenciaIndex = header.findIndex(h => h.includes('referencia') || h.includes('reference'))

  if (fechaIndex === -1 || descripcionIndex === -1 || importeIndex === -1) {
    throw new Error('El CSV debe tener columnas de fecha, descripción e importe')
  }

  // Parsear filas
  const transactions: BankTransaction[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    
    if (values.length < 3) continue

    const importe = parseFloat(values[importeIndex].replace(/[^0-9.-]/g, ''))
    
    if (isNaN(importe)) continue

    transactions.push({
      fecha: values[fechaIndex],
      descripcion: values[descripcionIndex],
      importe: importe,
      referencia: referenciaIndex !== -1 ? values[referenciaIndex] : undefined
    })
  }

  return transactions
}
