import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Send, Paperclip, Smile, MoreVertical, Phone, Video, ShoppingCart, CheckCircle2, Loader2, FileAudio, Languages } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Conversation, Message } from '@/types/crm';
import { CompleteSaleModal } from './CompleteSaleModal';
import { CompleteServiceModal } from './CompleteServiceModal';
import { useWhatsAppMessages, WhatsAppMessage } from '@/hooks/useWhatsAppMessages';
import { InternalNotesPanel } from './InternalNotesPanel';
import { useConversationEvents, ConversationEvent } from '@/hooks/useConversationEvents';
import { ConversationEventItem } from './ConversationEventItem';
import { EmojiPicker } from './EmojiPicker';
import { AudioRecorder } from './AudioRecorder';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatWindowProps {
  conversation: Conversation | null;
  onSendMessage: (content: string) => void;
  onServiceCompleted?: (conversationId: string) => void;
  capturedDocumentData?: {
    name?: string;
    cpf?: string;
    birthDate?: string;
  } | null;
}

// Map WhatsApp message to CRM Message format
const mapWhatsAppMessage = (msg: WhatsAppMessage): Message & { metadata?: Record<string, unknown> } => ({
  id: msg.id,
  conversationId: msg.conversation_id,
  content: msg.content,
  timestamp: new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  sender: msg.sender === 'agent' ? 'user' : 'contact',
  status: msg.status === 'read' ? 'read' : msg.status === 'delivered' ? 'delivered' : 'sent',
  type: msg.message_type as 'text' | 'image' | 'document' | 'audio',
  metadata: msg.metadata,
});

