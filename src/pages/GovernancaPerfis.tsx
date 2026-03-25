import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';
import { useAccessControl } from '@/hooks/useAccessControl';
import { AccessDenied } from '@/components/governance/AccessDenied';
import type {
  CreateProfileRequest,
  ProfileDetailDto,
  ProfileListItemDto,
  ProfileMenuPermissionItem,
  ProfilePermissionRequest,
  UpdateProfileRequest,
} from '@/types/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

const PERM_COLS: { key: keyof ProfileMenuPermissionItem; label: string }[] = [
  { key: 'canCreate', label: 'Criar' },
  { key: 'canUpdate', label: 'Atualizar' },
  { key: 'canDelete', label: 'Excluir' },
  { key: 'canFind', label: 'Buscar' },
  { key: 'canFindAll', label: 'Listar' },
];

type PermState = Record<string, ProfileMenuPermissionItem>;

function emptyPerm(): ProfileMenuPermissionItem {
  return { canCreate: false, canUpdate: false, canDelete: false, canFind: false, canFindAll: false };
}

function permStateToRequest(state: PermState): ProfilePermissionRequest[] {
  return Object.entries(state)
    .filter(([, p]) => Object.values(p).some(Boolean))
    .map(([menuId, p]) => ({ menuId, ...p }));
}

function initPermState(menuResponses: ProfileDetailDto['menuResponses']): PermState {
  const state: PermState = {};
  for (const m of menuResponses ?? []) {
    state[m.id] = m.permissions[0] ?? emptyPerm();
  }
  return state;
}

