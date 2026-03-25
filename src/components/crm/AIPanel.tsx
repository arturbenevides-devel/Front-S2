import { useState, useRef, useEffect, useMemo } from 'react';
import { WhatsAppMessage } from '@/hooks/useWhatsAppMessages';
import { Sparkles, Copy, Send, ChevronRight, CreditCard, User, RefreshCw, MessageCircle, Power, Bot, FileText, Map, Zap, FileDown, ScanText, Image, Loader2 } from 'lucide-react';
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
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { QuoteSearchModal } from './QuoteSearchModal';
import { QuoteGeneratorModal } from './QuoteGeneratorModal';
import { ItineraryCreatorModal } from './ItineraryCreatorModal';
import { PDFExportModal } from './PDFExportModal';
import { TagManager } from './TagManager';
import { ImageReaderModal } from './ImageReaderModal';

interface AIPanelProps {
  conversation: Conversation | null;
  suggestions: AISuggestion[];
  packages: TravelPackage[];
  onUseSuggestion: (suggestion: AISuggestion) => void;
  aiEnabled: boolean;
  onToggleAI: (enabled: boolean) => void;
  onUpdateTags?: (conversationId: string, tags: string[]) => void;
  onDocumentDataCaptured?: (data: { name?: string; cpf?: string; birthDate?: string }) => void;
  whatsappMessages?: WhatsAppMessage[];
  autopilotEnabled?: boolean;
  onAutopilotToggle?: (enabled: boolean) => void;
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

export function AIPanel({ 
  conversation, 
  suggestions, 
  packages, 
  onUseSuggestion, 
  aiEnabled, 
  onToggleAI, 
  onUpdateTags, 
  onDocumentDataCaptured,
  whatsappMessages = [],
  autopilotEnabled = false,
  onAutopilotToggle,
}: AIPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'chat'>('suggestions');
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { sendMessage: sendAIMessage, generateSuggestions, analyzeConversation, isLoading: isAILoading } = useAIAssistant();

  // Modal states
  const [showQuoteSearch, setShowQuoteSearch] = useState(false);
  const [showQuoteGenerator, setShowQuoteGenerator] = useState(false);
  const [showItineraryCreator, setShowItineraryCreator] = useState(false);
  const [showPDFExport, setShowPDFExport] = useState(false);
  const [showImageReader, setShowImageReader] = useState(false);
  const [quoteGeneratorData, setQuoteGeneratorData] = useState<{ type: string; title: string; details: string; price?: number } | undefined>();
  const [capturedDocumentData, setCapturedDocumentData] = useState<{
    name?: string;
    cpf?: string;
    birthDate?: string;
  } | null>(null);
  
  // AI-generated content
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isAnalyzingConversation, setIsAnalyzingConversation] = useState(false);

  // Detect images in conversation messages
  const detectedImages = useMemo(() => {
    if (!conversation) return [];
    
    // Simulate detecting image messages (in real app, check for image URLs or attachments)
    const imageKeywords = ['imagem', 'foto', 'documento', 'rg', 'cpf', 'passaporte', 'cnh', 'anexo', 'enviando'];
    return conversation.messages.filter((msg) => {
      const text = (msg.content ?? '').toLowerCase();
      return msg.sender === 'contact' && imageKeywords.some((keyword) => text.includes(keyword));
    });
  }, [conversation]);

  // Mock AI analysis for pre-filling search
  const quoteAnalysis = conversation ? {
    destination: (conversation.lastMessage ?? '').includes('Cancún')
      ? 'Cancún'
      : (conversation.lastMessage ?? '').includes('Paris')
        ? 'Paris'
        : 'Rio de Janeiro',
    checkIn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    adults: 2,
    children: 0,
  } : undefined;

