import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { messages, conversationContext, type = 'chat', aiSettings } = await req.json();
    console.log('AI Assistant request:', { type, messagesCount: messages?.length, hasSettings: !!aiSettings });

    // Default prompts (used if no custom settings provided)
    const defaultSystemPrompt = `Você é um assistente de IA especializado em vendas de viagens para uma agência de turismo.
Seu objetivo é ajudar os atendentes a:
- Responder dúvidas sobre destinos, preços e disponibilidade
- Sugerir respostas para clientes
- Analisar perfil de clientes e recomendar pacotes
- Fornecer informações de mercado e tendências

Seja conciso, profissional e sempre ofereça sugestões práticas.
Responda sempre em português brasileiro.`;

    const defaultAutopilotPrompt = `Você está no modo PILOTO AUTOMÁTICO. Responda diretamente ao cliente como se fosse o atendente.
REGRAS IMPORTANTES:
- Responda de forma amigável, profissional e natural
- Use linguagem adequada para WhatsApp (informal mas respeitosa)
- Seja proativo, ofereça ajuda e faça perguntas para qualificar o lead
- Se o cliente perguntar sobre pacotes ou preços, diga que vai verificar e retornar em breve
- NUNCA diga que é uma IA ou assistente virtual
- Limite sua resposta a 2-3 parágrafos curtos no máximo
- Use emojis moderadamente para parecer natural 🌴✈️

Gere UMA resposta pronta para enviar ao cliente baseada no contexto da conversa.`;

    const defaultSuggestionPrompt = `Analise a conversa e sugira 2-3 respostas prontas que o atendente pode enviar ao cliente.
Forneça respostas curtas e diretas, adequadas para WhatsApp.`;

    const defaultAnalysisPrompt = `Analise o perfil do cliente baseado nas mensagens e forneça:
1. Interesse principal (destino, tipo de viagem)
2. Urgência (baixa, média, alta)
3. Recomendação de próximo passo`;

    // Use custom settings if provided, otherwise use defaults
    const systemPrompt = aiSettings?.systemPrompt || defaultSystemPrompt;
    const autopilotPrompt = aiSettings?.autopilotPrompt || defaultAutopilotPrompt;
    const suggestionPrompt = aiSettings?.suggestionPrompt || defaultSuggestionPrompt;
    const analysisPrompt = aiSettings?.analysisPrompt || defaultAnalysisPrompt;

    // Build knowledge base context
    let knowledgeContext = '';
    if (aiSettings) {
      const knowledgeParts = [];
      
      if (aiSettings.companyInfo) {
        knowledgeParts.push(`### Informações da Empresa:\n${aiSettings.companyInfo}`);
      }
      if (aiSettings.productsInfo) {
        knowledgeParts.push(`### Produtos e Serviços:\n${aiSettings.productsInfo}`);
      }
      if (aiSettings.faqInfo) {
        knowledgeParts.push(`### Perguntas Frequentes:\n${aiSettings.faqInfo}`);
      }
      if (aiSettings.knowledgeBase && aiSettings.knowledgeBase.length > 0) {
        knowledgeParts.push(`### Informações Adicionais:\n${aiSettings.knowledgeBase.map((item: string) => `- ${item}`).join('\n')}`);
      }
      
      if (knowledgeParts.length > 0) {
        knowledgeContext = `\n\n## BASE DE CONHECIMENTO:\nUse as informações abaixo para responder aos clientes:\n\n${knowledgeParts.join('\n\n')}`;
      }
    }

    // Build final system prompt based on type
    let finalPrompt = systemPrompt + knowledgeContext;

    if (conversationContext) {
      finalPrompt += `\n\nContexto da conversa atual:
- Cliente: ${conversationContext.contactName}
- Categoria: ${conversationContext.category || 'Lead'}
- Histórico de mensagens recentes:
${conversationContext.recentMessages?.map((m: any) => `${m.sender === 'contact' ? 'Cliente' : 'Agente'}: ${m.content}`).join('\n') || 'Nenhuma mensagem ainda'}`;
    }

    // Add type-specific instructions
    if (type === 'suggest') {
      finalPrompt += `\n\n${suggestionPrompt}`;
    } else if (type === 'analyze') {
      finalPrompt += `\n\n${analysisPrompt}`;
    } else if (type === 'autopilot') {
      finalPrompt += `\n\n${autopilotPrompt}`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: finalPrompt },
          ...messages,
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Créditos insuficientes. Por favor, adicione créditos à sua conta.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    console.log('AI response generated successfully');

    return new Response(JSON.stringify({ 
      content,
      model: data.model,
      usage: data.usage,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Assistant error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
