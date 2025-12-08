import { Search, Filter, MessageSquarePlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Conversation } from '@/types/crm';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
}

const categoryColors = {
  lead: 'bg-info/10 text-info border-info/20',
  booking: 'bg-success/10 text-success border-success/20',
  support: 'bg-warning/10 text-warning border-warning/20',
  followup: 'bg-accent/10 text-accent border-accent/20',
};

const categoryLabels = {
  lead: 'Lead',
  booking: 'Reserva',
  support: 'Suporte',
  followup: 'Follow-up',
};

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-3 sm:p-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">Conversas</h2>
        <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary h-8 w-8 sm:h-10 sm:w-10">
          <MessageSquarePlus className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2 p-2 sm:p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            className="pl-9 bg-muted/50 border-transparent focus:border-primary h-9 sm:h-10 text-sm"
          />
        </div>
        <Button size="icon" variant="outline" className="shrink-0 h-9 w-9 sm:h-10 sm:w-10">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => onSelect(conversation)}
            className={cn(
              'flex cursor-pointer gap-2 sm:gap-3 border-b border-border/50 p-2 sm:p-3 transition-colors hover:bg-muted/50',
              selectedId === conversation.id && 'bg-primary/5 hover:bg-primary/10'
            )}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                  {conversation.contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              {conversation.contact.status === 'online' && (
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border-2 border-card bg-online" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground truncate">
                  {conversation.contact.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {conversation.lastMessageTime}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {conversation.lastMessage}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                {conversation.category && (
                  <Badge
                    variant="outline"
                    className={cn('text-xs font-normal', categoryColors[conversation.category])}
                  >
                    {categoryLabels[conversation.category]}
                  </Badge>
                )}
                {conversation.contact.tags?.slice(0, 1).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs font-normal"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Unread Badge */}
            {conversation.unreadCount > 0 && (
              <div className="flex items-start">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {conversation.unreadCount}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
