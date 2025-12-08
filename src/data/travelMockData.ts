// Mock data for travel search simulation

export interface FlightResult {
  id: string;
  airline: string;
  airlineLogo: string;
  flightNumber: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  stopCity?: string;
  class: 'economy' | 'business' | 'first';
  price: number;
  seatsAvailable: number;
  baggage: string;
}

export interface HotelResult {
  id: string;
  name: string;
  stars: number;
  location: string;
  address: string;
  image: string;
  rating: number;
  reviewCount: number;
  amenities: string[];
  roomType: string;
  pricePerNight: number;
  totalPrice: number;
  breakfast: boolean;
  refundable: boolean;
}

export interface CarResult {
  id: string;
  company: string;
  model: string;
  category: string;
  image: string;
  passengers: number;
  bags: number;
  transmission: 'manual' | 'automatic';
  airConditioning: boolean;
  pricePerDay: number;
  totalPrice: number;
  pickupLocation: string;
  insurance: boolean;
}

export interface PackageResult {
  id: string;
  name: string;
  destination: string;
  image: string;
  duration: string;
  includes: string[];
  hotel: string;
  hotelStars: number;
  flights: boolean;
  transfers: boolean;
  meals: string;
  price: number;
  originalPrice: number;
  discount: number;
}

export interface TicketResult {
  id: string;
  name: string;
  category: string;
  location: string;
  image: string;
  description: string;
  duration: string;
  includes: string[];
  price: number;
  childPrice?: number;
  availability: 'available' | 'limited' | 'soldout';
}

const airlines = [
  { name: 'LATAM Airlines', code: 'LA', logo: '🛫' },
  { name: 'GOL Linhas Aéreas', code: 'G3', logo: '🛩️' },
  { name: 'Azul Linhas Aéreas', code: 'AD', logo: '✈️' },
  { name: 'American Airlines', code: 'AA', logo: '🇺🇸' },
  { name: 'TAP Portugal', code: 'TP', logo: '🇵🇹' },
  { name: 'Emirates', code: 'EK', logo: '🇦🇪' },
];

const hotelChains = [
  'Grand Hyatt', 'Marriott', 'Hilton', 'Sheraton', 'Ibis', 'Novotel', 
  'Radisson', 'Holiday Inn', 'Best Western', 'Accor', 'Wyndham'
];

const hotelAmenities = [
  'Wi-Fi Grátis', 'Piscina', 'Academia', 'Spa', 'Restaurante', 
  'Estacionamento', 'Room Service', 'Bar', 'Ar Condicionado', 'Cofre'
];

const carCompanies = ['Localiza', 'Movida', 'Unidas', 'Hertz', 'Avis', 'Budget'];
const carModels = [
  { model: 'Fiat Mobi', category: 'Econômico', passengers: 4, bags: 1 },
  { model: 'VW Gol', category: 'Compacto', passengers: 5, bags: 2 },
  { model: 'Chevrolet Onix', category: 'Compacto', passengers: 5, bags: 2 },
  { model: 'Toyota Corolla', category: 'Intermediário', passengers: 5, bags: 3 },
  { model: 'Jeep Compass', category: 'SUV', passengers: 5, bags: 4 },
  { model: 'Toyota Hilux', category: 'Picape', passengers: 5, bags: 4 },
];

const destinations: Record<string, { city: string; code: string; attractions: string[] }> = {
  'paris': { city: 'Paris', code: 'CDG', attractions: ['Torre Eiffel', 'Louvre', 'Champs-Élysées'] },
  'orlando': { city: 'Orlando', code: 'MCO', attractions: ['Disney World', 'Universal Studios', 'SeaWorld'] },
  'cancun': { city: 'Cancún', code: 'CUN', attractions: ['Chichén Itzá', 'Xcaret', 'Isla Mujeres'] },
  'lisboa': { city: 'Lisboa', code: 'LIS', attractions: ['Torre de Belém', 'Sintra', 'Alfama'] },
  'rio de janeiro': { city: 'Rio de Janeiro', code: 'GIG', attractions: ['Cristo Redentor', 'Pão de Açúcar', 'Copacabana'] },
  'buenos aires': { city: 'Buenos Aires', code: 'EZE', attractions: ['La Boca', 'Puerto Madero', 'Teatro Colón'] },
  'nova york': { city: 'Nova York', code: 'JFK', attractions: ['Times Square', 'Estátua da Liberdade', 'Central Park'] },
  'dubai': { city: 'Dubai', code: 'DXB', attractions: ['Burj Khalifa', 'Dubai Mall', 'Palm Jumeirah'] },
  'roma': { city: 'Roma', code: 'FCO', attractions: ['Coliseu', 'Vaticano', 'Fontana di Trevi'] },
  'tokyo': { city: 'Tóquio', code: 'NRT', attractions: ['Monte Fuji', 'Shibuya', 'Templo Senso-ji'] },
};

