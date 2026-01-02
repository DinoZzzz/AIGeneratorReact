-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.appointment_assignees (
  appointment_id uuid NOT NULL,
  examiner_id uuid NOT NULL,
  CONSTRAINT appointment_assignees_pkey PRIMARY KEY (appointment_id, examiner_id),
  CONSTRAINT appointment_assignees_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id),
  CONSTRAINT appointment_assignees_examiner_id_fkey FOREIGN KEY (examiner_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  examiner_id uuid,
  customer_id uuid,
  construction_id uuid,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text])),
  created_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_examiner_id_fkey FOREIGN KEY (examiner_id) REFERENCES public.profiles(id),
  CONSTRAINT appointments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT appointments_construction_id_fkey FOREIGN KEY (construction_id) REFERENCES public.constructions(id),
  CONSTRAINT appointments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.constructions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid,
  name text NOT NULL,
  work_order text,
  location text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_archived boolean NOT NULL DEFAULT false,
  CONSTRAINT constructions_pkey PRIMARY KEY (id),
  CONSTRAINT constructions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  work_order text,
  location text,
  address text,
  postal_code text,
  oib text,
  contact_person text,
  email text,
  phone text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.examination_procedures (
  id integer NOT NULL DEFAULT nextval('examination_procedures_id_seq'::regclass),
  name text NOT NULL,
  allowed_loss numeric NOT NULL,
  pressure numeric,
  CONSTRAINT examination_procedures_pkey PRIMARY KEY (id)
);
CREATE TABLE public.material_types (
  id integer NOT NULL DEFAULT nextval('material_types_id_seq'::regclass),
  name text NOT NULL,
  CONSTRAINT material_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.materials (
  id integer NOT NULL DEFAULT nextval('materials_id_seq'::regclass),
  material_type_id integer,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT materials_pkey PRIMARY KEY (id),
  CONSTRAINT materials_material_type_id_fkey FOREIGN KEY (material_type_id) REFERENCES public.material_types(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  name text,
  last_name text,
  username text,
  title text,
  role text DEFAULT 'user'::text,
  accreditations jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  gender text CHECK (gender = ANY (ARRAY['M'::text, 'F'::text])),
  avatar_url text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.report_drafts (
  id integer NOT NULL DEFAULT nextval('report_drafts_id_seq'::regclass),
  name text NOT NULL,
  CONSTRAINT report_drafts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.report_export_forms (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  export_id uuid,
  form_id uuid,
  ordinal integer,
  type_id integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT report_export_forms_pkey PRIMARY KEY (id),
  CONSTRAINT report_export_forms_export_id_fkey FOREIGN KEY (export_id) REFERENCES public.report_exports(id),
  CONSTRAINT report_export_forms_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.report_forms(id),
  CONSTRAINT report_export_forms_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.report_types(id)
);
CREATE TABLE public.report_exports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  type_id integer,
  construction_id uuid,
  customer_id uuid,
  certifier_id uuid,
  user_id uuid,
  drainage text,
  water_remark text,
  water_deviation text,
  air_remark text,
  air_deviation text,
  is_finished boolean DEFAULT false,
  certification_time timestamp with time zone,
  examination_date date,
  construction_part text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT report_exports_pkey PRIMARY KEY (id),
  CONSTRAINT report_exports_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.report_types(id),
  CONSTRAINT report_exports_construction_id_fkey FOREIGN KEY (construction_id) REFERENCES public.constructions(id),
  CONSTRAINT report_exports_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT report_exports_certifier_id_fkey FOREIGN KEY (certifier_id) REFERENCES public.profiles(id),
  CONSTRAINT report_exports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.report_files (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  construction_id uuid,
  report_id uuid,
  file_path text NOT NULL,
  file_name text NOT NULL,
  description text,
  type text,
  created_at timestamp with time zone DEFAULT now(),
  file_type text,
  CONSTRAINT report_files_pkey PRIMARY KEY (id),
  CONSTRAINT report_files_construction_id_fkey FOREIGN KEY (construction_id) REFERENCES public.constructions(id),
  CONSTRAINT report_files_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.report_forms(id)
);
CREATE TABLE public.report_forms (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ordinal integer,
  user_id uuid,
  type_id integer,
  draft_id integer,
  examination_procedure_id integer,
  material_type_id integer,
  pane_material_id integer,
  pipe_material_id integer,
  customer_id uuid,
  construction_id uuid,
  dionica text,
  stock text,
  temperature numeric,
  pipe_length numeric,
  pipe_diameter numeric,
  pipeline_slope numeric,
  pane_width numeric,
  pane_height numeric,
  pane_length numeric,
  saturation_of_test_section numeric,
  water_height numeric,
  water_height_start numeric,
  water_height_end numeric,
  pressure_start numeric,
  pressure_end numeric,
  ro_height numeric,
  pane_diameter numeric,
  depositional_height numeric,
  stabilization_time text,
  saturation_time text,
  examination_date date,
  examination_duration text,
  examination_start_time text,
  examination_end_time text,
  satisfies boolean,
  remark text,
  deviation text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  allowed_loss numeric,
  pressure_loss numeric,
  required_test_time numeric,
  section_name text,
  CONSTRAINT report_forms_pkey PRIMARY KEY (id),
  CONSTRAINT report_forms_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT report_forms_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.report_types(id),
  CONSTRAINT report_forms_draft_id_fkey FOREIGN KEY (draft_id) REFERENCES public.report_drafts(id),
  CONSTRAINT report_forms_examination_procedure_id_fkey FOREIGN KEY (examination_procedure_id) REFERENCES public.examination_procedures(id),
  CONSTRAINT report_forms_material_type_id_fkey FOREIGN KEY (material_type_id) REFERENCES public.material_types(id),
  CONSTRAINT report_forms_pane_material_id_fkey FOREIGN KEY (pane_material_id) REFERENCES public.materials(id),
  CONSTRAINT report_forms_pipe_material_id_fkey FOREIGN KEY (pipe_material_id) REFERENCES public.materials(id),
  CONSTRAINT report_forms_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT report_forms_construction_id_fkey FOREIGN KEY (construction_id) REFERENCES public.constructions(id)
);
CREATE TABLE public.report_types (
  id integer NOT NULL DEFAULT nextval('report_types_id_seq'::regclass),
  name text NOT NULL,
  CONSTRAINT report_types_pkey PRIMARY KEY (id)
);