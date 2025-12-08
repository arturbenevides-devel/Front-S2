import { useState } from 'react';
import { FileDown, Palette, Image, Eye, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface PDFExportModalProps {
  open: boolean;
  onClose: () => void;
  type: 'quote' | 'itinerary';
  data?: {
    title: string;
    items?: Array<{ description: string; price: number }>;
    destinations?: Array<{ place: string; activities: string[] }>;
  };
}

interface AgencyBranding {
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  agencyName: string;
  agencyPhone: string;
  agencyEmail: string;
  agencyWebsite: string;
}

export function PDFExportModal({ open, onClose, type, data }: PDFExportModalProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [branding, setBranding] = useState<AgencyBranding>({
    logo: null,
    primaryColor: '#2d8a8a',
    secondaryColor: '#f97316',
    agencyName: 'TravelAgency',
    agencyPhone: '(11) 99999-9999',
    agencyEmail: 'contato@agencia.com.br',
    agencyWebsite: 'www.agencia.com.br',
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setBranding(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExport = async () => {
    setIsGenerating(true);
    
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: 'PDF Gerado com Sucesso!',
      description: `${type === 'quote' ? 'Orçamento' : 'Roteiro'} exportado para download.`,
    });
    
    setIsGenerating(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-primary" />
            Exportar {type === 'quote' ? 'Orçamento' : 'Roteiro'} em PDF
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="branding" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="branding" className="gap-2">
              <Palette className="h-4 w-4" />
              Personalização
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Prévia
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="mt-4 space-y-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo da Agência</Label>
              <div className="flex items-center gap-4">
                {branding.logo ? (
                  <div className="relative h-16 w-32 rounded-lg border border-border overflow-hidden bg-muted">
                    <img 
                      src={branding.logo} 
                      alt="Logo" 
                      className="h-full w-full object-contain p-2"
                    />
                  </div>
                ) : (
                  <div className="h-16 w-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                    <Image className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Label 
                    htmlFor="logo-upload" 
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                  >
                    Carregar Logo
                  </Label>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Cor Primária</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={branding.primaryColor}
                    onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Cor Secundária</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={branding.secondaryColor}
                    onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={branding.secondaryColor}
                    onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Agency Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agencyName">Nome da Agência</Label>
                <Input
                  id="agencyName"
                  value={branding.agencyName}
                  onChange={(e) => setBranding(prev => ({ ...prev, agencyName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agencyPhone">Telefone</Label>
                <Input
                  id="agencyPhone"
                  value={branding.agencyPhone}
                  onChange={(e) => setBranding(prev => ({ ...prev, agencyPhone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agencyEmail">E-mail</Label>
                <Input
                  id="agencyEmail"
                  value={branding.agencyEmail}
                  onChange={(e) => setBranding(prev => ({ ...prev, agencyEmail: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agencyWebsite">Website</Label>
                <Input
                  id="agencyWebsite"
                  value={branding.agencyWebsite}
                  onChange={(e) => setBranding(prev => ({ ...prev, agencyWebsite: e.target.value }))}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            {/* PDF Preview */}
            <div 
              className="rounded-lg border border-border p-6 bg-card min-h-[400px]"
              style={{ borderTopColor: branding.primaryColor, borderTopWidth: '4px' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                {branding.logo ? (
                  <img src={branding.logo} alt="Logo" className="h-12 object-contain" />
                ) : (
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: branding.primaryColor }}
                  >
                    {branding.agencyName}
                  </div>
                )}
                <div className="text-right text-sm text-muted-foreground">
                  <p>{branding.agencyPhone}</p>
                  <p>{branding.agencyEmail}</p>
                  <p>{branding.agencyWebsite}</p>
                </div>
              </div>

              {/* Title */}
              <h2 
                className="text-xl font-bold mb-4"
                style={{ color: branding.primaryColor }}
              >
                {type === 'quote' ? 'Proposta de Orçamento' : 'Roteiro de Viagem'}
              </h2>

              {/* Content Preview */}
              <div className="space-y-3">
                {type === 'quote' ? (
                  <>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-sm">Hospedagem - 7 noites</span>
                      <span className="text-sm font-medium">R$ 4.500,00</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-sm">Voo Ida e Volta</span>
                      <span className="text-sm font-medium">R$ 2.800,00</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-sm">Transfer Aeroporto</span>
                      <span className="text-sm font-medium">R$ 350,00</span>
                    </div>
                    <div 
                      className="flex justify-between py-3 mt-4 rounded-lg px-3"
                      style={{ backgroundColor: `${branding.primaryColor}15` }}
                    >
                      <span className="font-bold">Total</span>
                      <span 
                        className="font-bold"
                        style={{ color: branding.primaryColor }}
                      >
                        R$ 7.650,00
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${branding.secondaryColor}15` }}
                    >
                      <p className="font-medium" style={{ color: branding.secondaryColor }}>Dia 1 - Chegada</p>
                      <p className="text-sm text-muted-foreground mt-1">Transfer do aeroporto • Check-in no hotel • Jantar de boas-vindas</p>
                    </div>
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${branding.primaryColor}15` }}
                    >
                      <p className="font-medium" style={{ color: branding.primaryColor }}>Dia 2 - City Tour</p>
                      <p className="text-sm text-muted-foreground mt-1">Passeio guiado • Pontos turísticos • Almoço típico</p>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div 
                className="mt-8 pt-4 border-t border-border text-center text-xs text-muted-foreground"
              >
                <p>Orçamento válido por 7 dias • Sujeito a disponibilidade</p>
                <p className="mt-1" style={{ color: branding.primaryColor }}>
                  {branding.agencyName} - Sua viagem começa aqui!
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