  // Get conversation context for AI - use real WhatsApp messages
  const getConversationContext = () => {
    if (!conversation) return undefined;
    
    // Use real WhatsApp messages if available, fallback to conversation.messages
    const recentMessages = whatsappMessages.length > 0
      ? whatsappMessages.slice(-15).map(m => ({
          sender: m.sender === 'agent' ? 'user' : 'contact',
          content: m.content,
        }))
      : conversation.messages.slice(-15).map(m => ({
          sender: m.sender,
          content: m.content,
        }));

    return {
      contactName: conversation.contact.name,
      category: conversation.category,
      recentMessages,
    };
  };

  // Auto-generate suggestions when AI is enabled and conversation changes
  useEffect(() => {
    if (aiEnabled && conversation && !aiSuggestions && !isGeneratingSuggestions) {
      handleGenerateSuggestions();
    }
  }, [conversation?.id, aiEnabled]);

  // Reset AI content when conversation changes
  useEffect(() => {
    setChatMessages([]);
    setAiSuggestions(null);
    setAiAnalysis(null);
  }, [conversation?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Texto copiado para a área de transferência.',
    });
  };

  // Generate AI suggestions
  const handleGenerateSuggestions = async () => {
    const context = getConversationContext();
    if (!context) return;
    
    setIsGeneratingSuggestions(true);
    const result = await generateSuggestions(context);
    setAiSuggestions(result);
    setIsGeneratingSuggestions(false);
  };

  // Analyze conversation with AI
  const handleAnalyzeConversation = async () => {
    const context = getConversationContext();
    if (!context) return;
    
    setIsAnalyzingConversation(true);
    const result = await analyzeConversation(context);
    setAiAnalysis(result);
    setIsAnalyzingConversation(false);
  };

  const handleRefresh = async () => {
    setIsAnalyzing(true);
    setAiSuggestions(null);
    setAiAnalysis(null);
    await handleGenerateSuggestions();
    setIsAnalyzing(false);
  };

  const handleSendAIMessage = async () => {
    if (!inputMessage.trim() || isAILoading) return;

    const userMessage: AIChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage('');

    // Build context from conversation using real WhatsApp messages
    const conversationContext = conversation ? {
      contactName: conversation.contact.name,
      category: conversation.category,
      recentMessages: whatsappMessages.length > 0
        ? whatsappMessages.slice(-10).map(m => ({
            sender: m.sender === 'agent' ? 'user' : 'contact',
            content: m.content,
          }))
        : conversation.messages.slice(-10).map(m => ({
            sender: m.sender,
            content: m.content,
          })),
    } : undefined;

    // Build messages array for AI
    const aiMessages = chatMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    aiMessages.push({ role: 'user', content: messageToSend });

    const response = await sendAIMessage(aiMessages, conversationContext);

    if (response) {
      const aiMessage: AIChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, aiMessage]);
    }
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
    <div className="flex h-full flex-col border-l border-border bg-card overflow-hidden">
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

      {/* AI Toggle & Autopilot - Side by Side */}
      <div className="border-b border-border p-2">
        <div className="flex gap-2">
          {/* AI Toggle */}
          <div className="flex-1 flex items-center justify-between rounded-lg bg-muted/50 px-2 py-1.5">
            <div className="flex items-center gap-1.5">
              <Power className={cn("h-3.5 w-3.5", aiEnabled ? "text-success" : "text-muted-foreground")} />
              <Label htmlFor="ai-toggle" className="text-xs font-medium cursor-pointer">
                IA
              </Label>
            </div>
            <Switch
              id="ai-toggle"
              checked={aiEnabled}
              onCheckedChange={onToggleAI}
              className="scale-90"
            />
          </div>
          
          {/* Autopilot Toggle */}
          <div className="flex-1 flex items-center justify-between rounded-lg bg-gradient-to-r from-ai-start/10 to-ai-end/10 px-2 py-1.5 border border-primary/20">
            <div className="flex items-center gap-1.5">
              <Zap className={cn("h-3.5 w-3.5", autopilotEnabled ? "text-warning animate-pulse" : "text-muted-foreground")} />
              <Label htmlFor="autopilot-toggle" className="text-xs font-medium cursor-pointer">
                Auto
              </Label>
            </div>
            <Switch
              id="autopilot-toggle"
              checked={autopilotEnabled}
              onCheckedChange={(checked) => {
                onAutopilotToggle?.(checked);
                if (checked) {
                  onToggleAI(true);
                  toast({
                    title: "Piloto Automático Ativado",
                    description: "A IA responderá automaticamente aos clientes.",
                  });
                } else {
                  toast({
                    title: "Piloto Automático Desativado",
                    description: "A IA não responderá mais automaticamente.",
                  });
                }
              }}
              className="scale-90"
            />
          </div>
        </div>

        {/* Tag Manager */}
        <div className="mt-2">
          <TagManager
            tags={conversation.contact.tags || []}
            onTagsChange={(tags) => onUpdateTags?.(conversation.id, tags)}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'suggestions' | 'chat')} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-3 mt-2 grid grid-cols-2 shrink-0">
          <TabsTrigger value="suggestions" className="gap-1.5 text-xs">
            <Sparkles className="h-3 w-3" />
            Sugestões
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5 text-xs">
            <MessageCircle className="h-3 w-3" />
            Chat IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="overflow-auto mt-0 px-3 pb-3 pt-2">
          {/* AI Status */}
          <div className="mb-3 rounded-lg bg-gradient-to-r from-ai-start/10 to-ai-end/10 p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'h-2 w-2 rounded-full',
                    aiEnabled ? 'bg-success animate-pulse-soft' : 'bg-muted-foreground'
                  )} />
                  <span className="text-xs font-medium text-foreground">
                    {isAnalyzing || isGeneratingSuggestions ? 'Analisando...' : aiEnabled ? 'IA Ativa' : 'IA desativada'}
                  </span>
                </div>
                {aiEnabled && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs gap-1"
                    onClick={handleAnalyzeConversation}
                    disabled={isAnalyzingConversation}
                  >
                    {isAnalyzingConversation ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    Analisar
                  </Button>
                )}
              </div>
            </div>

            {aiEnabled && (
              <>
                {/* Detected Images Card */}
                {detectedImages.length > 0 && (
                  <Card className="mb-3 border-warning/30 bg-warning/5 animate-fade-in">
                    <CardContent className="p-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Image className="h-3.5 w-3.5 text-warning" />
                          <span className="text-xs font-medium text-foreground">
                            Documentos ({detectedImages.length})
                          </span>
                        </div>
                        <Button 
                          size="sm" 
                          className="h-7 gap-1.5 text-xs"
                          onClick={() => setShowImageReader(true)}
                        >
                          <ScanText className="h-3.5 w-3.5" />
                          Ler
                        </Button>
                      </div>
                      {capturedDocumentData && (
                        <div className="p-2 rounded-lg bg-background border border-success/30 animate-scale-in">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                            <p className="text-[10px] text-success font-medium">Capturado</p>
                          </div>
                          <div className="text-[11px] space-y-0.5 text-foreground">
                            {capturedDocumentData.name && <p><strong>Nome:</strong> {capturedDocumentData.name}</p>}
                            {capturedDocumentData.cpf && <p><strong>CPF:</strong> {capturedDocumentData.cpf}</p>}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* AI Analysis Result */}
                {aiAnalysis && (
                  <Card className="mb-3 border-primary/30 bg-primary/5 animate-fade-in">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-semibold text-foreground">Análise da Conversa</h4>
                      </div>
                      <p className="text-xs text-foreground whitespace-pre-wrap">{aiAnalysis}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs mt-2"
                        onClick={() => handleCopy(aiAnalysis)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* AI Suggestions */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-foreground">Sugestões IA</h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs gap-1"
                      onClick={handleGenerateSuggestions}
                      disabled={isGeneratingSuggestions}
                    >
                      {isGeneratingSuggestions ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      Gerar
                    </Button>
                  </div>
                  
                  {isGeneratingSuggestions && (
                    <Card className="border-muted">
                      <CardContent className="p-3 flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">Gerando sugestões...</span>
                      </CardContent>
                    </Card>
                  )}
                  
                  {aiSuggestions && !isGeneratingSuggestions && (
                    <Card className="border-success/30 bg-success/5 animate-fade-in">
                      <CardContent className="p-3">
                        <p className="text-xs text-foreground whitespace-pre-wrap">{aiSuggestions}</p>
                        <div className="mt-2 flex gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-6 text-[10px]"
                            onClick={() => handleCopy(aiSuggestions)}
                          >
                            <Copy className="mr-1 h-2.5 w-2.5" />
                            Copiar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Static Suggestions Fallback */}
                  {!aiSuggestions && !isGeneratingSuggestions && suggestions.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {suggestions.map((suggestion) => {
                        const Icon = suggestionIcons[suggestion.type];
                        return (
                          <Card
                            key={suggestion.id}
                            className={cn(
                              'cursor-pointer border transition-all',
                              suggestionColors[suggestion.type]
                            )}
                            onClick={() => onUseSuggestion(suggestion)}
                          >
                            <CardContent className="p-2">
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-background">
                                  <Icon className="h-3 w-3 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-xs font-medium text-foreground line-clamp-1">
                                      {suggestion.title}
                                    </span>
                                    <Badge variant="secondary" className="text-[10px] shrink-0 px-1 py-0">
                                      {suggestion.confidence}%
                                    </Badge>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                                    {suggestion.content}
                                  </p>
                                </div>
                              </div>
                              {suggestion.type === 'response' && (
                                <div className="mt-1.5 flex gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-6 flex-1 text-[10px]"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopy(suggestion.content);
                                    }}
                                  >
                                    <Copy className="mr-1 h-2.5 w-2.5" />
                                    Copiar
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-6 flex-1 text-[10px] bg-primary hover:bg-primary/90"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onUseSuggestion(suggestion);
                                    }}
                                  >
                                    <Send className="mr-1 h-2.5 w-2.5" />
                                    Usar
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div>
                  <h4 className="mb-2 text-xs font-semibold text-foreground">Ações Rápidas</h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-auto flex-col gap-0.5 py-2"
                      onClick={() => setShowQuoteSearch(true)}
                    >
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px]">Orçamento</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-auto flex-col gap-0.5 py-2"
                      onClick={() => setShowItineraryCreator(true)}
                    >
                      <Map className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px]">Roteiro</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-auto flex-col gap-0.5 py-2"
                      onClick={() => {
                        setQuoteGeneratorData(undefined);
                        setShowQuoteGenerator(true);
                      }}
                    >
                      <CreditCard className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px]">Gerar</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-auto flex-col gap-0.5 py-2"
                      onClick={() => setShowPDFExport(true)}
                    >
                      <FileDown className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px]">PDF</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-auto flex-col gap-0.5 py-2 col-span-2"
                      onClick={() => setShowImageReader(true)}
                    >
                      <ScanText className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px]">Ler Documentos</span>
                    </Button>
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
        </TabsContent>

        <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden mt-0">
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
              {isAILoading && (
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
                disabled={!inputMessage.trim() || isAILoading}
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
        aiAnalysis={quoteAnalysis}
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

      <ImageReaderModal
        open={showImageReader}
        onClose={() => setShowImageReader(false)}
        onDataExtracted={(data) => {
          const capturedData = {
            name: data.name,
            cpf: data.cpf,
            birthDate: data.birthDate,
          };
          setCapturedDocumentData(capturedData);
          onDocumentDataCaptured?.(capturedData);
          toast({
            title: "Dados Capturados",
            description: "Os dados do documento foram salvos e serão usados no Concluir Venda.",
          });
        }}
      />
    </div>
  );
}