function getDestinationInfo(dest: string) {
  const key = dest.toLowerCase();
  return destinations[key] || { city: dest, code: 'XXX', attractions: ['Passeio turístico', 'City tour'] };
}

function generateFlightNumber(airline: { code: string }) {
  return `${airline.code}${Math.floor(Math.random() * 9000) + 1000}`;
}

function generateDuration(stops: number): string {
  const baseHours = Math.floor(Math.random() * 8) + 4;
  const extraForStops = stops * 2;
  const totalHours = baseHours + extraForStops;
  const minutes = Math.floor(Math.random() * 60);
  return `${totalHours}h ${minutes}min`;
}

function generateTime(): string {
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 12) * 5;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

export function generateFlightResults(origin: string, destination: string, passengers: number): FlightResult[] {
  const destInfo = getDestinationInfo(destination);
  const results: FlightResult[] = [];
  const numResults = Math.floor(Math.random() * 4) + 4;

  for (let i = 0; i < numResults; i++) {
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    const stops = Math.random() > 0.6 ? 0 : Math.random() > 0.5 ? 1 : 2;
    const classType = Math.random() > 0.7 ? 'business' : Math.random() > 0.9 ? 'first' : 'economy';
    const basePrice = classType === 'first' ? 8000 : classType === 'business' ? 4500 : 1200;
    const priceVariation = Math.floor(Math.random() * basePrice * 0.8);

    results.push({
      id: `FL${Date.now()}${i}`,
      airline: airline.name,
      airlineLogo: airline.logo,
      flightNumber: generateFlightNumber(airline),
      origin: origin.toUpperCase().substring(0, 3) || 'GRU',
      originCity: origin || 'São Paulo',
      destination: destInfo.code,
      destinationCity: destInfo.city,
      departureTime: generateTime(),
      arrivalTime: generateTime(),
      duration: generateDuration(stops),
      stops,
      stopCity: stops > 0 ? ['Miami', 'Madri', 'Frankfurt', 'Lima'][Math.floor(Math.random() * 4)] : undefined,
      class: classType,
      price: (basePrice + priceVariation) * passengers,
      seatsAvailable: Math.floor(Math.random() * 15) + 1,
      baggage: classType === 'economy' ? '1 mala 23kg' : '2 malas 32kg',
    });
  }

  return results.sort((a, b) => a.price - b.price);
}

export function generateHotelResults(destination: string, checkIn: string, checkOut: string, rooms: number): HotelResult[] {
  const destInfo = getDestinationInfo(destination);
  const results: HotelResult[] = [];
  const numResults = Math.floor(Math.random() * 5) + 5;
  
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

  for (let i = 0; i < numResults; i++) {
    const stars = Math.floor(Math.random() * 3) + 3;
    const basePricePerNight = stars === 5 ? 800 : stars === 4 ? 450 : 200;
    const priceVariation = Math.floor(Math.random() * basePricePerNight * 0.5);
    const pricePerNight = (basePricePerNight + priceVariation) * rooms;
    const hotelName = `${hotelChains[Math.floor(Math.random() * hotelChains.length)]} ${destInfo.city}`;
    
    const selectedAmenities: string[] = [];
    const numAmenities = Math.floor(Math.random() * 5) + 4;
    for (let j = 0; j < numAmenities; j++) {
      const amenity = hotelAmenities[Math.floor(Math.random() * hotelAmenities.length)];
      if (!selectedAmenities.includes(amenity)) selectedAmenities.push(amenity);
    }

    results.push({
      id: `HT${Date.now()}${i}`,
      name: hotelName,
      stars,
      location: `Centro de ${destInfo.city}`,
      address: `Av. Principal, ${Math.floor(Math.random() * 2000) + 100}`,
      image: `https://images.unsplash.com/photo-${1566073771259 + i}-6a6d7c1439d0?w=400`,
      rating: Math.round((Math.random() * 2 + 7) * 10) / 10,
      reviewCount: Math.floor(Math.random() * 2000) + 200,
      amenities: selectedAmenities,
      roomType: Math.random() > 0.5 ? 'Quarto Deluxe' : 'Quarto Standard',
      pricePerNight,
      totalPrice: pricePerNight * nights,
      breakfast: Math.random() > 0.4,
      refundable: Math.random() > 0.5,
    });
  }

  return results.sort((a, b) => a.totalPrice - b.totalPrice);
}

