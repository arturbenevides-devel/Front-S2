import { useState, useEffect } from 'react';
import { MessageSquarePlus, Send, User, Building2, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// supabase removed — internal notes mocked
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InternalNote {
  id: string;
  conversation_id: string;
  author_name: string;
  author_department: string;
  content: string;
  created_at: string;
}

interface InternalNotesPanelProps {
  conversationId: string;
}

const DEPARTMENTS = [
  'Vendas',
  'Suporte',
  'Financeiro',
  'Operações',
  'Marketing',
  'Gerência',
  'TI',
  'Outro'
];

const DEPARTMENT_COLORS: Record<string, string> = {
  'Vendas': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Suporte': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Financeiro': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'Operações': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'Marketing': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'Gerência': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'TI': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  'Outro': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export function InternalNotesPanel({ conversationId }: InternalNotesPanelProps) {
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [authorName, setAuthorName] = useState(() => {
    return localStorage.getItem('crm_user_name') || '';
  });
  const [department, setDepartment] = useState(() => {
    return localStorage.getItem('crm_user_department') || 'Vendas';
  });

  // Load notes on mount and when conversation changes
  useEffect(() => {
    loadNotes();
  }, [conversationId]);

  // Save user preferences
  useEffect(() => {
    if (authorName) {
      localStorage.setItem('crm_user_name', authorName);
    }
  }, [authorName]);

  useEffect(() => {
    localStorage.setItem('crm_user_department', department);
  }, [department]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      // TODO: integrate with backend internal-notes endpoint
      console.warn('[MOCK] loadNotes — not yet integrated');
      setNotes([]);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast.error('Erro ao carregar notas internas');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNote = async () => {
    if (!newNote.trim() || !authorName.trim()) {
      toast.error('Preencha seu nome e a nota');
      return;
    }

    setSending(true);
    try {
      // TODO: integrate with backend internal-notes endpoint
      console.warn('[MOCK] handleSendNote — not yet integrated');
      setNewNote('');
      toast.success('Nota adicionada (mock)');
    } catch (error) {
      console.error('Error sending note:', error);
      toast.error('Erro ao adicionar nota');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      // TODO: integrate with backend internal-notes endpoint
      console.warn('[MOCK] handleDeleteNote — not yet integrated', noteId);
      toast.success('Nota removida (mock)');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Erro ao remover nota');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-between border-t border-border rounded-none h-10",
            isOpen && "bg-muted/50"
          )}
        >
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Notas Internas</span>
            {notes.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {notes.length}
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {isOpen ? 'Ocultar' : 'Expandir'}
          </span>
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="border-t border-border bg-muted/30 p-3 space-y-3">
          {/* Author Configuration */}
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-1">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Seu Nome</span>
              </div>
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Digite seu nome..."
                className="h-8 text-sm"
              />
            </div>
            <div className="w-32">
              <div className="flex items-center gap-1 mb-1">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Depto</span>
              </div>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes List */}
          <ScrollArea className="max-h-48">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhuma nota interna ainda
              </p>
            ) : (
              <div className="space-y-2">
                {notes.map((note) => (
                  <Card key={note.id} className="p-2 bg-background">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">
                            {note.author_name}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-xs h-5 px-1.5",
                              DEPARTMENT_COLORS[note.author_department] || DEPARTMENT_COLORS['Outro']
                            )}
                          >
                            {note.author_department}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(note.created_at)}
                          </span>
                        </div>
                        <p className="text-sm mt-1 text-foreground/90">
                          {note.content}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* New Note Input */}
          <div className="flex gap-2">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Adicionar nota interna (visível apenas para a equipe)..."
              className="flex-1 min-h-[60px] text-sm resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault();
                  handleSendNote();
                }
              }}
            />
            <Button
              size="icon"
              onClick={handleSendNote}
              disabled={sending || !newNote.trim() || !authorName.trim()}
              className="h-[60px] w-10"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Pressione Ctrl+Enter para enviar • Notas são visíveis apenas para a equipe
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
