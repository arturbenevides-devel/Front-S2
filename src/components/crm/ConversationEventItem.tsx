import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowRightLeft, 
  Tag, 
  FileText, 
  Send, 
  Activity, 
  FolderOpen, 
  Bot, 
  DollarSign, 
  CheckCircle, 
  StickyNote,
  Pin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConversationEvent, EventType, EVENT_LABELS } from '@/hooks/useConversationEvents';

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

const EVENT_ICON_COMPONENTS: Record<EventType, React.ComponentType<{ className?: string }>> = {
  agent_transfer: ArrowRightLeft,
  tag_added: Tag,
  tag_removed: Tag,
  quote_created: FileText,
  quote_sent: Send,
  status_changed: Activity,
  category_changed: FolderOpen,
  ai_enabled: Bot,
  ai_disabled: Bot,
  sale_completed: DollarSign,
  service_completed: CheckCircle,
  note_added: StickyNote,
  custom: Pin,
};

const EVENT_COLORS: Record<EventType, string> = {
  agent_transfer: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  tag_added: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
  tag_removed: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
  quote_created: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
  quote_sent: 'bg-green-500/20 text-green-600 border-green-500/30',
  status_changed: 'bg-cyan-500/20 text-cyan-600 border-cyan-500/30',
  category_changed: 'bg-indigo-500/20 text-indigo-600 border-indigo-500/30',
  ai_enabled: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
  ai_disabled: 'bg-red-500/20 text-red-600 border-red-500/30',
  sale_completed: 'bg-success/20 text-success border-success/30',
  service_completed: 'bg-primary/20 text-primary border-primary/30',
  note_added: 'bg-orange-500/20 text-orange-600 border-orange-500/30',
  custom: 'bg-muted text-muted-foreground border-muted-foreground/30',
};

function formatEventDetails(event: ConversationEvent): string {
  const rawData = event.event_data;
  const data = (typeof rawData === 'object' && rawData !== null && !Array.isArray(rawData)) 
    ? rawData as Record<string, Json>
    : {};
  const eventType = event.event_type as EventType;

  const getString = (key: string): string => {
    const val = data[key];
    return typeof val === 'string' ? val : (val !== undefined ? String(val) : 'N/A');
  };

  switch (eventType) {
    case 'agent_transfer':
      return `De: ${getString('from_agent')} → Para: ${getString('to_agent')}`;
    case 'tag_added':
    case 'tag_removed':
      return `Etiqueta: ${getString('tag')}`;
    case 'quote_created':
      return `Orçamento #${getString('quote_id')} - ${getString('destination')} - R$ ${getString('value')}`;
    case 'quote_sent':
      return `Orçamento #${getString('quote_id')} enviado ao cliente`;
    case 'status_changed':
      return `${getString('from_status')} → ${getString('to_status')}`;
    case 'category_changed':
      return `${getString('from_category')} → ${getString('to_category')}`;
    case 'ai_enabled':
      return 'Assistente de IA ativado para esta conversa';
    case 'ai_disabled':
      return 'Assistente de IA desativado para esta conversa';
    case 'sale_completed':
      return `Venda concluída - R$ ${getString('value')} - ${getString('destination')}`;
    case 'service_completed':
      return `Motivo: ${getString('reason')}`;
    case 'note_added':
      return getString('preview');
    case 'custom':
      return getString('description');
    default:
      return typeof rawData === 'object' ? JSON.stringify(rawData) : String(rawData);
  }
}

interface ConversationEventItemProps {
  event: ConversationEvent;
}

export function ConversationEventItem({ event }: ConversationEventItemProps) {
  const eventType = event.event_type as EventType;
  const IconComponent = EVENT_ICON_COMPONENTS[eventType] || Pin;
  const colorClass = EVENT_COLORS[eventType] || EVENT_COLORS.custom;
  const label = EVENT_LABELS[eventType] || 'Evento';

  const formattedDate = format(new Date(event.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  return (
    <div className="flex justify-center my-3 animate-fade-in">
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs max-w-[85%]',
          colorClass
        )}
      >
        <IconComponent className="h-3.5 w-3.5 shrink-0" />
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{label}</span>
            <span className="text-[10px] opacity-70">•</span>
            <span className="opacity-70">{formattedDate}</span>
          </div>
          <p className="opacity-90 truncate">{formatEventDetails(event)}</p>
          {event.actor_name && (
            <p className="text-[10px] opacity-60">
              Por: {event.actor_name} ({event.actor_department})
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
