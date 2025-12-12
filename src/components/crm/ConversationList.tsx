import { useState } from 'react';
import { Search, Filter, MessageSquarePlus, X, Tag, Clock, CheckCheck, Circle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Conversation, ConversationReadStatus } from '@/types/crm';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { NewConversationModal } from './NewConversationModal';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  onClaimConversation?: (conversationId: string) => void;
  onNewConversation?: (conversationId: string) => void;
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

type StatusFilter = 'all' | ConversationReadStatus;

const statusFilters: { value: StatusFilter; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'Todas', icon: null },
  { value: 'pending', label: 'Pendentes', icon: <Clock className="h-3 w-3" /> },
  { value: 'unread', label: 'Não lidas', icon: <Circle className="h-3 w-3 fill-current" /> },
  { value: 'read', label: 'Lidas', icon: <CheckCheck className="h-3 w-3" /> },
];

// Collect all unique tags from conversations
const getAllTags = (conversations: Conversation[]): string[] => {
  const tagsSet = new Set<string>();
  conversations.forEach((conv) => {
    conv.contact.tags?.forEach((tag) => tagsSet.add(tag));
  });
  return Array.from(tagsSet).sort();
};

export function ConversationList({ conversations, selectedId, onSelect, onClaimConversation, onNewConversation }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);

  const allTags = getAllTags(conversations);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSearchQuery('');
    setStatusFilter('all');
  };

  // Count conversations by status
  const statusCounts = {
    all: conversations.length,
    pending: conversations.filter((c) => c.readStatus === 'pending').length,
    unread: conversations.filter((c) => c.readStatus === 'unread').length,
    read: conversations.filter((c) => c.readStatus === 'read').length,
  };

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      searchQuery === '' ||
      conv.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => conv.contact.tags?.includes(tag));

    const matchesStatus =
      statusFilter === 'all' || conv.readStatus === statusFilter;

    return matchesSearch && matchesTags && matchesStatus;
  });

  const hasActiveFilters = selectedTags.length > 0 || searchQuery !== '' || statusFilter !== 'all';

  const handleConversationClick = (conversation: Conversation) => {
    // If conversation is pending, claim it first
    if (conversation.readStatus === 'pending' && onClaimConversation) {
      onClaimConversation(conversation.id);
    }
    onSelect(conversation);
  };

  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-3 sm:p-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">Conversas</h2>
        <Button 
          size="icon" 
          variant="ghost" 
          className="text-muted-foreground hover:text-primary h-8 w-8 sm:h-10 sm:w-10"
          onClick={() => setIsNewConversationOpen(true)}
        >
          <MessageSquarePlus className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        open={isNewConversationOpen}
        onOpenChange={setIsNewConversationOpen}
        onConversationCreated={onNewConversation}
      />

      {/* Status Filter Tabs */}
      <div className="flex gap-1 px-2 py-1.5 border-b border-border overflow-x-auto scrollbar-none">
        {statusFilters.map((filter) => (
          <Button
            key={filter.value}
            size="sm"
            variant={statusFilter === filter.value ? 'default' : 'ghost'}
            className={cn(
              'h-7 px-2.5 text-xs whitespace-nowrap gap-1.5',
              statusFilter === filter.value 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.icon}
            {filter.label}
            {statusCounts[filter.value] > 0 && (
              <span className={cn(
                'ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                statusFilter === filter.value
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}>
                {statusCounts[filter.value]}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2 p-2 sm:p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/50 border-transparent focus:border-primary h-9 sm:h-10 text-sm"
          />
        </div>
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button 
              size="icon" 
              variant={hasActiveFilters ? "default" : "outline"} 
              className="shrink-0 h-9 w-9 sm:h-10 sm:w-10 relative"
            >
              <Filter className="h-4 w-4" />
              {selectedTags.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {selectedTags.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Tag className="h-4 w-4" />
                  Filtrar por Etiqueta
                </div>
                {selectedTags.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearFilters}
                    className="h-6 px-2 text-xs"
                  >
                    Limpar
                  </Button>
                )}
              </div>
              
              {allTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer text-xs transition-colors"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Nenhuma etiqueta encontrada
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-2 pb-2 sm:px-3 sm:pb-3">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1 pr-1 text-xs"
            >
              {tag}
              <button
                onClick={() => toggleTag(tag)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Tag className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhuma conversa encontrada</p>
            {hasActiveFilters && (
              <Button
                variant="link"
                size="sm"
                onClick={clearFilters}
                className="mt-1 text-xs"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleConversationClick(conversation)}
              className={cn(
                'flex cursor-pointer gap-2 sm:gap-3 border-b border-border/50 p-2 sm:p-3 transition-colors hover:bg-muted/50',
                selectedId === conversation.id && 'bg-primary/5 hover:bg-primary/10',
                conversation.readStatus === 'pending' && 'bg-warning/5 border-l-2 border-l-warning'
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
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  {conversation.category && (
                    <Badge
                      variant="outline"
                      className={cn('text-xs font-normal', categoryColors[conversation.category])}
                    >
                      {categoryLabels[conversation.category]}
                    </Badge>
                  )}
                  {conversation.contact.tags?.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs font-normal"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {(conversation.contact.tags?.length || 0) > 2 && (
                    <span className="text-xs text-muted-foreground">
                      +{(conversation.contact.tags?.length || 0) - 2}
                    </span>
                  )}
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
          ))
        )}
      </div>
    </div>
  );
}
