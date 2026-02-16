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
    const { chatId, audioBase64, conversationId } = await req.json()

    if (!chatId || !audioBase64) {
      throw new Error('chatId and audioBase64 are required')
    }

    const instanceId = Deno.env.get('GREEN_API_INSTANCE_ID')
    const apiToken = Deno.env.get('GREEN_API_TOKEN')

    if (!instanceId || !apiToken) {
      throw new Error('Green API credentials not configured')
    }

    console.log('Sending audio to:', chatId)

    // Upload file first via Green API
    const uploadUrl = `https://api.green-api.com/waInstance${instanceId}/sendFileByUpload/${apiToken}`

    // Convert base64 to blob
    const binaryStr = atob(audioBase64)
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }

    const formData = new FormData()
    formData.append('chatId', chatId)
    formData.append('file', new Blob([bytes], { type: 'audio/ogg; codecs=opus' }), 'audio.ogg')
    formData.append('caption', '')

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()
    console.log('Green API audio response:', result)

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send audio')
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
          content: '🎵 Áudio enviado',
          sender: 'agent',
          message_type: 'audio',
          message_id: result.idMessage,
          status: 'sent',
          metadata: { audioBase64: audioBase64.substring(0, 100) + '...' }
        })

      if (msgError) {
        console.error('Error saving audio message:', msgError)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      messageId: result.idMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Send audio error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
