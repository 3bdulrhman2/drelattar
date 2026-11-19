-- ========================================================
-- د. محمد السيد العطار - مخطط قاعدة بيانات سوبابيز (Supabase)
-- Dr. Mohammed Elsayed Elattar - Supabase PostgreSQL Schema
-- ========================================================

-- 1. إنشاء جدول إعدادات ومحتوى العيادة والموقع بالكامل
CREATE TABLE IF NOT EXISTS clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL DEFAULT 'main_settings',
  content JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- تفعيل حماية الأمان على مستوى الصفوف (Row Level Security - RLS)
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

-- حذف أي سياسات سابقة لضمان عدم حدوث تعارض عند إعادة التشغيل
DROP POLICY IF EXISTS "Allow public read-only access on clinic_settings" ON clinic_settings;
DROP POLICY IF EXISTS "Allow authenticated admin update on clinic_settings" ON clinic_settings;
DROP POLICY IF EXISTS "Allow all operations on clinic_settings" ON clinic_settings;

-- سياسة 1: السماح لزوار الموقع بقراءة البيانات وعرض محتوى العيادة
CREATE POLICY "Allow public read-only access on clinic_settings"
  ON clinic_settings
  FOR SELECT
  USING (true);

-- سياسة 2: السماح للوحة التحكم بتحديث وحفظ البيانات
CREATE POLICY "Allow all operations on clinic_settings"
  ON clinic_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- 2. إنشاء جدول الحجوزات المستقبلية (Appointments Table)
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

-- تفعيل RLS على جدول الحجوزات
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on appointments" ON appointments;
DROP POLICY IF EXISTS "Allow authenticated admins to read and update appointments" ON appointments;
DROP POLICY IF EXISTS "Allow all operations on appointments" ON appointments;

-- السماح بحفظ وإدارة الحجوزات
CREATE POLICY "Allow all operations on appointments"
  ON appointments
  FOR ALL
  USING (true)
  WITH CHECK (true);
