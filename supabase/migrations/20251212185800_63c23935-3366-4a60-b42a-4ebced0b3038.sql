-- Create table for WhatsApp conversations
CREATE TABLE public.whatsapp_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id TEXT NOT NULL UNIQUE, -- WhatsApp chat ID (e.g., 5511999999999@c.us)
  contact_name TEXT,
  contact_phone TEXT NOT NULL,
  contact_avatar TEXT,
  status TEXT DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE,
  category TEXT DEFAULT 'lead',
  ai_enabled BOOLEAN DEFAULT true,
  read_status TEXT DEFAULT 'pending',
  assigned_to TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for WhatsApp messages
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  message_id TEXT, -- Green API message ID
  content TEXT NOT NULL,
  sender TEXT NOT NULL, -- 'user' (agent) or 'contact' (customer)
  message_type TEXT DEFAULT 'text', -- text, image, document, audio
  status TEXT DEFAULT 'sent', -- sent, delivered, read
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX idx_whatsapp_messages_conversation_id ON public.whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_messages_timestamp ON public.whatsapp_messages(timestamp DESC);
CREATE INDEX idx_whatsapp_conversations_chat_id ON public.whatsapp_conversations(chat_id);
CREATE INDEX idx_whatsapp_conversations_read_status ON public.whatsapp_conversations(read_status);

-- Enable RLS
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a CRM, we'll handle auth at app level)
CREATE POLICY "Allow full access to whatsapp_conversations" 
ON public.whatsapp_conversations 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow full access to whatsapp_messages" 
ON public.whatsapp_messages 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_whatsapp_conversations_updated_at
BEFORE UPDATE ON public.whatsapp_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();