function AudioMessageBubble({ message, metadata }: { message: Message; metadata?: Record<string, unknown> }) {
  const isUser = message.sender === 'user';
  const [transcription, setTranscription] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const { toast } = useToast();

  // Try to get audio URL from metadata
  const audioUrl = (metadata as Record<string, unknown>)?.downloadUrl as string | undefined;

  const handleTranscribe = async () => {
    setTranscribing(true);
    try {
      const body: Record<string, string> = {};
      if (audioUrl) {
        body.audioUrl = audioUrl;
      }
      
      const { data, error } = await supabase.functions.invoke('transcribe-audio', { body });
      if (error) throw error;
      
      if (data?.transcription) {
        setTranscription(data.transcription);
      }
    } catch (err) {
      console.error('Transcription error:', err);
      toast({ title: 'Erro na transcrição', variant: 'destructive' });
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <div className={cn('flex animate-slide-up', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[70%] rounded-2xl px-4 py-2.5 shadow-soft',
        isUser ? 'rounded-br-md bg-chat-out text-foreground' : 'rounded-bl-md bg-chat-in text-foreground'
      )}>
        <div className="flex items-center gap-2">
          <FileAudio className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm">🎵 Mensagem de áudio</span>
        </div>
        {audioUrl && (
          <audio controls className="mt-2 max-w-full h-8" preload="none">
            <source src={audioUrl} />
          </audio>
        )}
        {!isUser && !transcription && (
          <Button
            size="sm"
            variant="ghost"
            className="mt-1 text-xs gap-1 h-6 px-2 text-primary"
            onClick={handleTranscribe}
            disabled={transcribing}
          >
            {transcribing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
            {transcribing ? 'Transcrevendo...' : 'Transcrever'}
          </Button>
        )}
        {transcription && (
          <p className="mt-1.5 text-xs italic text-muted-foreground border-t border-border/50 pt-1.5">
            📝 {transcription}
          </p>
        )}
        <div className={cn('mt-1 flex items-center gap-1 text-xs text-muted-foreground', isUser && 'justify-end')}>
          <span>{message.timestamp}</span>
          {isUser && message.status && (
            <span className="text-primary">
              {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, metadata }: { message: Message; metadata?: Record<string, unknown> }) {
  const isUser = message.sender === 'user';

  if (message.type === 'audio') {
    return <AudioMessageBubble message={message} metadata={metadata} />;
  }

  return (
    <div className={cn('flex animate-slide-up', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[70%] rounded-2xl px-4 py-2.5 shadow-soft',
        isUser ? 'rounded-br-md bg-chat-out text-foreground' : 'rounded-bl-md bg-chat-in text-foreground'
      )}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <div className={cn('mt-1 flex items-center gap-1 text-xs text-muted-foreground', isUser && 'justify-end')}>
          <span>{message.timestamp}</span>
          {isUser && message.status && (
            <span className="text-primary">
              {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatWindow({ conversation, onSendMessage, onServiceCompleted, capturedDocumentData }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [showCompleteSale, setShowCompleteSale] = useState(false);
  const [showCompleteService, setShowCompleteService] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sendingAudio, setSendingAudio] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { 
    messages: whatsappMessages, 
    loading, 
    sending, 
    sendMessage: sendWhatsAppMessage,
    loadMessages 
  } = useWhatsAppMessages(conversation?.id);

  const { events, loading: eventsLoading } = useConversationEvents(conversation?.id);

  const mappedMessages = whatsappMessages.map(mapWhatsAppMessage);
  const displayMessages = mappedMessages.length > 0 ? mappedMessages : conversation?.messages || [];

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  const getChatId = (): string | null => {
    if (conversation?.chatId) return conversation.chatId;
    const phone = conversation?.contact.phone?.replace(/\D/g, '');
    return phone ? `${phone}@c.us` : null;
  };

  const handleSend = async () => {
    if (!message.trim() || !conversation) return;
    const chatId = getChatId();
    if (chatId) {
      const result = await sendWhatsAppMessage(chatId, message, conversation.id);
      if (result.success) setMessage('');
    } else {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSendAudio = useCallback(async (audioBase64: string) => {
    if (!conversation) return;
    const chatId = getChatId();
    if (!chatId) {
      toast({ title: 'Não foi possível identificar o destinatário', variant: 'destructive' });
      return;
    }

    setSendingAudio(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-send-audio', {
        body: { chatId, audioBase64, conversationId: conversation.id },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Falha ao enviar áudio');
      toast({ title: 'Áudio enviado!' });
    } catch (err) {
      console.error('Error sending audio:', err);
      toast({ title: 'Erro ao enviar áudio', variant: 'destructive' });
    } finally {
      setSendingAudio(false);
    }
  }, [conversation, toast]);

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-chat-bg">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Send className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">TravelChat CRM</h3>
          <p className="mt-2 text-muted-foreground">
            Selecione uma conversa para começar o atendimento
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-chat-bg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-3 sm:px-4 py-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Avatar className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
              {conversation.contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{conversation.contact.name}</h3>
            <div className="flex items-center gap-2">
              {conversation.contact.status === 'online' ? (
                <span className="flex items-center gap-1 text-xs text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Online
                </span>
              ) : (
                <span className="text-xs text-muted-foreground truncate">
                  {conversation.contact.lastSeen || 'Offline'}
                </span>
              )}
              <div className="hidden sm:flex items-center gap-2">
                {conversation.contact.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" className="gap-1.5 text-xs bg-success hover:bg-success/90 hidden sm:flex" onClick={() => setShowCompleteSale(true)}>
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden md:inline">Concluir Venda</span>
          </Button>
          <Button size="icon" className="sm:hidden h-8 w-8 bg-success hover:bg-success/90" onClick={() => setShowCompleteSale(true)}>
            <ShoppingCart className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs hidden sm:flex border-primary text-primary hover:bg-primary/10" onClick={() => setShowCompleteService(true)}>
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden md:inline">Concluir Atendimento</span>
          </Button>
          <Button size="icon" variant="outline" className="sm:hidden h-8 w-8 border-primary text-primary hover:bg-primary/10" onClick={() => setShowCompleteService(true)}>
            <CheckCircle2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary hidden sm:flex h-8 w-8">
            <Phone className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary hidden sm:flex h-8 w-8">
            <Video className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary h-8 w-8">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages & Events Timeline */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {loading || eventsLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayMessages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                metadata={(msg as Message & { metadata?: Record<string, unknown> }).metadata}
              />
            ))}
            
            {events.length > 0 && (
              <div className="border-t border-dashed border-muted-foreground/20 pt-3 mt-2">
                <p className="text-center text-xs text-muted-foreground mb-2">Histórico de Eventos</p>
                {events.map((event) => (
                  <ConversationEventItem key={event.id} event={event} />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Internal Notes Panel */}
      <InternalNotesPanel conversationId={conversation.id} />

      {/* Input */}
      <div className="border-t border-border bg-card p-2 sm:p-3">
        <div className="flex items-end gap-1 sm:gap-2 relative">
          <div className="relative">
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-primary h-8 w-8 sm:h-10 sm:w-10"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-5 w-5" />
            </Button>
            {showEmojiPicker && (
              <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
            )}
          </div>
          <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary h-8 w-8 sm:h-10 sm:w-10">
            <Paperclip className="h-5 w-5" />
          </Button>
          {message.trim() ? (
            <>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Digite uma mensagem..."
                className="flex-1 bg-muted/50 border-transparent focus:border-primary text-sm sm:text-base min-h-[40px] max-h-[120px] resize-none py-2"
                rows={1}
              />
              <Button 
                size="icon" 
                onClick={handleSend} 
                disabled={sending}
                className="bg-primary hover:bg-primary/90 h-8 w-8 sm:h-10 sm:w-10 self-end"
              >
                {sending ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : <Send className="h-4 w-4 sm:h-5 sm:w-5" />}
              </Button>
            </>
          ) : (
            <>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Digite uma mensagem..."
                className="flex-1 bg-muted/50 border-transparent focus:border-primary text-sm sm:text-base min-h-[40px] max-h-[120px] resize-none py-2"
                rows={1}
              />
              <AudioRecorder onSend={handleSendAudio} sending={sendingAudio} />
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <CompleteSaleModal
        open={showCompleteSale}
        onClose={() => setShowCompleteSale(false)}
        contactName={conversation.contact.name}
        capturedClientData={capturedDocumentData || undefined}
      />
      <CompleteServiceModal
        open={showCompleteService}
        onClose={() => setShowCompleteService(false)}
        onComplete={() => {
          if (conversation) {
            onServiceCompleted?.(conversation.id);
          }
        }}
        conversation={conversation}
      />
    </div>
  );
}
