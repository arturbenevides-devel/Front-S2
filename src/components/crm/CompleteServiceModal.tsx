import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, MapPin, Plane, Calendar, Heart, Sparkles, X } from 'lucide-react';
import { Conversation } from '@/types/crm';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface CompleteServiceModalProps {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void; // Called when service is fully completed to close parent modals
  conversation: Conversation | null;
  capturedData?: {
    origin?: string;
    destination?: string;
    interest?: string;
    travelDate?: string;
    additionalInterests?: string[];
  };
}

const interestSuggestions = [
  'Lua de Mel',
  'Férias em Família',
  'Aventura',
  'Relaxamento',
  'Negócios',
  'Cruzeiro',
  'Ecoturismo',
  'Cultural',
  'Praia',
  'Montanha',
];

export function CompleteServiceModal({ 
  open, 
  onClose, 
  onComplete,
  conversation,
  capturedData 
}: CompleteServiceModalProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [interest, setInterest] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [additionalInterests, setAdditionalInterests] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Pre-fill with captured data from AI
  useEffect(() => {
    if (open && capturedData) {
      setOrigin(capturedData.origin || '');
      setDestination(capturedData.destination || '');
      setInterest(capturedData.interest || '');
      setTravelDate(capturedData.travelDate || '');
      setAdditionalInterests(capturedData.additionalInterests || []);
    }
  }, [open, capturedData]);

  // Simulate AI pre-filling from conversation context
  useEffect(() => {
    if (open && conversation && !capturedData) {
      // Simulate AI analysis of conversation
      const messages = conversation.messages.map(m => m.content.toLowerCase()).join(' ');
      
      // Simple pattern matching for demo
      if (messages.includes('são paulo') || messages.includes('sp')) {
        setOrigin('São Paulo, SP');
      }
      if (messages.includes('maldivas')) {
        setDestination('Maldivas');
        setInterest('Lua de Mel');
      } else if (messages.includes('paris')) {
        setDestination('Paris, França');
        setInterest('Cultural');
      } else if (messages.includes('cancun') || messages.includes('cancún')) {
        setDestination('Cancún, México');
        setInterest('Praia');
      }
      
      if (messages.includes('janeiro')) {
        setTravelDate('2025-01-15');
      } else if (messages.includes('fevereiro')) {
        setTravelDate('2025-02-15');
      } else if (messages.includes('março')) {
        setTravelDate('2025-03-15');
      }
    }
  }, [open, conversation, capturedData]);

  const resetForm = () => {
    setOrigin('');
    setDestination('');
    setInterest('');
    setTravelDate('');
    setAdditionalInterests([]);
    setNotes('');
    setSaved(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleInterest = (interestTag: string) => {
    if (additionalInterests.includes(interestTag)) {
      setAdditionalInterests(additionalInterests.filter(i => i !== interestTag));
    } else {
      setAdditionalInterests([...additionalInterests, interestTag]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Save to campaign_leads table in database
    const { error } = await supabase.from('campaign_leads').insert({
      conversation_id: conversation?.id || '',
      contact_name: conversation?.contact.name || 'Desconhecido',
      contact_phone: conversation?.contact.phone || null,
      origin: origin || null,
      destination,
      interest: interest || null,
      travel_date: travelDate || null,
      additional_interests: additionalInterests,
      notes: notes || null,
    });
    
    if (error) {
      console.error('Error saving campaign lead:', error);
    }
    
    setIsSaving(false);
    setSaved(true);
    
    // Auto close after success and notify parent
    setTimeout(() => {
      handleClose();
      onComplete?.(); // Close parent modal too
    }, 1500);
  };

  const isFormValid = destination.trim() !== '';

  if (saved) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-success/20 p-3 mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Atendimento Concluído!</h3>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Dados salvos para campanhas futuras
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Concluir Atendimento
          </DialogTitle>
          <DialogDescription>
            Capture informações de {conversation?.contact.name} para campanhas futuras
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Origin & Destination */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="origin" className="text-sm font-medium flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Origem
              </Label>
              <Input
                id="origin"
                placeholder="Cidade de partida"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination" className="text-sm font-medium flex items-center gap-1">
                <Plane className="h-3.5 w-3.5" />
                Destino <span className="text-destructive">*</span>
              </Label>
              <Input
                id="destination"
                placeholder="Destino desejado"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className={cn(!destination && "border-muted")}
              />
            </div>
          </div>

          {/* Travel Date */}
          <div className="space-y-2">
            <Label htmlFor="travelDate" className="text-sm font-medium flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Data Prevista de Viagem
            </Label>
            <Input
              id="travelDate"
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
            />
          </div>

          {/* Main Interest */}
          <div className="space-y-2">
            <Label htmlFor="interest" className="text-sm font-medium flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              Interesse Principal
            </Label>
            <Input
              id="interest"
              placeholder="Ex: Lua de Mel, Férias em Família"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
            />
          </div>

          {/* Interest Tags */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Interesses Adicionais</Label>
            <div className="flex flex-wrap gap-2">
              {interestSuggestions.map((tag) => (
                <Badge
                  key={tag}
                  variant={additionalInterests.includes(tag) ? 'default' : 'outline'}
                  className={cn(
                    "cursor-pointer transition-colors",
                    additionalInterests.includes(tag) 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-accent"
                  )}
                  onClick={() => toggleInterest(tag)}
                >
                  {tag}
                  {additionalInterests.includes(tag) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Observações
            </Label>
            <Textarea
              id="notes"
              placeholder="Informações adicionais para campanhas..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px] resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!isFormValid || isSaving}
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Concluir Atendimento
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
