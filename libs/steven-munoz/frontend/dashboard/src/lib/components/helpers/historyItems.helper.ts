import { collection, collectionData, Firestore, query, where } from "@angular/fire/firestore";
import { TicketHistory } from "../../types/ticketHistory.interface";
import { Observable, map } from "rxjs";

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
});

const columnMap = new Map<string, string>([
    ['todo', 'Por hacer'],
    ['doing', 'En progreso'],
    ['done', 'Completado'],
  ]);

function getFieldName(field: string): string {
  if (field === 'columnId') return 'Columna';
  if (field === 'proposal') return 'Monto';
  return field;
}

function formatValue(
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


export function fetchHistoryTickets(
  firestore: Firestore,
  ticketId: number,
  columns: { id: number; title: string }[]
): Observable<(TicketHistory & { label: string })[]> {

  const historyRef = collection(firestore, 'ticketHistory');

  const q = query(historyRef, where('ticketId', '==', ticketId));

  const columnMap = new Map<number, string>(
    columns.map(c => [c.id, c.title])
  );

  return collectionData(q, { idField: 'id' }).pipe(
    map((history: any[]) =>
      history.map(h => ({
        ...h,
        label: buildLabel(h, columnMap)
      }))
    )
  );
}