-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (Extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  last_name TEXT,
  username TEXT,
  title TEXT,
  role TEXT DEFAULT 'user', -- 'admin' or 'user'
  accreditations JSONB DEFAULT '[]'::jsonb, -- Array of report_type_ids
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Static Lookup Tables
CREATE TABLE report_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE report_drafts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE examination_procedures (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  allowed_loss NUMERIC NOT NULL,
  pressure NUMERIC -- Optional, helpful for auto-selection
);

CREATE TABLE material_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE materials (
  id SERIAL PRIMARY KEY,
  material_type_id INTEGER REFERENCES material_types(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Customers & Constructions
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  work_order TEXT,
  location TEXT,
  address TEXT,
  postal_code TEXT,
  oib TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE constructions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  work_order TEXT,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Reports
CREATE TABLE report_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ordinal INTEGER,
  user_id UUID REFERENCES auth.users(id),

  -- Foreign Keys to Lookups
  type_id INTEGER REFERENCES report_types(id),
  draft_id INTEGER REFERENCES report_drafts(id),
  examination_procedure_id INTEGER REFERENCES examination_procedures(id),
  material_type_id INTEGER REFERENCES material_types(id),

  -- Materials (Optional, can be null)
  pane_material_id INTEGER REFERENCES materials(id),
  pipe_material_id INTEGER REFERENCES materials(id),

  -- Context
  customer_id UUID REFERENCES customers(id),
  construction_id UUID REFERENCES constructions(id),

  -- Data Fields
  dionica TEXT,
  stock TEXT,
  temperature NUMERIC,
  pipe_length NUMERIC,
  pipe_diameter NUMERIC,
  pipeline_slope NUMERIC,
  pane_width NUMERIC,
  pane_height NUMERIC,
  pane_length NUMERIC,
  saturation_of_test_section NUMERIC,
  water_height NUMERIC,
  water_height_start NUMERIC,
  water_height_end NUMERIC,
  pressure_start NUMERIC,
  pressure_end NUMERIC,
  ro_height NUMERIC,
  pane_diameter NUMERIC,
  depositional_height NUMERIC,

  -- Times
  stabilization_time TEXT,
  saturation_time TEXT,
  examination_date DATE,
  examination_duration TEXT,
  examination_start_time TEXT,
  examination_end_time TEXT,

  -- Results
  satisfies BOOLEAN,
  remark TEXT,
  deviation TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. History / Exports
CREATE TABLE report_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type_id INTEGER REFERENCES report_types(id),
  construction_id UUID REFERENCES constructions(id),
  customer_id UUID REFERENCES customers(id),
  certifier_id UUID REFERENCES profiles(id), -- Who signed it
  user_id UUID REFERENCES profiles(id), -- Who created the export

  drainage TEXT,
  water_remark TEXT,
  water_deviation TEXT,
  air_remark TEXT,
  air_deviation TEXT,

  is_finished BOOLEAN DEFAULT false,
  certification_time TIMESTAMPTZ,
  examination_date DATE,
  construction_part TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link Table (Many-to-Many between Export and Report Forms)
CREATE TABLE report_export_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  export_id UUID REFERENCES report_exports(id) ON DELETE CASCADE,
  form_id UUID REFERENCES report_forms(id) ON DELETE CASCADE,
  ordinal INTEGER,
  type_id INTEGER REFERENCES report_types(id), -- Denormalized for easy filtering

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE constructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_export_forms ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to do everything (Internal Tool)
CREATE POLICY "Enable all for authenticated users" ON profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON constructions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON report_forms FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON report_exports FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON report_export_forms FOR ALL USING (auth.role() = 'authenticated');
-- Public read for lookups
CREATE POLICY "Enable read for authenticated users" ON report_types FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read for authenticated users" ON report_drafts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read for authenticated users" ON examination_procedures FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read for authenticated users" ON material_types FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON materials FOR ALL USING (auth.role() = 'authenticated');

-- Triggers
-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
