import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    console.log('Webhook received:', JSON.stringify(body))

    // Green API webhook structure
    const { typeWebhook, instanceData, messageData, senderData } = body

    if (typeWebhook === 'incomingMessageReceived') {
      const chatId = senderData?.chatId || messageData?.chatId
      const senderName = senderData?.senderName || senderData?.chatName || 'Unknown'
      const senderPhone = chatId?.replace('@c.us', '') || ''
      const messageContent = messageData?.textMessageData?.textMessage || 
                            messageData?.extendedTextMessageData?.text ||
                            messageData?.imageMessage?.caption ||
                            '[Media]'
      const messageType = messageData?.typeMessage || 'text'
      const messageId = body.idMessage

      console.log('Processing incoming message:', { chatId, senderName, messageContent })

      // Find or create conversation
      let { data: conversation, error: convError } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('chat_id', chatId)
        .maybeSingle()

      if (!conversation) {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from('whatsapp_conversations')
          .insert({
            chat_id: chatId,
            contact_name: senderName,
            contact_phone: senderPhone,
            status: 'online',
            read_status: 'pending',
            category: 'lead'
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating conversation:', createError)
          throw createError
        }
        conversation = newConv
        console.log('Created new conversation:', conversation.id)
      } else {
        // Update existing conversation
        await supabase
          .from('whatsapp_conversations')
          .update({
            contact_name: senderName,
            status: 'online',
            read_status: conversation.read_status === 'read' ? 'unread' : conversation.read_status,
            last_seen: new Date().toISOString()
          })
          .eq('id', conversation.id)
      }

      // Insert message
      const { error: msgError } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversation.id,
          content: messageContent,
          sender: 'customer',
          message_type: messageType,
          message_id: messageId,
          status: 'received',
          metadata: messageData
        })

      if (msgError) {
        console.error('Error inserting message:', msgError)
        throw msgError
      }

      console.log('Message saved successfully')
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Webhook error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
