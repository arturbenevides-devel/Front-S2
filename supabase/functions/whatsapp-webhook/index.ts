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

    const { typeWebhook, messageData, senderData } = body

    // Handle incoming messages from customers
    if (typeWebhook === 'incomingMessageReceived') {
      const chatId = senderData?.chatId || messageData?.chatId
      const isGroup = chatId?.endsWith('@g.us') || false
      const senderName = senderData?.senderName || senderData?.chatName || 'Unknown'
      const chatName = senderData?.chatName || senderName
      const senderPhone = senderData?.sender || chatId?.replace('@c.us', '').replace('@g.us', '') || ''
      
      const messageContent = messageData?.textMessageData?.textMessage || 
                            messageData?.extendedTextMessageData?.text ||
                            messageData?.editedMessageData?.textMessage ||
                            messageData?.imageMessage?.caption ||
                            '[Media]'
      const messageType = messageData?.typeMessage || 'text'
      const messageId = body.idMessage

      console.log('Processing incoming message:', { chatId, senderName, messageContent, isGroup })

      // Find or create conversation
      let { data: conversation } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('chat_id', chatId)
        .maybeSingle()

      if (!conversation) {
        // For groups use chatName, for individual use senderName
        const contactName = isGroup ? chatName : senderName
        const { data: newConv, error: createError } = await supabase
          .from('whatsapp_conversations')
          .insert({
            chat_id: chatId,
            contact_name: contactName,
            contact_phone: isGroup ? chatId : senderPhone,
            status: 'online',
            read_status: 'pending',
            category: 'lead',
            is_group: isGroup,
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating conversation:', createError)
          throw createError
        }
        conversation = newConv
        console.log('Created new conversation:', conversation.id, isGroup ? '(group)' : '(individual)')
      } else {
        // For individual chats, update contact_name with sender
        // For groups, only update if contact_name is missing, keep original group name
        const updateData: Record<string, unknown> = {
          status: 'online',
          read_status: conversation.read_status === 'read' ? 'unread' : conversation.read_status,
          last_seen: new Date().toISOString(),
          is_group: isGroup,
        }
        
        if (!isGroup) {
          updateData.contact_name = senderName
        } else if (!conversation.contact_name || conversation.contact_name === chatId) {
          updateData.contact_name = chatName
        }

        await supabase
          .from('whatsapp_conversations')
          .update(updateData)
          .eq('id', conversation.id)
      }

      // Insert message - for groups, store senderName in metadata
      const msgMetadata = isGroup 
        ? { ...messageData, senderName, senderPhone }
        : messageData

      const { error: msgError } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversation.id,
          content: messageContent,
          sender: 'customer',
          message_type: messageType,
          message_id: messageId,
          status: 'received',
          metadata: msgMetadata,
        })

      if (msgError) {
        console.error('Error inserting message:', msgError)
        throw msgError
      }

      console.log('Message saved successfully')
    }

    // Handle outgoing messages sent from the phone (not via API)
    if (typeWebhook === 'outgoingMessageReceived' || typeWebhook === 'outgoingAPIMessageReceived') {
      const chatId = senderData?.chatId || messageData?.chatId
      const isGroup = chatId?.endsWith('@g.us') || false
      const chatName = senderData?.chatName || 'Unknown'
      
      const messageContent = messageData?.textMessageData?.textMessage || 
                            messageData?.extendedTextMessageData?.text ||
                            messageData?.editedMessageData?.textMessage ||
                            messageData?.imageMessage?.caption ||
                            '[Media]'
      const messageType = messageData?.typeMessage || 'text'
      const messageId = body.idMessage

      console.log('Processing outgoing message:', { chatId, messageContent, isGroup })

      // Find or create conversation
      let { data: conversation } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('chat_id', chatId)
        .maybeSingle()

      if (!conversation) {
        const contactName = isGroup ? chatName : (chatName || chatId?.replace('@c.us', ''))
        const { data: newConv, error: createError } = await supabase
          .from('whatsapp_conversations')
          .insert({
            chat_id: chatId,
            contact_name: contactName,
            contact_phone: chatId?.replace('@c.us', '').replace('@g.us', '') || '',
            status: 'online',
            read_status: 'read',
            category: 'lead',
            is_group: isGroup,
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating conversation for outgoing:', createError)
          throw createError
        }
        conversation = newConv
      } else {
        await supabase
          .from('whatsapp_conversations')
          .update({
            last_seen: new Date().toISOString(),
            is_group: isGroup,
          })
          .eq('id', conversation.id)
      }

      // Check if message already exists (avoid duplicates from API sends)
      if (messageId) {
        const { data: existingMsg } = await supabase
          .from('whatsapp_messages')
          .select('id')
          .eq('message_id', messageId)
          .maybeSingle()

        if (existingMsg) {
          console.log('Outgoing message already exists, skipping:', messageId)
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      // Insert outgoing message as agent
      const { error: msgError } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversation.id,
          content: messageContent,
          sender: 'agent',
          message_type: messageType,
          message_id: messageId,
          status: 'sent',
          metadata: messageData,
        })

      if (msgError) {
        console.error('Error inserting outgoing message:', msgError)
        throw msgError
      }

      console.log('Outgoing message saved successfully')
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
