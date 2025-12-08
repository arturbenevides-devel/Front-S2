import { useState } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface TagManagerProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags?: string[];
}

const defaultTags = [
  'VIP',
  'Frequente',
  'Corporativo',
  'Lua de Mel',
  'Família',
  'Grupo',
  'Primeira Viagem',
  'SDR IA',
  'Lead Qualificado',
  'Urgente',
];

export function TagManager({ tags, onTagsChange, availableTags = defaultTags }: TagManagerProps) {
  const [newTag, setNewTag] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      onTagsChange([...tags, tag]);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleCreateTag = () => {
    if (newTag.trim()) {
      handleAddTag(newTag.trim());
    }
  };

  const unusedTags = availableTags.filter((tag) => !tags.includes(tag));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Tag className="h-4 w-4" />
          Etiquetas do Cliente
        </div>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 gap-1">
              <Plus className="h-3 w-3" />
              Adicionar
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Nova etiqueta..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateTag();
                    }
                  }}
                  className="h-8 text-sm"
                />
                <Button 
                  size="sm" 
                  onClick={handleCreateTag}
                  disabled={!newTag.trim()}
                  className="h-8"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              {unusedTags.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">Etiquetas disponíveis:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {unusedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => {
                          handleAddTag(tag);
                          setIsOpen(false);
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1 pr-1 text-xs"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Nenhuma etiqueta adicionada
        </p>
      )}
    </div>
  );
}
