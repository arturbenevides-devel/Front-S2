import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar, Clock, CheckCircle2, Timer, DollarSign, XCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { TaskStatus, CustomerTask, Conversation, DismissType, DismissedActivityReport } from '@/types/crm';
import { cn } from '@/lib/utils';
import { CompleteServiceModal } from './CompleteServiceModal';

interface TaskModalProps {
  open: boolean;
  conversation: Conversation | null;
  onClose: () => void;
  onSave: (task: Omit<CustomerTask, 'id' | 'createdAt' | 'completed' | 'contactName'>) => void;
  onDismiss?: (report: Omit<DismissedActivityReport, 'id' | 'dismissedAt'>) => void;
}

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'em_orcamento', label: 'Em Orçamento', color: 'bg-amber-500' },
  { value: 'follow_up', label: 'Fazer Follow Up', color: 'bg-blue-500' },
  { value: 'em_qualificacao', label: 'Em Qualificação', color: 'bg-purple-500' },
  { value: 'vendido', label: 'Vendido', color: 'bg-success' },
];

const quickTimeOptions = [
  { minutes: 5, label: '5 min' },
  { minutes: 10, label: '10 min' },
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30 min' },
];

export function TaskModal({ open, conversation, onClose, onSave, onDismiss }: TaskModalProps) {
  const [status, setStatus] = useState<TaskStatus>('em_orcamento');
  const [nextStep, setNextStep] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [useQuickTime, setUseQuickTime] = useState(true);
  const [selectedQuickTime, setSelectedQuickTime] = useState<number | null>(null);
  const [value, setValue] = useState('');
  
  // Dismiss states
  const [showDismissOptions, setShowDismissOptions] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedDismissType, setSelectedDismissType] = useState<DismissType | null>(null);
  const [showCompleteService, setShowCompleteService] = useState(false);

  const handleQuickTimeSelect = (minutes: number) => {
    setSelectedQuickTime(minutes);
    setUseQuickTime(true);
    setScheduledDate('');
    setScheduledTime('');
  };

  const handleManualTimeChange = () => {
    setUseQuickTime(false);
    setSelectedQuickTime(null);
  };

  const handleSubmit = () => {
    if (!conversation || !nextStep) return;

    let dateTime: Date;
    
    if (useQuickTime && selectedQuickTime) {
      dateTime = new Date(Date.now() + selectedQuickTime * 60 * 1000);
    } else if (scheduledDate && scheduledTime) {
      dateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    } else {
      return;
    }
    
    onSave({
      conversationId: conversation.id,
      status,
      nextStep,
      scheduledDate: dateTime,
      value: value ? parseFloat(value) : undefined,
    });

    resetForm();
    onClose();
  };

  const resetForm = () => {
    setStatus('em_orcamento');
    setNextStep('');
    setScheduledDate('');
    setScheduledTime('');
    setSelectedQuickTime(null);
    setUseQuickTime(true);
    setValue('');
    setShowDismissOptions(false);
    setShowConfirmDialog(false);
    setSelectedDismissType(null);
    setShowCompleteService(false);
  };

  const handleDismissClick = (type: DismissType) => {
    setSelectedDismissType(type);
    setShowConfirmDialog(true);
  };

  const handleConfirmDismiss = () => {
    if (!conversation || !selectedDismissType || !onDismiss) return;

    // Generate conversation summary from last few messages
    const lastMessages = conversation.messages.slice(-3);
    const summary = lastMessages.map(m => m.content).join(' | ').slice(0, 200);

    onDismiss({
      conversationId: conversation.id,
      contactName: conversation.contact.name,
      agentName: 'Atendente Atual', // In real app, get from auth
      dismissType: selectedDismissType,
      conversationSummary: summary || 'Sem mensagens recentes',
    });

    setShowConfirmDialog(false);
    resetForm();
    onClose();
  };

  const isValueRequired = status === 'vendido';
  const isFormValid = nextStep && (selectedQuickTime || (scheduledDate && scheduledTime)) && (!isValueRequired || (value && parseFloat(value) > 0));

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) { resetForm(); onClose(); } }}>
        <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Registrar Atividade
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registre o status e próximo passo para {conversation?.contact.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Status Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Status do Cliente</Label>
              <RadioGroup
                value={status}
                onValueChange={(value) => setStatus(value as TaskStatus)}
                className="grid grid-cols-2 gap-1.5"
              >
                {statusOptions.map((option) => (
                  <div key={option.value} className="flex items-center">
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={option.value}
                      className="flex w-full cursor-pointer items-center gap-1.5 rounded-md border border-border p-2 hover:bg-accent/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-colors"
                    >
                      <div className={`h-2 w-2 rounded-full ${option.color}`} />
                      <span className="text-xs">{option.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Value Field */}
            <div className="space-y-1.5">
              <Label htmlFor="value" className="text-xs font-medium flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Valor {isValueRequired && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="value"
                type="number"
                min="0"
                step="0.01"
                placeholder={isValueRequired ? "Obrigatório" : "Opcional"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={cn("h-8 text-sm", isValueRequired && !value && "border-destructive")}
              />
              {isValueRequired && !value && (
                <p className="text-[10px] text-destructive">Informe o valor da venda</p>
              )}
            </div>

            {/* Next Step */}
            <div className="space-y-1.5">
              <Label htmlFor="nextStep" className="text-xs font-medium">
                Próximo Passo
              </Label>
              <Textarea
                id="nextStep"
                placeholder="Descreva a próxima ação..."
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                className="min-h-[60px] resize-none text-sm"
              />
            </div>

            {/* Quick Time Options */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Timer className="h-3 w-3" />
                Retornar Atendimento
              </Label>
              <div className="grid grid-cols-4 gap-1.5">
                {quickTimeOptions.map((option) => (
                  <Button
                    key={option.minutes}
                    type="button"
                    variant={selectedQuickTime === option.minutes ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleQuickTimeSelect(option.minutes)}
                    className={cn(
                      "h-7 text-xs px-2",
                      selectedQuickTime === option.minutes && "ring-1 ring-primary ring-offset-1"
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Manual Date/Time Option */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] text-muted-foreground">ou agende manualmente</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="date" className="text-xs font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Data
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => {
                      setScheduledDate(e.target.value);
                      handleManualTimeChange();
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="time" className="text-xs font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Horário
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => {
                      setScheduledTime(e.target.value);
                      handleManualTimeChange();
                    }}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Dismiss Options */}
            <div className="pt-2 border-t border-border">
              {!showDismissOptions ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-foreground h-7 text-xs"
                  onClick={() => setShowDismissOptions(true)}
                >
                  <XCircle className="w-3 h-3 mr-1.5" />
                  Dispensar registro
                </Button>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Opções de Dispensa</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-destructive/50 text-destructive hover:bg-destructive/10 h-7 text-[10px] px-1.5"
                      onClick={() => handleDismissClick('permanent')}
                    >
                      Para sempre
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10 h-7 text-[10px] px-1.5"
                      onClick={() => handleDismissClick('later')}
                    >
                      Mais tarde
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-[10px] h-6"
                    onClick={() => setShowDismissOptions(false)}
                  >
                    Voltar
                  </Button>
                </div>
              )}
            </div>

            {/* Complete Service Shortcut */}
            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-primary text-primary hover:bg-primary/10 h-7 text-xs"
                onClick={() => setShowCompleteService(true)}
              >
                <Sparkles className="w-3 h-3 mr-1.5" />
                Concluir Atendimento
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleSubmit} 
              disabled={!isFormValid}
              size="sm"
              className="w-full sm:w-auto h-8 text-sm"
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Salvar e Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Tem certeza?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedDismissType === 'permanent' 
                ? 'Ao dispensar permanentemente, essa conversa será reportada à supervisão e não será solicitado novo registro de atividade.'
                : 'Você está optando por informar a atividade posteriormente. A supervisão será notificada até que o registro seja feito.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
              Não, voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDismiss}
              className={selectedDismissType === 'permanent' ? 'bg-destructive hover:bg-destructive/90' : 'bg-amber-500 hover:bg-amber-600'}
            >
              Sim, confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Service Modal */}
      <CompleteServiceModal
        open={showCompleteService}
        onClose={() => setShowCompleteService(false)}
        onComplete={() => {
          // Close CompleteService modal and TaskModal after completion
          setShowCompleteService(false);
          resetForm();
          onClose();
        }}
        conversation={conversation}
      />
    </>
  );
}