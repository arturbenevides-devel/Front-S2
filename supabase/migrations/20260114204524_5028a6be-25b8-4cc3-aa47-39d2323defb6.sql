-- Create table for internal notes with signatures from different departments
CREATE TABLE public.conversation_internal_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_department TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.conversation_internal_notes ENABLE ROW LEVEL SECURITY;

-- Create policy for full access (since we don't have auth yet)
CREATE POLICY "Allow full access to conversation_internal_notes"
ON public.conversation_internal_notes
FOR ALL
USING (true)
WITH CHECK (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_internal_notes;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_conversation_internal_notes_updated_at
BEFORE UPDATE ON public.conversation_internal_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();