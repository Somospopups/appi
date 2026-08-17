// ============================================
// Edge Function: Crear pago por transferencia
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get authenticated user
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('No autorizado')
    }

    // Parse request body
    const { planType } = await req.json()
    
    if (!planType || !['monthly', 'yearly'].includes(planType)) {
      throw new Error('Tipo de plan inválido. Debe ser "monthly" o "yearly"')
    }

    // Get plan details
    const { data: plan, error: planError } = await supabaseClient
      .from('plans')
      .select('*')
      .eq('active', true)
      .limit(1)
      .single()

    if (planError || !plan) {
      throw new Error('No se encontró el plan')
    }

    // Calculate amount
    const amount = planType === 'monthly' ? plan.price_monthly : plan.price_yearly

    // Generate unique payment code
    const { data: paymentCode, error: codeError } = await supabaseClient
      .rpc('generate_payment_code', {
        user_id: user.id,
        plan_type: planType
      })

    if (codeError) {
      throw new Error('Error generando código de pago')
    }

    // Create pending subscription
    const startsAt = new Date()
    const expiresAt = new Date()
    
    if (planType === 'monthly') {
      expiresAt.setDate(expiresAt.getDate() + 30)
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    }

    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        status: 'pending',
        payment_method: 'transfer',
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        auto_renew: false
      })
      .select()
      .single()

    if (subscriptionError) {
      throw new Error('Error creando suscripción')
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        subscription_id: subscription.id,
        payment_code: paymentCode,
        amount: amount,
        plan_type: planType,
        status: 'pending'
      })
      .select()
      .single()

    if (paymentError) {
      throw new Error('Error creando registro de pago')
    }

    // Return payment details
    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          code: payment.payment_code,
          amount: payment.amount,
          plan_type: payment.plan_type,
          expires_at: subscription.expires_at
        },
        bank_details: {
          alias: 'appi.pagos.mp',
          cbu: '0000003100012345678901',
          bank: 'Mercado Pago',
          holder: 'APPI Solutions',
          cuit: '20-12345678-9'
        },
        instructions: [
          `Realizá la transferencia por $${amount} ARS`,
          `Incluí este código en el concepto: ${payment.payment_code}`,
          `El acceso se habilitará automáticamente una vez validada la transferencia`,
          `Tiempo estimado de validación: 24-48 horas hábiles`
        ]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error en create-payment:', error)
    
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
