/** `counters/orderNumber`: siguiente Número de Pedido. Solo el backend lo lee y lo escribe. */
export interface OrderNumberCounter {
  next: number;
}
