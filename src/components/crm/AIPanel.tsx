import { useState, useRef, useEffect } from 'react';
import { Sparkles, Copy, Send, ChevronRight, CreditCard, User, RefreshCw, MessageCircle, Power, Bot, FileText, Map, Zap, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { AISuggestion, Conversation, TravelPackage, AIChatMessage } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';
import { QuoteSearchModal } from './QuoteSearchModal';
import { QuoteGeneratorModal } from './QuoteGeneratorModal';
import { ItineraryCreatorModal } from './ItineraryCreatorModal';
import { PDFExportModal } from './PDFExportModal';

interface AIPanelProps {
  conversation: Conversation | null;
  suggestions: AISuggestion[];
  packages: TravelPackage[];
  onUseSuggestion: (suggestion: AISuggestion) => void;
  aiEnabled: boolean;
  onToggleAI: (enabled: boolean) => void;
}

const suggestionIcons = {
  response: Send,
  action: ChevronRight,
  info: User,
};

const suggestionColors = {
  response: 'border-primary/20 bg-primary/5 hover:bg-primary/10',
  action: 'border-accent/20 bg-accent/5 hover:bg-accent/10',
  info: 'border-info/20 bg-info/5 hover:bg-info/10',
};

// Mock AI responses for demonstration
const mockAIResponses: Record<string, string> = {
  default: "Analisando o contexto da conversa, posso ajudar com informações sobre destinos, preços e disponibilidade. O que você gostaria de saber?",
  mercado: "O mercado de turismo está em alta! Os destinos mais procurados são: Maldivas (+45%), Cancún (+32%) e Fernando de Noronha (+28%). O ticket médio subiu 15% este mês.",
  cliente: "Este cliente demonstra interesse em viagens de família. Baseado no histórico, recomendo pacotes com atividades para crianças e resorts all-inclusive.",
  preco: "Para o destino mencionado, temos opções a partir de R$ 3.500 por pessoa (7 noites). Posso gerar um orçamento personalizado se desejar.",
};

export function AIPanel({ conversation, suggestions, packages, onUseSuggestion, aiEnabled, onToggleAI }: AIPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'chat'>('suggestions');
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Modal states
  const [showQuoteSearch, setShowQuoteSearch] = useState(false);
  const [showQuoteGenerator, setShowQuoteGenerator] = useState(false);
  const [showItineraryCreator, setShowItineraryCreator] = useState(false);
  const [showPDFExport, setShowPDFExport] = useState(false);
  const [quoteGeneratorData, setQuoteGeneratorData] = useState<{ type: string; title: string; details: string; price?: number } | undefined>();
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);

  // Mock AI analysis for pre-filling search
  const aiAnalysis = conversation ? {
    destination: conversation.lastMessage.includes('Cancún') ? 'Cancún' : 
                 conversation.lastMessage.includes('Paris') ? 'Paris' : 'Rio de Janeiro',
    checkIn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    adults: 2,
    children: 0,
  } : undefined;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    // Reset chat when conversation changes
    setChatMessages([]);
  }, [conversation?.id]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Texto copiado para a área de transferência.',
    });
  };

  const handleRefresh = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 1500);
  };

  const handleSendAIMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: AIChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let response = mockAIResponses.default;
      const lowerInput = inputMessage.toLowerCase();
      
      if (lowerInput.includes('mercado') || lowerInput.includes('tendência')) {
        response = mockAIResponses.mercado;
      } else if (lowerInput.includes('cliente') || lowerInput.includes('perfil')) {
        response = mockAIResponses.cliente;
      } else if (lowerInput.includes('preço') || lowerInput.includes('valor') || lowerInput.includes('orçamento')) {
        response = mockAIResponses.preco;
      }

      const aiMessage: AIChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleGenerateQuoteFromSearch = (data: { type: string; title: string; details: string; price?: number }) => {
    setQuoteGeneratorData(data);
    setShowQuoteGenerator(true);
  };

  const handleGenerateQuoteFromItinerary = (data: { type: string; title: string; details: string }) => {
    setQuoteGeneratorData({ ...data, price: 0 });
    setShowQuoteGenerator(true);
  };

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center border-l border-border bg-card p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-ai-start to-ai-end">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Assistente IA</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Selecione uma conversa para receber sugestões inteligentes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border-l border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-ai-start to-ai-end">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Assistente IA</h3>
            <p className="text-xs text-muted-foreground">
              {aiEnabled ? 'IA Ativa' : 'IA Desativada'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleRefresh}
            className={cn(
              'text-muted-foreground hover:text-primary',
              isAnalyzing && 'animate-spin'
            )}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* AI Toggle */}
      <div className="border-b border-border p-3 space-y-2">
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2">
            <Power className={cn("h-4 w-4", aiEnabled ? "text-success" : "text-muted-foreground")} />
            <Label htmlFor="ai-toggle" className="text-sm font-medium cursor-pointer">
              IA para {conversation.contact.name.split(' ')[0]}
            </Label>
          </div>
          <Switch
            id="ai-toggle"
            checked={aiEnabled}
            onCheckedChange={onToggleAI}
          />
        </div>
        
        {/* Autopilot Toggle */}
        <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-ai-start/10 to-ai-end/10 p-3 border border-primary/20">
          <div className="flex items-center gap-2">
            <Zap className={cn("h-4 w-4", autopilotEnabled ? "text-warning animate-pulse" : "text-muted-foreground")} />
            <div>
              <Label htmlFor="autopilot-toggle" className="text-sm font-medium cursor-pointer">
                Piloto Automático
              </Label>
              <p className="text-xs text-muted-foreground">IA responde diretamente</p>
            </div>
          </div>
          <Switch
            id="autopilot-toggle"
            checked={autopilotEnabled}
            onCheckedChange={(checked) => {
              setAutopilotEnabled(checked);
              if (checked) {
                onToggleAI(true);
                toast({
                  title: "Piloto Automático Ativado",
                  description: "A IA responderá automaticamente aos clientes.",
                });
              }
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'suggestions' | 'chat')} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-3 grid grid-cols-2">
          <TabsTrigger value="suggestions" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Sugestões
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" />
            Chat IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="flex-1 overflow-hidden m-0 p-0">
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin h-full">
            {/* AI Status */}
            <div className="mb-4 rounded-lg bg-gradient-to-r from-ai-start/10 to-ai-end/10 p-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'h-2 w-2 rounded-full',
                  aiEnabled ? 'bg-success animate-pulse-soft' : 'bg-muted-foreground'
                )} />
                <span className="text-sm font-medium text-foreground">
                  {isAnalyzing ? 'Analisando contexto...' : aiEnabled ? 'Análise concluída' : 'IA desativada'}
                </span>
              </div>
              {aiEnabled && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Cliente interessado em viagem familiar • Alta probabilidade de conversão
                </p>
              )}
            </div>

            {aiEnabled && (
              <>
                {/* Suggestions */}
                <div className="mb-6">
                  <h4 className="mb-3 text-sm font-semibold text-foreground">Sugestões</h4>
                  <div className="flex flex-col gap-2">
                    {suggestions.map((suggestion) => {
                      const Icon = suggestionIcons[suggestion.type];
                      return (
                        <Card
                          key={suggestion.id}
                          className={cn(
                            'cursor-pointer border transition-all animate-slide-up',
                            suggestionColors[suggestion.type]
                          )}
                          onClick={() => onUseSuggestion(suggestion)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-background">
                                <Icon className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-medium text-foreground">
                                    {suggestion.title}
                                  </span>
                                  <Badge variant="secondary" className="text-xs shrink-0">
                                    {suggestion.confidence}%
                                  </Badge>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                  {suggestion.content}
                                </p>
                              </div>
                            </div>
                            {suggestion.type === 'response' && (
                              <div className="mt-2 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 flex-1 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(suggestion.content);
                                  }}
                                >
                                  <Copy className="mr-1 h-3 w-3" />
                                  Copiar
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-7 flex-1 text-xs bg-primary hover:bg-primary/90"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUseSuggestion(suggestion);
                                  }}
                                >
                                  <Send className="mr-1 h-3 w-3" />
                                  Usar
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-6">
                  <h4 className="mb-3 text-sm font-semibold text-foreground">Ações Rápidas</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-auto flex-col gap-1 py-3"
                      onClick={() => setShowQuoteSearch(true)}
                    >
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-xs">Fazer Orçamento</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-auto flex-col gap-1 py-3"
                      onClick={() => setShowItineraryCreator(true)}
                    >
                      <Map className="h-4 w-4 text-primary" />
                      <span className="text-xs">Criar Roteiro</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-auto flex-col gap-1 py-3"
                      onClick={() => {
                        setQuoteGeneratorData(undefined);
                        setShowQuoteGenerator(true);
                      }}
                    >
                      <CreditCard className="h-4 w-4 text-primary" />
                      <span className="text-xs">Gerar Orçamento</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-auto flex-col gap-1 py-3"
                      onClick={() => setShowPDFExport(true)}
                    >
                      <FileDown className="h-4 w-4 text-primary" />
                      <span className="text-xs">Exportar PDF</span>
                    </Button>
                  </div>
                </div>

                {/* Recommended Packages */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-foreground">Pacotes Recomendados</h4>
                  <div className="flex flex-col gap-2">
                    {packages.map((pkg) => (
                      <Card key={pkg.id} className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm text-foreground">{pkg.destination}</p>
                              <p className="text-xs text-muted-foreground">{pkg.duration}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-primary">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(pkg.price)}
                              </p>
                              <p className="text-xs text-muted-foreground">por pessoa</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!aiEnabled && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Power className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Ative a IA para receber sugestões personalizadas para este cliente
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0 p-0">
          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bot className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">
                  Chat com a IA
                </p>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Faça perguntas sobre o atendimento, mercado ou peça informações
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-2.5',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    )}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className={cn(
                      'text-[10px] mt-1',
                      msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}>
                      {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <Input
                placeholder="Pergunte sobre o atendimento..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendAIMessage();
                  }
                }}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={handleSendAIMessage}
                disabled={!inputMessage.trim() || isTyping}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <QuoteSearchModal
        open={showQuoteSearch}
        onClose={() => setShowQuoteSearch(false)}
        aiAnalysis={aiAnalysis}
        onGenerateQuote={handleGenerateQuoteFromSearch}
      />

      <QuoteGeneratorModal
        open={showQuoteGenerator}
        onClose={() => {
          setShowQuoteGenerator(false);
          setQuoteGeneratorData(undefined);
        }}
        prefillData={quoteGeneratorData}
      />

      <ItineraryCreatorModal
        open={showItineraryCreator}
        onClose={() => setShowItineraryCreator(false)}
        onGenerateQuote={handleGenerateQuoteFromItinerary}
      />

      <PDFExportModal
        open={showPDFExport}
        onClose={() => setShowPDFExport(false)}
      />
    </div>
  );
}
