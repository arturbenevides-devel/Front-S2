import { useState } from 'react';
import { Sparkles, Copy, Send, ChevronRight, Plane, Map, CreditCard, User, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AISuggestion, Conversation, TravelPackage } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';

interface AIPanelProps {
  conversation: Conversation | null;
  suggestions: AISuggestion[];
  packages: TravelPackage[];
  onUseSuggestion: (suggestion: AISuggestion) => void;
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

export function AIPanel({ conversation, suggestions, packages, onUseSuggestion }: AIPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

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
            <p className="text-xs text-muted-foreground">Analisando conversa...</p>
          </div>
        </div>
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

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {/* AI Status */}
        <div className="mb-4 rounded-lg bg-gradient-to-r from-ai-start/10 to-ai-end/10 p-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              'h-2 w-2 rounded-full bg-success',
              isAnalyzing && 'animate-pulse-soft'
            )} />
            <span className="text-sm font-medium text-foreground">
              {isAnalyzing ? 'Analisando contexto...' : 'Análise concluída'}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Cliente interessado em viagem familiar • Alta probabilidade de conversão
          </p>
        </div>

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
            <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3">
              <Plane className="h-4 w-4 text-primary" />
              <span className="text-xs">Buscar Voos</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3">
              <Map className="h-4 w-4 text-primary" />
              <span className="text-xs">Ver Pacotes</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="text-xs">Gerar Orçamento</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3">
              <User className="h-4 w-4 text-primary" />
              <span className="text-xs">Perfil Cliente</span>
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
      </div>
    </div>
  );
}
