import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { chatId, message, conversationId } = await req.json()

    if (!chatId || !message) {
      throw new Error('chatId and message are required')
    }

    const instanceId = Deno.env.get('GREEN_API_INSTANCE_ID')
    const apiToken = Deno.env.get('GREEN_API_TOKEN')

    if (!instanceId || !apiToken) {
      throw new Error('Green API credentials not configured')
    }

    console.log('Sending message to:', chatId)

    // Send message via Green API
    const greenApiUrl = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`
    
    const response = await fetch(greenApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: chatId,
        message: message
      })
    })

    const result = await response.json()
    console.log('Green API response:', result)

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send message')
    }

    // Save message to database
    if (conversationId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const { error: msgError } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversationId,
          content: message,
          sender: 'agent',
          message_type: 'text',
          message_id: result.idMessage,
          status: 'sent'
        })

      if (msgError) {
        console.error('Error saving message:', msgError)
      }

      // Update conversation
      await supabase
        .from('whatsapp_conversations')
        .update({
          last_seen: new Date().toISOString()
        })
        .eq('id', conversationId)
    }

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: result.idMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Send message error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
