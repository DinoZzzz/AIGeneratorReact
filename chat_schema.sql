-- Messages table for team chat
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_edited boolean DEFAULT false,
  CONSTRAINT messages_content_length CHECK (char_length(content) > 0 AND char_length(content) <= 5000)
);

-- Index for efficient querying by creation time
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all messages
CREATE POLICY "Users can read all messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert their own messages
CREATE POLICY "Users can insert own messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own messages
CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete own messages"
  ON public.messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
