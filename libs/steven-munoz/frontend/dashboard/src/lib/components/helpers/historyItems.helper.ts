import { TicketHistory } from "../../types/ticketHistory.interface";

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
});

export function getFieldName(field: string): string {
  if (field === 'columnId') return 'Columna';
  if (field === 'proposal') return 'Monto';
  return field;
}

export function formatValue(
  field: string,
  value: any,
  columnMap: Map<number, string>
): string {
  if (field === 'columnId') {
    return columnMap.get(value) ?? `Columna ${value}`;
  }

  if (field === 'proposal') {
    return currencyFormatter.format(value);
  }

  return String(value);
}

export function buildLabel(
  h: TicketHistory,
  columnMap: Map<number, string>
): string {
  const fieldName = getFieldName(h.field);
  const from = formatValue(h.field, h.oldValue, columnMap);
  const to = formatValue(h.field, h.newValue, columnMap);

  return `${fieldName}: ${from} → ${to}`;
}