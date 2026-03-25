import { useState } from 'react';
import { Phone, User, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// supabase removed — conversations mocked
import { toast } from 'sonner';

interface NewConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated?: (conversationId: string) => void;
}

export function NewConversationModal({ 
  open, 
  onOpenChange,
  onConversationCreated 
}: NewConversationModalProps) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPhoneForWhatsApp = (phoneNumber: string): string => {
    // Remove all non-digits
    const digits = phoneNumber.replace(/\D/g, '');
    // Add @c.us suffix for WhatsApp
    return `${digits}@c.us`;
  };

  const formatPhoneDisplay = (phoneNumber: string): string => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length === 11) {
      return `+55 ${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 13 && digits.startsWith('55')) {
      return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
    }
    return phoneNumber;
  };

  const handleCreate = async () => {
    if (!phone.trim()) {
      toast.error('Digite o número do telefone');
      return;
    }

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      toast.error('Número de telefone inválido');
      return;
    }

    setLoading(true);

    try {
      const chatId = formatPhoneForWhatsApp(phone);
      const formattedPhone = formatPhoneDisplay(phone);

      // TODO: integrate with backend WhatsApp conversations endpoint
      console.warn('[MOCK] create conversation — not yet integrated', { chatId, formattedPhone, name });

      // Mock: generate a temporary ID
      const mockId = crypto.randomUUID();
      toast.success('Conversa criada (mockada)');
      onConversationCreated?.(mockId);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Erro ao criar conversa');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPhone('');
    setName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Nova Conversa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Número do WhatsApp *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                placeholder="5511999998888"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Digite o número com DDD (código do país opcional)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome do Contato (opcional)</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                placeholder="Nome do cliente"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Iniciar Conversa'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