/* ── Formulário de criação ─────────────────────────────────────── */
function CreateDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (body: CreateProfileRequest) =>
      api.post<ProfileListItemDto>('/profiles', body).then((r) => r.data),
    onSuccess: () => {
      toast({ title: 'Perfil criado com sucesso.' });
      setName('');
      setDescription('');
      setOpen(false);
      onCreated();
    },
    onError: (err) =>
      toast({
        title: 'Erro ao criar perfil',
        description: getApiErrorMessage(err, 'Verifique os dados.'),
        variant: 'destructive',
      }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimName = name.trim();
    const trimDesc = description.trim();
    if (trimName.length < 2) {
      toast({ title: 'Nome deve ter pelo menos 2 caracteres.', variant: 'destructive' });
      return;
    }
    if (trimDesc.length < 10) {
      toast({ title: 'Descrição deve ter pelo menos 10 caracteres.', variant: 'destructive' });
      return;
    }
    mutation.mutate({ name: trimName, description: trimDesc });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Novo perfil
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo perfil de acesso</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="gp-name">Nome</Label>
            <Input
              id="gp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Atendente"
              minLength={2}
              maxLength={255}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gp-desc">Descrição</Label>
            <Textarea
              id="gp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o escopo deste perfil (mín. 10 caracteres)"
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              As permissões por menu podem ser configuradas após criar o perfil.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando…
              </>
            ) : (
              'Criar perfil'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Painel de edição (Sheet lateral) ─────────────────────────── */
function EditSheet({
  profileId,
  open,
  onClose,
  onSaved,
}: {
  profileId: string | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();

  const detailQuery = useQuery({
    queryKey: ['profiles', 'detail', profileId],
    queryFn: async () => {
      const { data } = await api.get<ProfileDetailDto>(`/profiles/${profileId}`);
      return data;
    },
    enabled: !!profileId && open,
  });

  const profile = detailQuery.data;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permState, setPermState] = useState<PermState>({});

  // Sincroniza estado quando os dados chegam
  const [loadedId, setLoadedId] = useState<string | null>(null);
  if (profile && profile.id !== loadedId) {
    setName(profile.name);
    setDescription(profile.description);
    setPermState(initPermState(profile.menuResponses));
    setLoadedId(profile.id);
  }

  const updateMutation = useMutation({
    mutationFn: (body: UpdateProfileRequest) =>
      api.put<ProfileDetailDto>(`/profiles/${profileId}`, body).then((r) => r.data),
    onSuccess: () => {
      toast({ title: 'Perfil atualizado com sucesso.' });
      onSaved();
      onClose();
    },
    onError: (err) =>
      toast({
        title: 'Erro ao atualizar perfil',
        description: getApiErrorMessage(err, 'Verifique os dados.'),
        variant: 'destructive',
      }),
  });

  const handleSave = () => {
    const trimName = name.trim();
    const trimDesc = description.trim();
    if (trimName.length < 2) {
      toast({ title: 'Nome deve ter pelo menos 2 caracteres.', variant: 'destructive' });
      return;
    }
    if (trimDesc.length < 10) {
      toast({ title: 'Descrição deve ter pelo menos 10 caracteres.', variant: 'destructive' });
      return;
    }
    updateMutation.mutate({
      name: trimName,
      description: trimDesc,
      permissions: permStateToRequest(permState),
    });
  };

  const togglePerm = (menuId: string, key: keyof ProfileMenuPermissionItem) => {
    setPermState((prev) => ({
      ...prev,
      [menuId]: { ...(prev[menuId] ?? emptyPerm()), [key]: !(prev[menuId]?.[key] ?? false) },
    }));
  };

  const menus = profile?.menuResponses ?? [];
  const sections = [...new Set(menus.map((m) => m.sectionName ?? 'Geral'))];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl flex flex-col gap-0 p-0 overflow-hidden"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle>Editar perfil</SheetTitle>
        </SheetHeader>

        {detailQuery.isLoading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Carregando dados do perfil…
          </div>
        ) : detailQuery.isError ? (
          <div className="flex-1 flex items-center justify-center text-destructive text-sm px-6">
            {getApiErrorMessage(detailQuery.error, 'Não foi possível carregar o perfil.')}
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 py-4 space-y-6">
              {/* Nome e descrição */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ep-name">Nome</Label>
                  <Input
                    id="ep-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={255}
                    disabled={profile?.isDefault}
                  />
                  {profile?.isDefault && (
                    <p className="text-xs text-muted-foreground">
                      Perfil padrão: nome protegido.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ep-desc">Descrição</Label>
                  <Textarea
                    id="ep-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              {/* Matriz de permissões */}
              {menus.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Permissões por menu</h3>
                    <p className="text-xs text-muted-foreground">
                      Perfil padrão ignora esta matriz — tem acesso total.
                    </p>
                  </div>
                  {sections.map((section) => {
                    const sectionMenus = menus
                      .filter((m) => (m.sectionName ?? 'Geral') === section)
                      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
                    return (
                      <div key={section} className="rounded-md border border-border overflow-hidden">
                        <div className="bg-muted/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {section}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border bg-muted/30">
                                <th className="text-left px-3 py-2 font-medium text-muted-foreground min-w-[160px]">
                                  Menu / rota
                                </th>
                                {PERM_COLS.map((col) => (
                                  <th
                                    key={col.key}
                                    className="text-center px-3 py-2 font-medium text-muted-foreground w-20"
                                  >
                                    {col.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sectionMenus.map((menu, idx) => (
                                <tr
                                  key={menu.id}
                                  className={idx % 2 === 0 ? '' : 'bg-muted/20'}
                                >
                                  <td className="px-3 py-2">
                                    <div className="font-medium truncate max-w-[200px]" title={menu.name}>
                                      {menu.name}
                                    </div>
                                    {menu.action && (
                                      <div className="text-xs text-muted-foreground">
                                        {menu.action}
                                      </div>
                                    )}
                                  </td>
                                  {PERM_COLS.map((col) => (
                                    <td key={col.key} className="text-center px-3 py-2">
                                      <Checkbox
                                        checked={permState[menu.id]?.[col.key] ?? false}
                                        onCheckedChange={() => togglePerm(menu.id, col.key)}
                                        disabled={profile?.isDefault}
                                      />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Rodapé com botão salvar */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending || detailQuery.isLoading}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando…
              </>
            ) : (
              'Salvar alterações'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Página principal ──────────────────────────────────────────── */
export default function GovernancaPerfis() {
  const { canManageProfiles, isDefaultProfile, isLoadingMenus } = useAccessControl();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editId, setEditId] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['profiles'] });

  const query = useQuery({
    queryKey: ['profiles', 'list'],
    queryFn: async () => {
      const { data } = await api.get<ProfileListItemDto[]>('/profiles');
      return data;
    },
    enabled: canManageProfiles,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: boolean }) =>
      api.post('/profiles/status', { id, status }),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Status do perfil atualizado.' });
    },
    onError: (err) =>
      toast({
        title: 'Erro ao atualizar status',
        description: getApiErrorMessage(err),
        variant: 'destructive',
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/profiles/${id}`),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Perfil removido (desativado).' });
    },
    onError: (err) =>
      toast({
        title: 'Erro ao remover perfil',
        description: getApiErrorMessage(err),
        variant: 'destructive',
      }),
  });

  if (!isDefaultProfile && isLoadingMenus) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Carregando permissões…
      </div>
    );
  }

  if (!canManageProfiles) {
    return <AccessDenied title="Perfis de acesso" />;
  }

  if (query.isError) {
    return (
      <div className="p-6 text-destructive text-sm">
        {getApiErrorMessage(query.error, 'Não foi possível carregar os perfis.')}
      </div>
    );
  }

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Carregando perfis…
      </div>
    );
  }

  const rows = query.data ?? [];

  return (
    <div className="overflow-auto h-full p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-lg font-semibold mb-1">Perfis de acesso</h1>
          <p className="text-sm text-muted-foreground">
            Perfis do tenant. O perfil padrão tem acesso total e não respeita a matriz de permissões.
          </p>
        </div>
        <CreateDialog onCreated={invalidate} />
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center py-8">
                  Nenhum perfil retornado.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.name}
                    {p.isDefault && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Padrão
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell
                    className="hidden md:table-cell max-w-xs truncate text-muted-foreground text-sm"
                    title={p.description}
                  >
                    {p.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.isDefault ? 'default' : 'outline'} className="text-xs">
                      {p.isDefault ? 'Administrador' : 'Personalizado'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={p.isActive}
                      disabled={statusMutation.isPending || p.isDefault}
                      onCheckedChange={(checked) =>
                        statusMutation.mutate({ id: p.id, status: checked })
                      }
                      title={p.isDefault ? 'Perfil padrão não pode ser desativado' : undefined}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditId(p.id)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!p.isDefault && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              title="Remover"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover perfil "{p.name}"?</AlertDialogTitle>
                              <AlertDialogDescription>
                                O perfil será desativado (soft delete). Usuários vinculados
                                manterão o vínculo, mas o perfil não estará mais disponível para novos
                                usuários.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => deleteMutation.mutate(p.id)}
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditSheet
        profileId={editId}
        open={editId !== null}
        onClose={() => setEditId(null)}
        onSaved={invalidate}
      />
    </div>
  );
}
