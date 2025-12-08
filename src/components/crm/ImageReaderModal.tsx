import { useState, useRef } from 'react';
import { Image, Upload, Loader2, Check, FileText, User, Calendar, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ImageReaderModalProps {
  open: boolean;
  onClose: () => void;
  onDataExtracted?: (data: ExtractedData) => void;
}

interface ExtractedData {
  type: 'rg' | 'cpf' | 'passport' | 'cnh' | 'unknown';
  name?: string;
  cpf?: string;
  rg?: string;
  birthDate?: string;
  passport?: string;
  expiryDate?: string;
  nationality?: string;
  confidence: number;
}

// Mock OCR extraction - simulates AI reading document
const mockExtractData = (imageType: string): ExtractedData => {
  const mockData: Record<string, ExtractedData> = {
    rg: {
      type: 'rg',
      name: 'MARIA APARECIDA SILVA',
      rg: '12.345.678-9',
      cpf: '123.456.789-00',
      birthDate: '1985-03-15',
      confidence: 94,
    },
    passport: {
      type: 'passport',
      name: 'JOAO CARLOS SANTOS',
      passport: 'FX123456',
      birthDate: '1990-07-22',
      expiryDate: '2030-12-31',
      nationality: 'BRASILEIRA',
      confidence: 97,
    },
    cnh: {
      type: 'cnh',
      name: 'ANA BEATRIZ OLIVEIRA',
      cpf: '987.654.321-00',
      rg: '98.765.432-1',
      birthDate: '1988-11-08',
      confidence: 92,
    },
  };

  // Random selection for demo
  const types = ['rg', 'passport', 'cnh'];
  const randomType = types[Math.floor(Math.random() * types.length)];
  return mockData[randomType];
};

export function ImageReaderModal({ open, onClose, onDataExtracted }: ImageReaderModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        processImage();
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    setIsProcessing(true);
    setExtractedData(null);
    
    // Simulate OCR processing
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const data = mockExtractData('auto');
    setExtractedData(data);
    setIsProcessing(false);

    toast({
      title: 'Documento Processado',
      description: `${data.type.toUpperCase()} identificado com ${data.confidence}% de confiança.`,
    });
  };

  const handleConfirm = () => {
    if (extractedData) {
      onDataExtracted(extractedData);
      onClose();
      resetState();
    }
  };

  const resetState = () => {
    setUploadedImage(null);
    setExtractedData(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const documentTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    rg: { label: 'RG', icon: <FileText className="h-4 w-4" /> },
    cpf: { label: 'CPF', icon: <CreditCard className="h-4 w-4" /> },
    passport: { label: 'Passaporte', icon: <FileText className="h-4 w-4" /> },
    cnh: { label: 'CNH', icon: <CreditCard className="h-4 w-4" /> },
    unknown: { label: 'Documento', icon: <FileText className="h-4 w-4" /> },
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Ler Documento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!uploadedImage ? (
            <div 
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm font-medium text-foreground mb-1">
                Clique para enviar uma imagem
              </p>
              <p className="text-xs text-muted-foreground">
                RG, CPF, Passaporte ou CNH
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative rounded-lg overflow-hidden bg-muted">
                <img 
                  src={uploadedImage} 
                  alt="Documento" 
                  className="w-full h-48 object-cover"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Processando documento...</p>
                  </div>
                )}
              </div>

              {/* Extracted Data */}
              {extractedData && (
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Check className="h-5 w-5 text-success" />
                      <span className="font-medium text-foreground">Dados Extraídos</span>
                      <Badge variant="secondary" className="ml-auto">
                        {documentTypeLabels[extractedData.type].label}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {extractedData.name && (
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-background">
                          <User className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Nome</p>
                            <p className="text-sm font-medium text-foreground">{extractedData.name}</p>
                          </div>
                        </div>
                      )}

                      {extractedData.cpf && (
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-background">
                          <CreditCard className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">CPF</p>
                            <p className="text-sm font-medium text-foreground">{extractedData.cpf}</p>
                          </div>
                        </div>
                      )}

                      {extractedData.rg && (
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-background">
                          <FileText className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">RG</p>
                            <p className="text-sm font-medium text-foreground">{extractedData.rg}</p>
                          </div>
                        </div>
                      )}

                      {extractedData.passport && (
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-background">
                          <FileText className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Passaporte</p>
                            <p className="text-sm font-medium text-foreground">{extractedData.passport}</p>
                          </div>
                        </div>
                      )}

                      {extractedData.birthDate && (
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-background">
                          <Calendar className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Data de Nascimento</p>
                            <p className="text-sm font-medium text-foreground">
                              {new Date(extractedData.birthDate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      )}

                      {extractedData.nationality && (
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-background">
                          <User className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Nacionalidade</p>
                            <p className="text-sm font-medium text-foreground">{extractedData.nationality}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-success transition-all"
                          style={{ width: `${extractedData.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {extractedData.confidence}% confiança
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          {extractedData && (
            <Button onClick={handleConfirm}>
              <Check className="mr-2 h-4 w-4" />
              Usar Dados
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
