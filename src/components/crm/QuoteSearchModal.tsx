import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plane, Hotel, Package, Car, Ticket, Search, Users, Calendar, MapPin, ArrowRight, Loader2 } from 'lucide-react';

interface QuoteSearchModalProps {
  open: boolean;
  onClose: () => void;
  aiAnalysis?: {
    destination?: string;
    checkIn?: string;
    checkOut?: string;
    adults?: number;
    children?: number;
  };
  onGenerateQuote: (data: SearchResult) => void;
}

interface SearchResult {
  type: 'voo' | 'hotel' | 'pacote' | 'carro' | 'ingresso';
  title: string;
  details: string;
  price?: number;
}

const searchCategories = [
  { id: 'voo', label: 'Voos', icon: Plane },
  { id: 'hotel', label: 'Hotéis', icon: Hotel },
  { id: 'pacote', label: 'Pacotes', icon: Package },
  { id: 'carro', label: 'Carro', icon: Car },
  { id: 'ingresso', label: 'Ingressos', icon: Ticket },
] as const;

export function QuoteSearchModal({ open, onClose, aiAnalysis, onGenerateQuote }: QuoteSearchModalProps) {
  const [activeTab, setActiveTab] = useState<string>('voo');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  
  // Form states pre-filled from AI analysis
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState(aiAnalysis?.destination || '');
  const [checkIn, setCheckIn] = useState(aiAnalysis?.checkIn || '');
  const [checkOut, setCheckOut] = useState(aiAnalysis?.checkOut || '');
  const [adults, setAdults] = useState(aiAnalysis?.adults?.toString() || '2');
  const [children, setChildren] = useState(aiAnalysis?.children?.toString() || '0');

  const handleSearch = () => {
    setIsSearching(true);
    // Simulate search
    setTimeout(() => {
      const mockResults: SearchResult[] = [
        {
          type: activeTab as SearchResult['type'],
          title: `${activeTab === 'voo' ? 'Voo' : activeTab === 'hotel' ? 'Hotel' : activeTab === 'pacote' ? 'Pacote' : activeTab === 'carro' ? 'Carro' : 'Ingresso'} - ${destination || 'Destino'}`,
          details: `${checkIn} a ${checkOut} • ${adults} adulto(s), ${children} criança(s)`,
          price: Math.floor(Math.random() * 5000) + 1500,
        },
        {
          type: activeTab as SearchResult['type'],
          title: `${activeTab === 'voo' ? 'Voo Premium' : activeTab === 'hotel' ? 'Hotel 5 Estrelas' : activeTab === 'pacote' ? 'Pacote Completo' : activeTab === 'carro' ? 'SUV Premium' : 'Ingresso VIP'} - ${destination || 'Destino'}`,
          details: `${checkIn} a ${checkOut} • ${adults} adulto(s), ${children} criança(s)`,
          price: Math.floor(Math.random() * 8000) + 3500,
        },
      ];
      setSearchResults(mockResults);
      setIsSearching(false);
    }, 1500);
  };

  const handleSelectResult = (result: SearchResult) => {
    onGenerateQuote(result);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Fazer Orçamento
          </DialogTitle>
        </DialogHeader>

        {aiAnalysis && (
          <div className="rounded-lg bg-primary/10 p-3 mb-4">
            <p className="text-sm font-medium text-primary mb-1">Análise da IA</p>
            <p className="text-xs text-muted-foreground">
              Destino: {aiAnalysis.destination || 'Não identificado'} • 
              Datas: {aiAnalysis.checkIn || '?'} a {aiAnalysis.checkOut || '?'} • 
              Passageiros: {aiAnalysis.adults || 2} adulto(s), {aiAnalysis.children || 0} criança(s)
            </p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            {searchCategories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="gap-1.5">
                <cat.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{cat.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-4">
            {/* Search Form */}
            <div className="grid grid-cols-2 gap-4">
              {activeTab === 'voo' && (
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    Origem
                  </Label>
                  <Input
                    placeholder="De onde?"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Destino
                </Label>
                <Input
                  placeholder="Para onde?"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {activeTab === 'carro' ? 'Retirada' : 'Check-in'}
                </Label>
                <Input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {activeTab === 'carro' ? 'Devolução' : 'Check-out'}
                </Label>
                <Input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Adultos
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={adults}
                  onChange={(e) => setAdults(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Crianças
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={children}
                  onChange={(e) => setChildren(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={handleSearch} disabled={isSearching} className="w-full">
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </>
              )}
            </Button>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Resultados da Busca</h4>
                {searchResults.map((result, index) => (
                  <Card key={index} className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{result.type.toUpperCase()}</Badge>
                            <p className="font-medium">{result.title}</p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{result.details}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.price || 0)}
                          </p>
                          <Button size="sm" className="mt-2" onClick={() => handleSelectResult(result)}>
                            Gerar Orçamento
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}