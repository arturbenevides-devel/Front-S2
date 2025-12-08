import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plane, Hotel, Package, Car, Ticket, Search, Users, Calendar, MapPin, 
  ArrowRight, Loader2, Star, Clock, Luggage, Wifi, Coffee, Shield,
  CheckCircle2, AlertCircle, Percent
} from 'lucide-react';
import {
  generateFlightResults,
  generateHotelResults,
  generateCarResults,
  generatePackageResults,
  generateTicketResults,
  FlightResult,
  HotelResult,
  CarResult,
  PackageResult,
  TicketResult,
} from '@/data/travelMockData';

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

export interface SearchResult {
  type: 'voo' | 'hotel' | 'pacote' | 'carro' | 'ingresso';
  title: string;
  details: string;
  price?: number;
  rawData?: FlightResult | HotelResult | CarResult | PackageResult | TicketResult;
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
  
  // Results state for each type
  const [flightResults, setFlightResults] = useState<FlightResult[]>([]);
  const [hotelResults, setHotelResults] = useState<HotelResult[]>([]);
  const [carResults, setCarResults] = useState<CarResult[]>([]);
  const [packageResults, setPackageResults] = useState<PackageResult[]>([]);
  const [ticketResults, setTicketResults] = useState<TicketResult[]>([]);
  
  // Form states pre-filled from AI analysis
  const [origin, setOrigin] = useState('São Paulo');
  const [destination, setDestination] = useState(aiAnalysis?.destination || '');
  const [checkIn, setCheckIn] = useState(aiAnalysis?.checkIn || '');
  const [checkOut, setCheckOut] = useState(aiAnalysis?.checkOut || '');
  const [adults, setAdults] = useState(aiAnalysis?.adults?.toString() || '2');
  const [children, setChildren] = useState(aiAnalysis?.children?.toString() || '0');

  useEffect(() => {
    if (aiAnalysis) {
      setDestination(aiAnalysis.destination || '');
      setCheckIn(aiAnalysis.checkIn || '');
      setCheckOut(aiAnalysis.checkOut || '');
      setAdults(aiAnalysis.adults?.toString() || '2');
      setChildren(aiAnalysis.children?.toString() || '0');
    }
  }, [aiAnalysis]);

  const calculateDays = () => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const handleSearch = () => {
    if (!destination) return;
    
    setIsSearching(true);
    const passengers = parseInt(adults) + parseInt(children);
    const days = calculateDays();

    // Simulate API delay
    setTimeout(() => {
      switch (activeTab) {
        case 'voo':
          setFlightResults(generateFlightResults(origin, destination, passengers));
          break;
        case 'hotel':
          setHotelResults(generateHotelResults(destination, checkIn, checkOut, Math.ceil(passengers / 2)));
          break;
        case 'carro':
          setCarResults(generateCarResults(destination, days));
          break;
        case 'pacote':
          setPackageResults(generatePackageResults(destination, days, passengers));
          break;
        case 'ingresso':
          setTicketResults(generateTicketResults(destination));
          break;
      }
      setIsSearching(false);
    }, 1200);
  };

  const handleSelectFlight = (flight: FlightResult) => {
    onGenerateQuote({
      type: 'voo',
      title: `${flight.airline} ${flight.flightNumber} - ${flight.originCity} → ${flight.destinationCity}`,
      details: `${flight.departureTime} - ${flight.arrivalTime} • ${flight.duration} • ${flight.stops === 0 ? 'Direto' : `${flight.stops} parada(s)`} • ${flight.baggage}`,
      price: flight.price,
      rawData: flight,
    });
    onClose();
  };

  const handleSelectHotel = (hotel: HotelResult) => {
    onGenerateQuote({
      type: 'hotel',
      title: `${hotel.name} ${'★'.repeat(hotel.stars)}`,
      details: `${hotel.roomType} • ${hotel.location} • ${hotel.breakfast ? 'Café incluso' : 'Sem café'} • ${hotel.refundable ? 'Reembolsável' : 'Não reembolsável'}`,
      price: hotel.totalPrice,
      rawData: hotel,
    });
    onClose();
  };

  const handleSelectCar = (car: CarResult) => {
    onGenerateQuote({
      type: 'carro',
      title: `${car.model} - ${car.company}`,
      details: `${car.category} • ${car.passengers} passageiros • ${car.transmission === 'automatic' ? 'Automático' : 'Manual'} • ${car.pickupLocation}`,
      price: car.totalPrice,
      rawData: car,
    });
    onClose();
  };

