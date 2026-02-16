const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { audioUrl, audioBase64 } = await req.json()

    if (!audioUrl && !audioBase64) {
      throw new Error('audioUrl or audioBase64 is required')
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY not configured')
    }

    let prompt = 'Transcreva o conteúdo deste áudio em texto. Retorne APENAS a transcrição, sem comentários adicionais.'
    
    // Use Gemini Flash for audio transcription via Lovable AI
    const messages: Array<{ role: string; content: unknown }> = [
      {
        role: 'user',
        content: audioBase64
          ? [
              { type: 'text', text: prompt },
              {
                type: 'input_audio',
                input_audio: {
                  data: audioBase64,
                  format: 'ogg',
                },
              },
            ]
          : prompt + `\n\nURL do áudio: ${audioUrl}`,
      },
    ]

    const response = await fetch('https://ai.lovable.dev/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI API error:', errorText)
      throw new Error(`AI API error: ${response.status}`)
    }

    const data = await response.json()
    const transcription = data.choices?.[0]?.message?.content || 'Não foi possível transcrever o áudio.'

    return new Response(JSON.stringify({ 
      success: true, 
      transcription 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Transcription error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