export function generateCarResults(destination: string, days: number): CarResult[] {
  const destInfo = getDestinationInfo(destination);
  const results: CarResult[] = [];

  for (const car of carModels) {
    const company = carCompanies[Math.floor(Math.random() * carCompanies.length)];
    const basePricePerDay = car.category === 'Econômico' ? 80 : 
                            car.category === 'Compacto' ? 120 : 
                            car.category === 'Intermediário' ? 180 : 250;
    const pricePerDay = basePricePerDay + Math.floor(Math.random() * 50);

    results.push({
      id: `CR${Date.now()}${results.length}`,
      company,
      model: car.model,
      category: car.category,
      image: `https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=300`,
      passengers: car.passengers,
      bags: car.bags,
      transmission: Math.random() > 0.3 ? 'automatic' : 'manual',
      airConditioning: true,
      pricePerDay,
      totalPrice: pricePerDay * days,
      pickupLocation: `Aeroporto ${destInfo.code}`,
      insurance: Math.random() > 0.5,
    });
  }

  return results.sort((a, b) => a.totalPrice - b.totalPrice);
}

export function generatePackageResults(destination: string, nights: number, travelers: number): PackageResult[] {
  const destInfo = getDestinationInfo(destination);
  const results: PackageResult[] = [];
  
  const packageTypes = [
    { name: 'Econômico', discount: 15, hotelStars: 3, meals: 'Café da manhã' },
    { name: 'Comfort', discount: 20, hotelStars: 4, meals: 'Meia pensão' },
    { name: 'Premium', discount: 25, hotelStars: 5, meals: 'All inclusive' },
  ];

  for (const pkg of packageTypes) {
    const basePrice = pkg.hotelStars === 5 ? 6000 : pkg.hotelStars === 4 ? 4000 : 2500;
    const originalPrice = (basePrice + Math.floor(Math.random() * 2000)) * travelers;
    const discountedPrice = Math.floor(originalPrice * (1 - pkg.discount / 100));

    results.push({
      id: `PK${Date.now()}${results.length}`,
      name: `Pacote ${pkg.name} - ${destInfo.city}`,
      destination: destInfo.city,
      image: `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400`,
      duration: `${nights} noites`,
      includes: [
        'Passagem aérea ida e volta',
        `${nights} noites de hospedagem`,
        'Traslado aeroporto/hotel',
        ...destInfo.attractions.slice(0, 2).map(a => `Ingresso: ${a}`),
      ],
      hotel: `${hotelChains[Math.floor(Math.random() * hotelChains.length)]} ${destInfo.city}`,
      hotelStars: pkg.hotelStars,
      flights: true,
      transfers: true,
      meals: pkg.meals,
      price: discountedPrice,
      originalPrice,
      discount: pkg.discount,
    });
  }

  return results;
}

export function generateTicketResults(destination: string): TicketResult[] {
  const destInfo = getDestinationInfo(destination);
  const results: TicketResult[] = [];

  for (const attraction of destInfo.attractions) {
    const basePrice = Math.floor(Math.random() * 300) + 100;
    
    results.push({
      id: `TK${Date.now()}${results.length}`,
      name: attraction,
      category: Math.random() > 0.5 ? 'Atração turística' : 'Experiência',
      location: destInfo.city,
      image: `https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400`,
      description: `Visite ${attraction} em ${destInfo.city} com ingresso prioritário.`,
      duration: `${Math.floor(Math.random() * 4) + 2} horas`,
      includes: ['Ingresso prioritário', 'Guia em português', 'Seguro'],
      price: basePrice,
      childPrice: Math.floor(basePrice * 0.5),
      availability: Math.random() > 0.2 ? 'available' : 'limited',
    });
  }

  // Add some generic tickets
  results.push({
    id: `TK${Date.now()}99`,
    name: `City Tour ${destInfo.city}`,
    category: 'Passeio',
    location: destInfo.city,
    image: `https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400`,
    description: `Conheça os principais pontos turísticos de ${destInfo.city} em um tour guiado.`,
    duration: '4 horas',
    includes: ['Transporte', 'Guia bilingue', 'Paradas para fotos'],
    price: 180,
    childPrice: 90,
    availability: 'available',
  });

  return results;
}
