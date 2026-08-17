-- ============================================
-- Sistema de planes y pagos por transferencia
-- ============================================

-- Tabla de planes disponibles
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2) NOT NULL,
  features JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar planes por defecto
INSERT INTO plans (name, description, price_monthly, price_yearly, features) VALUES
(
  'Plan Mensual',
  'Acceso completo a APPI por 30 días',
  5000.00,
  50000.00,
  '["Acceso completo a todas las funcionalidades", "Soporte por WhatsApp", "Actualizaciones incluidas", "Cancelás cuando quieras"]'
),
(
  'Plan Anual',
  'Acceso completo a APPI por 12 meses (2 meses gratis)',
  5000.00,
  50000.00,
  '["Todo lo del Plan Mensual", "Ahorrás $10.000", "Precio congelado por 1 año", "Soporte prioritario"]'
)
ON CONFLICT DO NOTHING;

-- Tabla de suscripciones activas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, expired, cancelled
  payment_method TEXT NOT NULL, -- transfer, mercadopago, etc.
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at);

-- Tabla de pagos (transferencias pendientes de validar)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  payment_code TEXT NOT NULL UNIQUE, -- Código único de referencia (ej: APPI-ABC123-MENSUAL)
  amount DECIMAL(10,2) NOT NULL,
  plan_type TEXT NOT NULL, -- monthly, yearly
  status TEXT NOT NULL DEFAULT 'pending', -- pending, validated, rejected
  bank_reference TEXT, -- Referencia que pone el usuario en la transferencia
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_code ON payments(payment_code);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Tabla de extractos bancarios subidos
CREATE TABLE IF NOT EXISTS bank_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploaded_by UUID REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  file_content TEXT NOT NULL, -- CSV content
  processed_at TIMESTAMPTZ,
  matches_found INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar campos a tabla de usuarios
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON auth.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_expires_at ON auth.users(subscription_expires_at);

-- ============================================
-- Funciones útiles
-- ============================================

-- Función para generar código de pago único
CREATE OR REPLACE FUNCTION generate_payment_code(user_id UUID, plan_type TEXT)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  user_prefix TEXT;
BEGIN
  -- Generar prefijo basado en user_id (primeros 6 caracteres)
  user_prefix := UPPER(SUBSTRING(user_id::TEXT FROM 1 FOR 6));
  
  -- Generar código: APPI-{USER_PREFIX}-{PLAN_TYPE}-{RANDOM}
  code := 'APPI-' || user_prefix || '-' || UPPER(plan_type) || '-' || 
          UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si usuario tiene suscripción activa
CREATE OR REPLACE FUNCTION has_active_subscription(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_active BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM subscriptions 
    WHERE user_id = $1 
      AND status = 'active' 
      AND expires_at > NOW()
  ) INTO is_active;
  
  RETURN COALESCE(is_active, false);
END;
$$ LANGUAGE plpgsql;

-- Función para obtener días restantes de suscripción
CREATE OR REPLACE FUNCTION get_subscription_days_remaining(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  days_remaining INTEGER;
BEGIN
  SELECT EXTRACT(DAY FROM (expires_at - NOW()))::INTEGER
  INTO days_remaining
  FROM subscriptions
  WHERE user_id = $1
    AND status = 'active'
    AND expires_at > NOW()
  ORDER BY expires_at DESC
  LIMIT 1;
  
  RETURN COALESCE(days_remaining, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Triggers para mantener consistencia
-- ============================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger a payments
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;

-- Políticas para plans (lectura pública)
CREATE POLICY "Plans are viewable by everyone"
  ON plans FOR SELECT
  USING (active = true);

-- Políticas para subscriptions (usuarios ven solo las suyas)
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas para payments (usuarios ven solo los suyos)
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas para bank_statements (solo admins)
-- Por ahora, permitir todo (ajustar después según roles)
CREATE POLICY "Allow all operations on bank_statements"
  ON bank_statements FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Comentarios
-- ============================================

COMMENT ON TABLE plans IS 'Planes de suscripción disponibles';
COMMENT ON TABLE subscriptions IS 'Suscripciones activas de usuarios';
COMMENT ON TABLE payments IS 'Pagos por transferencia pendientes de validación';
COMMENT ON TABLE bank_statements IS 'Extractos bancarios subidos para validación';

COMMENT ON COLUMN payments.payment_code IS 'Código único que el usuario debe incluir en el concepto de la transferencia';
COMMENT ON COLUMN payments.bank_reference IS 'Referencia que el usuario puso en la transferencia (para matching)';
COMMENT ON COLUMN payments.status IS 'Estado: pending (pendiente), validated (validado), rejected (rechazado)';
