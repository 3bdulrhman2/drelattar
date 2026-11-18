-- ========================================================
-- Dr. Mohammed Elsayed Elattar - Clinic Database Schema
-- Supabase PostgreSQL Schema Setup
-- ========================================================

-- 1. Clinic Settings Table (For dynamic content management)
CREATE TABLE IF NOT EXISTS clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL DEFAULT 'main_settings',
  content JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to clinic settings
CREATE POLICY "Allow public read-only access on clinic_settings"
  ON clinic_settings
  FOR SELECT
  USING (true);

-- Allow authenticated admin users to update settings
CREATE POLICY "Allow authenticated admin update on clinic_settings"
  ON clinic_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Future Appointments Table (Future Booking Module)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Allow public users to insert appointment requests when feature is enabled
CREATE POLICY "Allow public insert on appointments"
  ON appointments
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated admins to view and manage appointments
CREATE POLICY "Allow authenticated admins to read and update appointments"
  ON appointments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Sample initial row for clinic_settings (if empty)
-- INSERT INTO clinic_settings (key, content) VALUES ('main_settings', '{}'::jsonb)
-- ON CONFLICT (key) DO NOTHING;
