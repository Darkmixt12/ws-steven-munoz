import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import type { EmployeeStatus } from 'tienda/domain';

/** Lo que devuelve `enterPanel`: el estado con el que quedó el Empleado. */
export interface PanelEntryResult {
  status: EmployeeStatus;
}

/**
 * Llama a `enterPanel` (Modelo de datos §5.4). Se invoca una vez por ingreso,
 * justo después de autenticar: liga la Invitación si es el primer ingreso y
 * sella `lastPanelEntryAt` siempre.
 *
 * Que falle no es un detalle cosmético: sin Empleado no hay Panel, así que
 * quien la llama tiene que tratar el error, no ignorarlo.
 */
@Injectable({ providedIn: 'root' })
export class PanelEntry {
  private readonly functions = inject(Functions);

  async enter(): Promise<EmployeeStatus> {
    const call = httpsCallable<unknown, PanelEntryResult>(
      this.functions,
      'enterPanel'
    );
    const { data } = await call();
    return data.status;
  }
}
