
-- Add is_group column to identify group conversations
ALTER TABLE public.whatsapp_conversations 
ADD COLUMN IF NOT EXISTS is_group boolean DEFAULT false;

-- Update existing group conversations (chat_id ending with @g.us)
UPDATE public.whatsapp_conversations 
SET is_group = true 
WHERE chat_id LIKE '%@g.us';
