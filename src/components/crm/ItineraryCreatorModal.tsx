import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Map, Plus, Trash2, Calendar, MapPin, Clock, Loader2, Sparkles, Plane, Hotel, Car, Ticket, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ItineraryCreatorModalProps {
  open: boolean;
  onClose: () => void;
  onGenerateQuote: (item: { type: string; title: string; details: string }) => void;
}

interface Destination {
  id: string;
  place: string;
  startDate: string;
  endDate: string;
  notes: string;
}

interface ItineraryDay {
  day: number;
  date: string;
  location: string;
  activities: {
    time: string;
    description: string;
    type: 'voo' | 'hotel' | 'passeio' | 'transfer' | 'refeicao' | 'livre';
    hasQuote?: boolean;
  }[];
}

export function ItineraryCreatorModal({ open, onClose, onGenerateQuote }: ItineraryCreatorModalProps) {
  const [step, setStep] = useState<'input' | 'generating' | 'result'>('input');
  const [destinations, setDestinations] = useState<Destination[]>([
    { id: 'dest-1', place: '', startDate: '', endDate: '', notes: '' },
  ]);
  const [travelers, setTravelers] = useState('2');
  const [preferences, setPreferences] = useState('');
  const [generatedItinerary, setGeneratedItinerary] = useState<ItineraryDay[]>([]);

  const addDestination = () => {
    setDestinations([
      ...destinations,
      { id: `dest-${Date.now()}`, place: '', startDate: '', endDate: '', notes: '' },
    ]);
  };

  const removeDestination = (id: string) => {
    if (destinations.length > 1) {
      setDestinations(destinations.filter((d) => d.id !== id));
    }
  };

  const updateDestination = (id: string, updates: Partial<Destination>) => {
    setDestinations(destinations.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  const handleGenerateItinerary = () => {
    setStep('generating');
    
    // Simulate AI generating itinerary
    setTimeout(() => {
      const mockItinerary: ItineraryDay[] = [];
      let dayCount = 1;
      
      destinations.forEach((dest) => {
        if (dest.place && dest.startDate && dest.endDate) {
          const start = new Date(dest.startDate);
          const end = new Date(dest.endDate);
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          for (let i = 0; i < days; i++) {
            const currentDate = new Date(start);
            currentDate.setDate(start.getDate() + i);
            
            mockItinerary.push({
              day: dayCount,
              date: currentDate.toISOString().split('T')[0],
              location: dest.place,
              activities: [
                i === 0 ? {
                  time: '08:00',
                  description: `Chegada em ${dest.place}`,
                  type: 'voo',
                  hasQuote: true,
                } : {
                  time: '09:00',
                  description: `Café da manhã no hotel`,
                  type: 'refeicao',
                },
                {
                  time: '10:00',
                  description: i === 0 ? `Check-in no hotel em ${dest.place}` : `Passeio turístico - ${dest.place}`,
                  type: i === 0 ? 'hotel' : 'passeio',
                  hasQuote: true,
                },
                {
                  time: '14:00',
                  description: `Visita aos principais pontos turísticos de ${dest.place}`,
                  type: 'passeio',
                  hasQuote: true,
                },
                {
                  time: '19:00',
                  description: 'Jantar e tempo livre',
                  type: 'livre',
                },
              ],
            });
            dayCount++;
          }
        }
      });
      
      setGeneratedItinerary(mockItinerary);
      setStep('result');
    }, 2500);
  };

  const handleQuoteForActivity = (activity: ItineraryDay['activities'][0], day: ItineraryDay) => {
    const typeMap: Record<string, string> = {
      'voo': 'voo',
      'hotel': 'hotel',
      'passeio': 'ingresso',
      'transfer': 'carro',
    };
    
    onGenerateQuote({
      type: typeMap[activity.type] || 'personalizado',
      title: activity.description,
      details: `Dia ${day.day} - ${day.date} às ${activity.time}`,
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'voo': return Plane;
      case 'hotel': return Hotel;
      case 'passeio': return Ticket;
      case 'transfer': return Car;
      default: return MapPin;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'voo': return 'bg-blue-500';
      case 'hotel': return 'bg-purple-500';
      case 'passeio': return 'bg-amber-500';
      case 'transfer': return 'bg-green-500';
      default: return 'bg-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            Criar Roteiro
          </DialogTitle>
          <DialogDescription>
            {step === 'input' && 'Preencha os destinos e datas para a IA criar o roteiro'}
            {step === 'generating' && 'A IA está criando seu roteiro personalizado...'}
            {step === 'result' && 'Roteiro gerado! Clique para realizar cotações'}
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-6 py-4">
            {/* Destinations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Destinos</Label>
                <Button size="sm" variant="outline" onClick={addDestination}>
                  <Plus className="mr-1 h-3 w-3" />
                  Adicionar Destino
                </Button>
              </div>

              <div className="space-y-3">
                {destinations.map((dest, index) => (
                  <Card key={dest.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">Destino {index + 1}</Badge>
                        {destinations.length > 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeDestination(dest.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Local
                        </Label>
                        <Input
                          placeholder="Ex: Paris, França"
                          value={dest.place}
                          onChange={(e) => updateDestination(dest.id, { place: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Data Início
                          </Label>
                          <Input
                            type="date"
                            value={dest.startDate}
                            onChange={(e) => updateDestination(dest.id, { startDate: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Data Fim
                          </Label>
                          <Input
                            type="date"
                            value={dest.endDate}
                            onChange={(e) => updateDestination(dest.id, { endDate: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Observações</Label>
                        <Input
                          placeholder="Ex: Queremos visitar a Torre Eiffel"
                          value={dest.notes}
                          onChange={(e) => updateDestination(dest.id, { notes: e.target.value })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Travelers */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Número de Viajantes</Label>
              <Input
                type="number"
                min="1"
                value={travelers}
                onChange={(e) => setTravelers(e.target.value)}
              />
            </div>

            {/* Preferences */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Preferências e Interesses</Label>
              <Textarea
                placeholder="Ex: Preferimos passeios culturais, gostaríamos de experimentar a gastronomia local..."
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>

            <Button
              onClick={handleGenerateItinerary}
              className="w-full"
              disabled={!destinations.some((d) => d.place && d.startDate && d.endDate)}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar Roteiro com IA
            </Button>
          </div>
        )}

        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/50 animate-pulse" />
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-primary-foreground" />
            </div>
            <p className="mt-6 text-lg font-medium">Criando seu roteiro...</p>
            <p className="text-sm text-muted-foreground mt-2">A IA está analisando os destinos e preparando sugestões</p>
            <Loader2 className="h-6 w-6 animate-spin text-primary mt-6" />
          </div>
        )}

        {step === 'result' && (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-4 pr-4">
              {generatedItinerary.map((day) => (
                <Card key={day.day}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-primary">Dia {day.day}</Badge>
                      <span className="text-sm font-medium">{day.location}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {day.activities.map((activity, actIndex) => {
                        const Icon = getActivityIcon(activity.type);
                        return (
                          <div
                            key={actIndex}
                            className={cn(
                              'flex items-center gap-3 p-2 rounded-lg',
                              activity.hasQuote && 'hover:bg-muted/50 cursor-pointer'
                            )}
                          >
                            <div className="flex items-center gap-2 text-xs text-muted-foreground w-12">
                              <Clock className="h-3 w-3" />
                              {activity.time}
                            </div>
                            <div className={cn('h-2 w-2 rounded-full', getActivityColor(activity.type))} />
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 text-sm">{activity.description}</span>
                            {activity.hasQuote && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => handleQuoteForActivity(activity, day)}
                              >
                                <CreditCard className="mr-1 h-3 w-3" />
                                Cotar
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}

        {step === 'result' && (
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setStep('input')} className="flex-1">
              Editar Destinos
            </Button>
            <Button onClick={onClose} className="flex-1">
              Concluir
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}