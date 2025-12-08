import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Plane, Hotel, Package, Car, Ticket, Plus, Trash2, FileText, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuoteGeneratorModalProps {
  open: boolean;
  onClose: () => void;
  prefillData?: {
    type: string;
    title: string;
    details: string;
    price?: number;
  };
}

interface QuoteItem {
  id: string;
  type: 'voo' | 'hotel' | 'pacote' | 'carro' | 'ingresso' | 'personalizado';
  description: string;
  quantity: number;
  unitPrice: number;
}

const itemTypes = [
  { value: 'voo', label: 'Voo', icon: Plane },
  { value: 'hotel', label: 'Hotel', icon: Hotel },
  { value: 'pacote', label: 'Pacote', icon: Package },
  { value: 'carro', label: 'Carro', icon: Car },
  { value: 'ingresso', label: 'Ingresso', icon: Ticket },
  { value: 'personalizado', label: 'Personalizado', icon: FileText },
] as const;

const paymentConditions = [
  { value: 'a_vista', label: 'À Vista (5% desconto)' },
  { value: 'pix', label: 'PIX (3% desconto)' },
  { value: '2x', label: '2x sem juros' },
  { value: '3x', label: '3x sem juros' },
  { value: '6x', label: '6x sem juros' },
  { value: '10x', label: '10x com juros' },
  { value: '12x', label: '12x com juros' },
];

export function QuoteGeneratorModal({ open, onClose, prefillData }: QuoteGeneratorModalProps) {
  const [items, setItems] = useState<QuoteItem[]>(() => {
    if (prefillData) {
      return [{
        id: 'item-1',
        type: prefillData.type as QuoteItem['type'] || 'personalizado',
        description: `${prefillData.title}\n${prefillData.details}`,
        quantity: 1,
        unitPrice: prefillData.price || 0,
      }];
    }
    return [];
  });
  
  const [paymentCondition, setPaymentCondition] = useState('3x');
  const [observations, setObservations] = useState('');
  const [validity, setValidity] = useState('7');

  const addItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        type: 'personalizado',
        description: '',
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<QuoteItem>) => {
    setItems(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const totalPrice = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const getDiscount = () => {
    if (paymentCondition === 'a_vista') return 0.05;
    if (paymentCondition === 'pix') return 0.03;
    return 0;
  };

  const finalPrice = totalPrice * (1 - getDiscount());

  const handleGenerateQuote = () => {
    // Here you would generate the quote and potentially send it
    console.log('Generating quote:', {
      items,
      paymentCondition,
      observations,
      validity,
      totalPrice,
      finalPrice,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Gerar Orçamento
          </DialogTitle>
          <DialogDescription>
            Adicione os itens e configure as condições de pagamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Itens do Orçamento</Label>
              <Button size="sm" variant="outline" onClick={addItem}>
                <Plus className="mr-1 h-3 w-3" />
                Adicionar Item
              </Button>
            </div>

            {items.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum item adicionado</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={addItem}>
                    <Plus className="mr-1 h-3 w-3" />
                    Adicionar primeiro item
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <Card key={item.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Item {index + 1}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Tipo</Label>
                          <Select
                            value={item.type}
                            onValueChange={(value) => updateItem(item.id, { type: value as QuoteItem['type'] })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {itemTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <type.icon className="h-4 w-4" />
                                    {type.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Quantidade</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Descrição</Label>
                        <Textarea
                          placeholder="Descreva o item..."
                          value={item.description}
                          onChange={(e) => updateItem(item.id, { description: e.target.value })}
                          className="min-h-[60px] resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Valor Unitário (R$)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="text-right text-sm">
                        <span className="text-muted-foreground">Subtotal: </span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.quantity * item.unitPrice)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Payment Conditions */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Condições de Pagamento</Label>
            <Select value={paymentCondition} onValueChange={setPaymentCondition}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentConditions.map((cond) => (
                  <SelectItem key={cond.value} value={cond.value}>
                    {cond.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Validity */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Validade do Orçamento (dias)</Label>
            <Input
              type="number"
              min="1"
              value={validity}
              onChange={(e) => setValidity(e.target.value)}
            />
          </div>

          {/* Observations */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Observações</Label>
            <Textarea
              placeholder="Observações adicionais..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Summary */}
          {items.length > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Resumo</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}</span>
                  </div>
                  {getDiscount() > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Desconto ({(getDiscount() * 100).toFixed(0)}%):</span>
                      <span>- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice * getDiscount())}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                    <span>Total:</span>
                    <span className="text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalPrice)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleGenerateQuote} disabled={items.length === 0} className="flex-1">
            <FileText className="mr-2 h-4 w-4" />
            Gerar Orçamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}