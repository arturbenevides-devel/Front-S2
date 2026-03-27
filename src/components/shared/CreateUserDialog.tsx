import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';
import type { CreateUserRequest, ProfileListItemDto } from '@/types/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateUserDialogProps {
  trigger: React.ReactNode;
  profiles: ProfileListItemDto[];
  profilesLoading?: boolean;
  onSuccess?: () => void;
  invalidateKeys?: string[][];
}

export function CreateUserDialog({
  trigger,
  profiles,
  profilesLoading,
  onSuccess,
  invalidateKeys = [['users']],
}: CreateUserDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [profileId, setProfileId] = useState('');

  const activeProfiles = profiles.filter((p) => p.isActive);

  const reset = () => {
    setFullName('');
    setEmail('');
    setProfileId('');
  };

  const createMutation = useMutation({
    mutationFn: async (body: CreateUserRequest) => {
      const { data } = await api.post('/users', body);
      return data;
    },
    onSuccess: () => {
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
      reset();
      setOpen(false);
      toast({
        title: 'Usuário criado',
        description: 'O convite será enviado por e-mail para ativar a conta.',
      });
      onSuccess?.();
    },
    onError: (err: unknown) => {
      toast({
        title: 'Não foi possível criar o usuário',
        description: getApiErrorMessage(err, 'Verifique os dados e tente novamente.'),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    if (trimmedName.length < 2) {
      toast({ title: 'Nome inválido', description: 'Informe pelo menos 2 caracteres.', variant: 'destructive' });
      return;
    }
    if (!profileId) {
      toast({ title: 'Perfil obrigatório', description: 'Selecione um perfil de acesso.', variant: 'destructive' });
      return;
    }
    const body: CreateUserRequest = {
      email: trimmedEmail,
      fullName: trimmedName,
      profileId,
    };
    createMutation.mutate(body);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="cu-fullName">Nome completo</Label>
            <Input
              id="cu-fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nome e sobrenome"
              minLength={2}
              maxLength={255}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cu-email">E-mail</Label>
            <Input
              id="cu-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            O usuário definirá a senha ao ativar o convite recebido por e-mail.
          </p>
          <div className="space-y-2">
            <Label>Perfil de acesso</Label>
            <Select value={profileId || undefined} onValueChange={setProfileId} required>
              <SelectTrigger>
                <SelectValue placeholder={profilesLoading ? 'Carregando perfis…' : 'Selecione o perfil'} />
              </SelectTrigger>
              <SelectContent>
                {activeProfiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.isDefault ? ' (padrão)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando…
              </>
            ) : (
              'Criar usuário'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
