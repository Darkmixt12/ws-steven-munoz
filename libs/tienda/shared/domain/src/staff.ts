import type { Role } from './permissions';
import type { Reason, Timestamp } from './shared';

/** Estado del Empleado. Invitado también cubre la Invitación aún sin ligar. */
export type EmployeeStatus = 'invited' | 'active' | 'disabled';

/** `employees/{uid}`: único origen de Rol y estado. Solo lo escribe el backend. */
export interface Employee {
  /** Correo de la Invitación y luego copia del de Auth. */
  email: string;
  /** Nulo hasta completar el primer ingreso. */
  name: string | null;
  phone: string | null;
  role: Role;
  status: EmployeeStatus;
  statusReason: Reason | null;
  /** `uid` de quien invitó. */
  invitedBy: string;
  invitedAt: Timestamp;
  statusChangedAt: Timestamp;
  /** Lo escribe `enterPanel`. */
  lastPanelEntryAt: Timestamp | null;
  anonymizedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** `invitations/{email}`, con el correo normalizado como id. Vence por TTL sobre `expiresAt`. */
export interface Invitation {
  email: string;
  role: Role;
  invitedBy: string;
  invitedAt: Timestamp;
  /** 7 días. */
  expiresAt: Timestamp;
}

/** `staffDirectory/{uid}`: nombre del Autor `employee`, para cualquier Rol, o el marcador de anonimizado. */
export type StaffDirectoryEntry = { name: string } | { anonymized: true };
