-- Create table for conversation events/history
CREATE TABLE public.conversation_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  actor_name TEXT,
  actor_department TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversation_events ENABLE ROW LEVEL SECURITY;

-- Create policy for full access (to be refined with auth later)
CREATE POLICY "Allow full access to conversation_events"
ON public.conversation_events
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_conversation_events_conversation_id ON public.conversation_events(conversation_id);
CREATE INDEX idx_conversation_events_created_at ON public.conversation_events(created_at);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_events;