import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { TaskStatus, CustomerTask, Conversation } from '@/types/crm';

interface TaskModalProps {
  open: boolean;
  conversation: Conversation | null;
  onClose: () => void;
  onSave: (task: Omit<CustomerTask, 'id' | 'createdAt' | 'completed' | 'contactName'>) => void;
}

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'em_orcamento', label: 'Em Orçamento', color: 'bg-amber-500' },
  { value: 'follow_up', label: 'Fazer Follow Up', color: 'bg-blue-500' },
  { value: 'em_qualificacao', label: 'Em Qualificação', color: 'bg-purple-500' },
  { value: 'vendido', label: 'Vendido', color: 'bg-success' },
];

export function TaskModal({ open, conversation, onClose, onSave }: TaskModalProps) {
  const [status, setStatus] = useState<TaskStatus>('em_orcamento');
  const [nextStep, setNextStep] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const handleSubmit = () => {
    if (!conversation || !nextStep || !scheduledDate || !scheduledTime) return;

    const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    
    onSave({
      conversationId: conversation.id,
      status,
      nextStep,
      scheduledDate: dateTime,
    });

    // Reset form
    setStatus('em_orcamento');
    setNextStep('');
    setScheduledDate('');
    setScheduledTime('');
    onClose();
  };

  const isFormValid = nextStep && scheduledDate && scheduledTime;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Registrar Atividade
          </DialogTitle>
          <DialogDescription>
            Antes de sair, registre o status e próximo passo para {conversation?.contact.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status do Cliente</Label>
            <RadioGroup
              value={status}
              onValueChange={(value) => setStatus(value as TaskStatus)}
              className="grid grid-cols-2 gap-2"
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
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-border p-3 hover:bg-accent/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-colors"
                  >
                    <div className={`h-2 w-2 rounded-full ${option.color}`} />
                    <span className="text-sm">{option.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Next Step */}
          <div className="space-y-2">
            <Label htmlFor="nextStep" className="text-sm font-medium">
              Próximo Passo
            </Label>
            <Textarea
              id="nextStep"
              placeholder="Descreva a próxima ação..."
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Schedule Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Data
              </Label>
              <Input
                id="date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Horário
              </Label>
              <Input
                id="time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={!isFormValid}
            className="w-full sm:w-auto"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Salvar e Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
