import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Users, Save, X, UserPlus } from 'lucide-react';

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
}

interface MyTeamResponse {
  id: string;
  name: string;
  supervisorId: string | null;
  supervisorName: string | null;
  createdIn: string;
  isActive: boolean;
  updatedIn: string | null;
  members: TeamMember[];
}

export function MyTeamPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editMemberIds, setEditMemberIds] = useState<string[]>([]);

  const teamQuery = useQuery({
    queryKey: ['my-team'],
    queryFn: async () => {
      const { data } = await api.get<MyTeamResponse>('/teams/my-team');
      return data;
    },
  });

  const availableQuery = useQuery({
    queryKey: ['my-team', 'available-members'],
    queryFn: async () => {
      const { data } = await api.get<TeamMember[]>('/teams/my-team/available-members');
      return data;
    },
    enabled: editing,
  });

  const updateMutation = useMutation({
    mutationFn: async (memberIds: string[]) => {
      const { data } = await api.put<MyTeamResponse>('/teams/my-team/members', { memberIds });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-team'] });
      setEditing(false);
      toast({ title: 'Equipe atualizada' });
    },
    onError: (err: unknown) => {
      toast({
        title: 'Erro ao atualizar equipe',
        description: getApiErrorMessage(err),
        variant: 'destructive',
      });
    },
  });

  const startEdit = () => {
    if (teamQuery.data) {
      setEditMemberIds(teamQuery.data.members.map((m) => m.id));
      setEditing(true);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditMemberIds([]);
  };

  const toggleMember = (userId: string) => {
    setEditMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  if (teamQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Carregando sua equipe…
      </div>
    );
  }

  if (teamQuery.isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">Sem equipe atribuída</h3>
            <p className="text-sm text-muted-foreground">
              Você ainda não é supervisor de nenhuma equipe. Peça ao administrador para atribuí-lo como supervisor.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const team = teamQuery.data!;
  const availableUsers = availableQuery.data ?? [];
  // Excluir o próprio supervisor da lista de membros selecionáveis
  const selectableUsers = availableUsers.filter((u) => u.id !== team.supervisorId);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-3xl mx-auto space-y-6">

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{team.name}</CardTitle>
                <CardDescription>
                  {team.members.length} membro{team.members.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              {!editing ? (
                <Button size="sm" variant="outline" className="gap-2" onClick={startEdit}>
                  <UserPlus className="h-4 w-4" />
                  Gerenciar membros
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cancelEdit}
                    disabled={updateMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => updateMutation.mutate(editMemberIds)}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!editing ? (
              <div className="space-y-3">
                {team.members.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum membro na equipe ainda. Clique em "Gerenciar membros" para adicionar atendentes.
                  </p>
                ) : (
                  team.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg border"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {member.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{member.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                      <Badge variant={member.isActive ? 'default' : 'secondary'} className="text-xs">
                        {member.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {availableQuery.isLoading ? (
                  <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Carregando usuários…
                  </div>
                ) : selectableUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum usuário disponível para adicionar.
                  </p>
                ) : (
                  selectableUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={editMemberIds.includes(user.id)}
                        onCheckedChange={() => toggleMember(user.id)}
                      />
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {user.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
