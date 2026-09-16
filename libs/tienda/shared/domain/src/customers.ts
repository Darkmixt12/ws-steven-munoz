import type { CodedLocation, IdType } from './settings';
import type { Reason, Timestamp } from './shared';

/** Estado del Cliente. Lo mueve la callable `setCustomerStatus`, nunca el dueño. */
export type CustomerStatus = 'active' | 'disabled';

/**
 * `customers/{uid}`: el Cliente. Lo crea `completeRegistration` y lo borra `deleteMyAccount`;
 * el dueño solo edita `name`, `phone` y `defaultAddressId` (§5.1, nota 6 de §13).
 */
export interface Customer {
  name: string;
  /** Copia del correo de Auth; la refresca el backend. */
  email: string;
  /** E.164. */
  phone: string;
  status: CustomerStatus;
  statusReason: Reason | null;
  /** Dirección predeterminada. La regla no comprueba que exista. */
  defaultAddressId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Forma de una Dirección sin sus sellos de hora: es también la copia congelada que el Pedido
 * guarda en `delivery.address` (§6.2), así que la forma se declara una sola vez.
 */
export interface AddressDetails {
  recipientName: string;
  /** E.164 de Costa Rica: `+506` y ocho dígitos. */
  phone: string;
  /** 5 dígitos del catálogo territorial. */
  districtCode: string;
  provinceName: string;
  cantonName: string;
  districtName: string;
  neighborhood: string | null;
  /** 5–250 caracteres. */
  otherSigns: string;
  /** Versión del catálogo territorial con la que se capturó, p. ej. `DTA-2026`. */
  dtaVersion: string;
}

/**
 * `customers/{uid}/addresses/{addressId}`: la Dirección. La escribe y la borra el dueño
 * directo; el tope de ~10 lo aplica la interfaz, no la regla.
 */
export interface Address extends AddressDetails {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Forma de un Perfil de facturación sin sus sellos de hora: es también la copia congelada
 * que el Pedido guarda en `billing.profile` (§6.2).
 */
export interface BillingProfileDetails {
  idType: IdType;
  /** Texto, nunca número: la cédula jurídica admite caracteres alfanuméricos. */
  idNumber: string;
  legalName: string;
  email: string;
  /**
   * Ubicación del Perfil. Su `otherSigns` admite 5–250 caracteres, más que el tope de 160
   * que el Comprobante impone a `settings/issuer`.
   */
  location: CodedLocation | null;
}

/** `customers/{uid}/billingProfiles/{profileId}`: mismo acceso que la Dirección, sin predeterminado. */
export interface BillingProfile extends BillingProfileDetails {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