  const handleSelectPackage = (pkg: PackageResult) => {
    onGenerateQuote({
      type: 'pacote',
      title: pkg.name,
      details: `${pkg.duration} • ${pkg.hotel} ${'★'.repeat(pkg.hotelStars)} • ${pkg.meals}`,
      price: pkg.price,
      rawData: pkg,
    });
    onClose();
  };

  const handleSelectTicket = (ticket: TicketResult) => {
    onGenerateQuote({
      type: 'ingresso',
      title: ticket.name,
      details: `${ticket.category} • ${ticket.location} • ${ticket.duration}`,
      price: ticket.price,
      rawData: ticket,
    });
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Fazer Orçamento
          </DialogTitle>
        </DialogHeader>

        {aiAnalysis && (
          <div className="rounded-lg bg-primary/10 p-3">
            <p className="text-sm font-medium text-primary mb-1">Análise da IA</p>
            <p className="text-xs text-muted-foreground">
              Destino: {aiAnalysis.destination || 'Não identificado'} • 
              Datas: {aiAnalysis.checkIn || '?'} a {aiAnalysis.checkOut || '?'} • 
              Passageiros: {aiAnalysis.adults || 2} adulto(s), {aiAnalysis.children || 0} criança(s)
            </p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); }} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-5 w-full">
            {searchCategories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="gap-1.5">
                <cat.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{cat.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 flex flex-col min-h-0 mt-4">
            {/* Search Form */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {activeTab === 'voo' && (
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Origem
                  </Label>
                  <Input
                    placeholder="De onde?"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="h-9"
                  />
                </div>
              )}
              
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Destino
                </Label>
                <Input
                  placeholder="Para onde? (ex: Orlando, Paris)"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {activeTab === 'carro' ? 'Retirada' : 'Check-in'}
                </Label>
                <Input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {activeTab === 'carro' ? 'Devolução' : 'Check-out'}
                </Label>
                <Input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Adultos
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={adults}
                  onChange={(e) => setAdults(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Crianças
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={children}
                  onChange={(e) => setChildren(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            <Button onClick={handleSearch} disabled={isSearching || !destination} className="w-full mt-4">
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar {searchCategories.find(c => c.id === activeTab)?.label}
                </>
              )}
            </Button>

            {/* Results */}
            <ScrollArea className="flex-1 mt-4 -mx-6 px-6">
              {/* Flight Results */}
              {activeTab === 'voo' && flightResults.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{flightResults.length} voos encontrados</p>
                  {flightResults.map((flight) => (
                    <Card key={flight.id} className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-2xl">{flight.airlineLogo}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{flight.airline}</span>
                                <Badge variant="outline" className="text-xs">{flight.flightNumber}</Badge>
                                <Badge variant={flight.class === 'economy' ? 'secondary' : 'default'} className="text-xs">
                                  {flight.class === 'economy' ? 'Econômica' : flight.class === 'business' ? 'Executiva' : 'Primeira'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm mt-1">
                                <span className="font-semibold">{flight.departureTime}</span>
                                <span className="text-muted-foreground">{flight.origin}</span>
                                <ArrowRight className="h-3 w-3" />
                                <span className="font-semibold">{flight.arrivalTime}</span>
                                <span className="text-muted-foreground">{flight.destination}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {flight.duration}
                                </span>
                                <span>{flight.stops === 0 ? 'Voo direto' : `${flight.stops} parada(s)${flight.stopCity ? ` em ${flight.stopCity}` : ''}`}</span>
                                <span className="flex items-center gap-1">
                                  <Luggage className="h-3 w-3" />
                                  {flight.baggage}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-primary">{formatCurrency(flight.price)}</p>
                            <p className="text-xs text-muted-foreground">{flight.seatsAvailable} assentos</p>
                            <Button size="sm" className="mt-2" onClick={() => handleSelectFlight(flight)}>
                              Selecionar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Hotel Results */}
              {activeTab === 'hotel' && hotelResults.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{hotelResults.length} hotéis encontrados</p>
                  {hotelResults.map((hotel) => (
                    <Card key={hotel.id} className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Hotel className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-medium">{hotel.name}</h4>
                                <div className="flex items-center gap-1 text-yellow-500 text-sm">
                                  {Array.from({ length: hotel.stars }).map((_, i) => (
                                    <Star key={i} className="h-3 w-3 fill-current" />
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
                                <span className="font-bold text-primary">{hotel.rating}</span>
                                <span className="text-xs text-muted-foreground">({hotel.reviewCount})</span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{hotel.location}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {hotel.amenities.slice(0, 4).map((amenity) => (
                                <Badge key={amenity} variant="secondary" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                              {hotel.amenities.length > 4 && (
                                <Badge variant="outline" className="text-xs">+{hotel.amenities.length - 4}</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs">
                              {hotel.breakfast && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <Coffee className="h-3 w-3" />
                                  Café incluso
                                </span>
                              )}
                              {hotel.refundable && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Cancelamento grátis
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">{hotel.roomType}</p>
                            <p className="text-lg font-bold text-primary">{formatCurrency(hotel.totalPrice)}</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(hotel.pricePerNight)}/noite</p>
                            <Button size="sm" className="mt-2" onClick={() => handleSelectHotel(hotel)}>
                              Selecionar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Car Results */}
              {activeTab === 'carro' && carResults.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{carResults.length} veículos encontrados</p>
                  {carResults.map((car) => (
                    <Card key={car.id} className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-14 rounded bg-muted flex items-center justify-center">
                              <Car className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <h4 className="font-medium">{car.model}</h4>
                              <p className="text-sm text-muted-foreground">{car.company}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <Badge variant="secondary">{car.category}</Badge>
                                <span>{car.passengers} passageiros</span>
                                <span>{car.bags} malas</span>
                                <span>{car.transmission === 'automatic' ? 'Automático' : 'Manual'}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">📍 {car.pickupLocation}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">{formatCurrency(car.totalPrice)}</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(car.pricePerDay)}/dia</p>
                            {car.insurance && (
                              <span className="flex items-center gap-1 text-xs text-green-600 justify-end">
                                <Shield className="h-3 w-3" />
                                Seguro incluso
                              </span>
                            )}
                            <Button size="sm" className="mt-2" onClick={() => handleSelectCar(car)}>
                              Selecionar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Package Results */}
              {activeTab === 'pacote' && packageResults.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{packageResults.length} pacotes encontrados</p>
                  {packageResults.map((pkg) => (
                    <Card key={pkg.id} className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="w-28 h-28 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Package className="h-10 w-10 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{pkg.name}</h4>
                                <p className="text-sm text-muted-foreground">{pkg.duration} • {pkg.meals}</p>
                              </div>
                              <Badge className="bg-green-500 text-white">
                                <Percent className="h-3 w-3 mr-1" />
                                {pkg.discount}% OFF
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-yellow-500 text-sm mt-1">
                              {Array.from({ length: pkg.hotelStars }).map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-current" />
                              ))}
                              <span className="text-muted-foreground ml-1">{pkg.hotel}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {pkg.includes.slice(0, 3).map((item) => (
                                <Badge key={item} variant="outline" className="text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm text-muted-foreground line-through">{formatCurrency(pkg.originalPrice)}</p>
                            <p className="text-xl font-bold text-primary">{formatCurrency(pkg.price)}</p>
                            <p className="text-xs text-muted-foreground">por pessoa</p>
                            <Button size="sm" className="mt-2" onClick={() => handleSelectPackage(pkg)}>
                              Selecionar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Ticket Results */}
              {activeTab === 'ingresso' && ticketResults.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{ticketResults.length} ingressos encontrados</p>
                  {ticketResults.map((ticket) => (
                    <Card key={ticket.id} className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                              <Ticket className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <h4 className="font-medium">{ticket.name}</h4>
                              <p className="text-sm text-muted-foreground">{ticket.category} • {ticket.location}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Clock className="h-3 w-3" />
                                {ticket.duration}
                                {ticket.availability === 'limited' && (
                                  <span className="flex items-center gap-1 text-orange-500">
                                    <AlertCircle className="h-3 w-3" />
                                    Últimas vagas
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1 mt-1">
                                {ticket.includes.slice(0, 2).map((item) => (
                                  <Badge key={item} variant="secondary" className="text-xs">{item}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">{formatCurrency(ticket.price)}</p>
                            {ticket.childPrice && (
                              <p className="text-xs text-muted-foreground">Criança: {formatCurrency(ticket.childPrice)}</p>
                            )}
                            <Button size="sm" className="mt-2" onClick={() => handleSelectTicket(ticket)}>
                              Selecionar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
