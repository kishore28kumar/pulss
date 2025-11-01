-- Migration for DPDP Act 2023 (India) Privacy Compliance
-- Digital Personal Data Protection Act, 2023

-- Privacy Grievances Table
CREATE TABLE IF NOT EXISTS privacy_grievances (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  customer_id INTEGER NOT NULL,
  subject VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general',
  status VARCHAR(50) DEFAULT 'pending',
  response TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX idx_privacy_grievances_customer ON privacy_grievances(customer_id);
CREATE INDEX idx_privacy_grievances_status ON privacy_grievances(status);
CREATE INDEX idx_privacy_grievances_tenant ON privacy_grievances(tenant_id);

-- Parental Consents Table (for users under 18)
CREATE TABLE IF NOT EXISTS parental_consents (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  parent_name VARCHAR(255) NOT NULL,
  parent_email VARCHAR(255) NOT NULL,
  parent_phone VARCHAR(50),
  relationship VARCHAR(100) DEFAULT 'parent',
  status VARCHAR(50) DEFAULT 'pending',
  verification_token VARCHAR(255),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX idx_parental_consents_customer ON parental_consents(customer_id);
CREATE INDEX idx_parental_consents_status ON parental_consents(status);

-- Update customer_privacy_settings if it doesn't exist
CREATE TABLE IF NOT EXISTS customer_privacy_settings (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL UNIQUE,
  data_processing_consent BOOLEAN DEFAULT true,
  marketing_consent BOOLEAN DEFAULT false,
  analytics_consent BOOLEAN DEFAULT false,
  personalization_consent BOOLEAN DEFAULT false,
  data_retention_preference VARCHAR(50) DEFAULT '2_years',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX idx_customer_privacy_settings_customer ON customer_privacy_settings(customer_id);

-- Add data residency tracking to customers table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='customers' AND column_name='data_residency_country'
  ) THEN
    ALTER TABLE customers ADD COLUMN data_residency_country VARCHAR(2) DEFAULT 'IN';
  END IF;
END $$;

-- Add date of birth to customers table (if not exists) for parental consent check
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='customers' AND column_name='date_of_birth'
  ) THEN
    ALTER TABLE customers ADD COLUMN date_of_birth DATE;
  END IF;
END $$;

-- Add deleted_at for soft deletes (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='customers' AND column_name='deleted_at'
  ) THEN
    ALTER TABLE customers ADD COLUMN deleted_at TIMESTAMP;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_data_residency ON customers(data_residency_country);
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers(deleted_at);

-- Comments for documentation
COMMENT ON TABLE privacy_grievances IS 'Stores grievances submitted under DPDP Act 2023';
COMMENT ON TABLE parental_consents IS 'Parental consent records for users under 18 years as per DPDP Act 2023';
COMMENT ON TABLE customer_privacy_settings IS 'Privacy preferences and consent management under DPDP Act 2023';
