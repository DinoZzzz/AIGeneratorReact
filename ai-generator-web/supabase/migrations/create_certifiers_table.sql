-- Create certifiers table
CREATE TABLE IF NOT EXISTS public.certifiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.certifiers ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow all authenticated users to read certifiers
CREATE POLICY "Allow authenticated read access" ON public.certifiers
    FOR SELECT TO authenticated USING (true);

-- Allow only admins to insert/update/delete (assumes you have a profiles table with role column)
CREATE POLICY "Allow admin insert" ON public.certifiers
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Allow admin update" ON public.certifiers
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Allow admin delete" ON public.certifiers
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Insert default certifiers
INSERT INTO public.certifiers (name, title, is_default) VALUES
    ('Nikola Brečić', 'bacc.ing.secc.', true),
    ('Ante Milas', NULL, false);
