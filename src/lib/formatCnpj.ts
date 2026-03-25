/** Formata 14 dígitos para 00.000.000/0000-00 */
export function formatCnpjDisplay(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 14);
  if (d.length !== 14) return digits;
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}
