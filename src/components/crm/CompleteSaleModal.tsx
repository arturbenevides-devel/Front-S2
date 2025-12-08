import { useState } from 'react';
import { CreditCard, User, Calendar, DollarSign, Check, Loader2, ShieldCheck, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface CompleteSaleModalProps {
  open: boolean;
  onClose: () => void;
  contactName?: string;
  capturedData?: {
    name?: string;
    cpf?: string;
    birthDate?: string;
    email?: string;
    phone?: string;
  };
  capturedClientData?: {
    name?: string;
    cpf?: string;
    birthDate?: string;
  };
  conversation?: {
    contact: { name: string };
  };
  quotes?: Array<{
    id: string;
    description: string;
    value: number;
  }>;
}

export function CompleteSaleModal({ open, onClose, contactName, capturedData, capturedClientData, conversation, quotes = [] }: CompleteSaleModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Merge capturedData and capturedClientData for pre-filling
  const mergedCapturedData = {
    name: capturedData?.name || capturedClientData?.name,
    cpf: capturedData?.cpf || capturedClientData?.cpf,
    birthDate: capturedData?.birthDate || capturedClientData?.birthDate,
    email: capturedData?.email,
    phone: capturedData?.phone,
  };
  
  const resolvedContactName = contactName || conversation?.contact?.name || '';
  
  // Customer data (pre-filled from document capture)
  const [customerData, setCustomerData] = useState({
    fullName: mergedCapturedData.name || resolvedContactName,
    cpf: mergedCapturedData.cpf || '',
    birthDate: mergedCapturedData.birthDate || '',
    email: mergedCapturedData.email || '',
    phone: mergedCapturedData.phone || '',
  });

  // Sale data
  const [saleData, setSaleData] = useState({
    selectedQuote: quotes[0]?.id || '',
    customValue: '',
    paymentMethod: 'credit',
    installments: '1',
  });

  // Mock quotes if none provided
  const availableQuotes = quotes.length > 0 ? quotes : [
    { id: '1', description: 'Pacote Cancún - 7 noites All Inclusive', value: 12500 },
    { id: '2', description: 'Voo + Hotel Paris - 6 noites', value: 15800 },
    { id: '3', description: 'Cruzeiro Caribe - 8 dias', value: 8900 },
  ];

  const selectedQuoteValue = saleData.customValue 
    ? parseFloat(saleData.customValue) 
    : availableQuotes.find(q => q.id === saleData.selectedQuote)?.value || 0;

  const handleProceedToPayment = () => {
    if (!customerData.fullName || !customerData.cpf) {
      toast({
        title: 'Dados Incompletos',
        description: 'Por favor, preencha nome completo e CPF.',
        variant: 'destructive',
      });
      return;
    }
    setStep('payment');
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsProcessing(false);
    setStep('success');
    
    toast({
      title: 'Pagamento Aprovado!',
      description: 'Os dados do cliente foram salvos para emissão.',
    });
  };

  const handleExportToERP = () => {
    toast({
      title: 'Exportado para ERP',
      description: 'Dados do cliente enviados para o sistema de emissão.',
    });
    onClose();
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Concluir Venda
          </DialogTitle>
        </DialogHeader>

        {step === 'info' && (
          <div className="space-y-6 mt-4">
            {/* Pre-captured data indicator */}
            {capturedData && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm text-success">Dados capturados automaticamente do documento</span>
              </div>
            )}

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados do Cliente
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input
                    id="fullName"
                    value={customerData.fullName}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={customerData.cpf}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, cpf: e.target.value }))}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={customerData.birthDate}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, birthDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerData.email}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Sale Value */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor da Venda
              </h3>

              <div className="space-y-3">
                <Label>Selecione o Orçamento</Label>
                {availableQuotes.map((quote) => (
                  <Card 
                    key={quote.id}
                    className={`cursor-pointer transition-all ${
                      saleData.selectedQuote === quote.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => {
                      setSaleData(prev => ({ ...prev, selectedQuote: quote.id, customValue: '' }));
                    }}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          saleData.selectedQuote === quote.id 
                            ? 'border-primary bg-primary' 
                            : 'border-muted-foreground'
                        }`}>
                          {saleData.selectedQuote === quote.id && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <span className="text-sm text-foreground">{quote.description}</span>
                      </div>
                      <span className="font-semibold text-primary">{formatCurrency(quote.value)}</span>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex items-center gap-2 pt-2">
                  <span className="text-sm text-muted-foreground">ou</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customValue">Valor Personalizado</Label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 bg-muted rounded-l-md border border-r-0 border-input text-sm">
                      R$
                    </span>
                    <Input
                      id="customValue"
                      type="number"
                      value={saleData.customValue}
                      onChange={(e) => setSaleData(prev => ({ ...prev, customValue: e.target.value, selectedQuote: '' }))}
                      placeholder="0,00"
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={handleProceedToPayment} className="w-full" size="lg">
              Prosseguir para Pagamento
            </Button>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-6 mt-4">
            {/* Checkout Simulator */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">Checkout Seguro</span>
                  <Badge variant="secondary" className="ml-auto">SSL</Badge>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-card border border-border">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-muted-foreground">Total a Pagar</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(selectedQuoteValue)}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Forma de Pagamento</Label>
                        <Select 
                          value={saleData.paymentMethod} 
                          onValueChange={(v) => setSaleData(prev => ({ ...prev, paymentMethod: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="credit">Cartão de Crédito</SelectItem>
                            <SelectItem value="debit">Cartão de Débito</SelectItem>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="boleto">Boleto Bancário</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {saleData.paymentMethod === 'credit' && (
                        <div className="space-y-2">
                          <Label>Parcelas</Label>
                          <Select 
                            value={saleData.installments} 
                            onValueChange={(v) => setSaleData(prev => ({ ...prev, installments: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 6, 10, 12].map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                  {n}x de {formatCurrency(selectedQuoteValue / n)} {n === 1 ? 'à vista' : 's/ juros'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {saleData.paymentMethod === 'pix' && (
                        <div className="p-4 rounded-lg bg-muted text-center">
                          <div className="w-32 h-32 mx-auto mb-3 bg-foreground rounded-lg flex items-center justify-center">
                            <span className="text-background text-xs">QR Code</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">ou copie o código</p>
                          <div className="flex gap-2">
                            <Input 
                              value="00020126580014br.gov.bcb.pix..." 
                              readOnly 
                              className="text-xs"
                            />
                            <Button size="icon" variant="outline">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {(saleData.paymentMethod === 'credit' || saleData.paymentMethod === 'debit') && (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label>Número do Cartão</Label>
                            <Input placeholder="0000 0000 0000 0000" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Validade</Label>
                              <Input placeholder="MM/AA" />
                            </div>
                            <div className="space-y-2">
                              <Label>CVV</Label>
                              <Input placeholder="000" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Nome no Cartão</Label>
                            <Input placeholder="Como aparece no cartão" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('info')} className="flex-1">
                Voltar
              </Button>
              <Button onClick={handleProcessPayment} disabled={isProcessing} className="flex-1">
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Finalizar Pagamento
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-6 mt-4 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
              <Check className="h-10 w-10 text-success" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-foreground">Pagamento Aprovado!</h3>
              <p className="text-muted-foreground mt-1">
                Valor: {formatCurrency(selectedQuoteValue)}
              </p>
            </div>

            <Card className="border-border/50">
              <CardContent className="p-4 text-left">
                <h4 className="font-medium text-foreground mb-3">Dados Salvos do Cliente</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nome:</span>
                    <span className="text-foreground">{customerData.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CPF:</span>
                    <span className="text-foreground">{customerData.cpf}</span>
                  </div>
                  {customerData.birthDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nascimento:</span>
                      <span className="text-foreground">{customerData.birthDate}</span>
                    </div>
                  )}
                  {customerData.email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">E-mail:</span>
                      <span className="text-foreground">{customerData.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Fechar
              </Button>
              <Button onClick={handleExportToERP} className="flex-1">
                Exportar para ERP
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
