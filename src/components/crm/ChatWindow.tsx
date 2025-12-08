import { useState } from 'react';
import { Send, Paperclip, Smile, Mic, MoreVertical, Phone, Video, ScanText, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Conversation, Message } from '@/types/crm';
import { ImageReaderModal } from './ImageReaderModal';
import { CompleteSaleModal } from './CompleteSaleModal';
import { CompleteServiceModal } from './CompleteServiceModal';

interface ChatWindowProps {
  conversation: Conversation | null;
  onSendMessage: (content: string) => void;
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.sender === 'user';

  return (
    <div
      className={cn(
        'flex animate-slide-up',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2.5 shadow-soft',
          isUser
            ? 'rounded-br-md bg-chat-out text-foreground'
            : 'rounded-bl-md bg-chat-in text-foreground'
        )}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>
        <div
          className={cn(
            'mt-1 flex items-center gap-1 text-xs text-muted-foreground',
            isUser && 'justify-end'
          )}
        >
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

export function ChatWindow({ conversation, onSendMessage }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [showImageReader, setShowImageReader] = useState(false);
  const [showCompleteSale, setShowCompleteSale] = useState(false);
  const [showCompleteService, setShowCompleteService] = useState(false);
  const [capturedClientData, setCapturedClientData] = useState<{
    name?: string;
    cpf?: string;
    birthDate?: string;
  }>({});

  const handleSend = () => {
    if (message.trim()) {
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

  const handleImageCapture = (data: { name?: string; cpf?: string; birthDate?: string }) => {
    setCapturedClientData({
      name: data.name,
      cpf: data.cpf,
      birthDate: data.birthDate,
    });
  };

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
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-1.5 text-xs hidden sm:flex"
            onClick={() => setShowImageReader(true)}
          >
            <ScanText className="h-4 w-4" />
            <span className="hidden md:inline">Ler Imagens</span>
          </Button>
          <Button 
            size="icon" 
            variant="outline" 
            className="sm:hidden h-8 w-8"
            onClick={() => setShowImageReader(true)}
          >
            <ScanText className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            className="gap-1.5 text-xs bg-success hover:bg-success/90 hidden sm:flex"
            onClick={() => setShowCompleteSale(true)}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden md:inline">Concluir Venda</span>
          </Button>
          <Button 
            size="icon" 
            className="sm:hidden h-8 w-8 bg-success hover:bg-success/90"
            onClick={() => setShowCompleteSale(true)}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="gap-1.5 text-xs hidden sm:flex border-primary text-primary hover:bg-primary/10"
            onClick={() => setShowCompleteService(true)}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden md:inline">Concluir Atendimento</span>
          </Button>
          <Button 
            size="icon" 
            variant="outline"
            className="sm:hidden h-8 w-8 border-primary text-primary hover:bg-primary/10"
            onClick={() => setShowCompleteService(true)}
          >
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        <div className="flex flex-col gap-3">
          {conversation.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-2 sm:p-3">
        <div className="flex items-center gap-1 sm:gap-2">
          <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex">
            <Smile className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary h-8 w-8 sm:h-10 sm:w-10">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite uma mensagem..."
            className="flex-1 bg-muted/50 border-transparent focus:border-primary text-sm sm:text-base h-9 sm:h-10"
          />
          {message.trim() ? (
            <Button size="icon" onClick={handleSend} className="bg-primary hover:bg-primary/90 h-8 w-8 sm:h-10 sm:w-10">
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          ) : (
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary h-8 w-8 sm:h-10 sm:w-10">
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Modals */}
      <ImageReaderModal
        open={showImageReader}
        onClose={() => setShowImageReader(false)}
        onDataExtracted={handleImageCapture}
      />

      <CompleteSaleModal
        open={showCompleteSale}
        onClose={() => setShowCompleteSale(false)}
        contactName={conversation.contact.name}
        capturedClientData={capturedClientData}
      />

      <CompleteServiceModal
        open={showCompleteService}
        onClose={() => setShowCompleteService(false)}
        conversation={conversation}
      />
    </div>
  );
}
