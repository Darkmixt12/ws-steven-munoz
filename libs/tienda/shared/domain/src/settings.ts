import type { Timestamp } from './shared';

/** `settings/storefront`: configuración de lectura pública, porque el checkout la muestra. */
export interface StorefrontSettings {
  /** Código de provincia (`1`–`7`) → CRC con IVA. */
  shippingRates: Record<string, number>;
  shippingVatRateCode: string;
  paymentTimeouts: {
    cardMinutes: number;
    sinpeMovilMinutes: number;
  };
  sinpeMovilNumber: string;
  storeInfo: {
    name: string;
    /** *Reply-to* de las Notificaciones. */
    contactEmail: string;
    contactPhone: string;
  };
  /** Bodega, para el checkout y la Notificación "Listo para retirar". */
  pickupInfo: {
    address: string;
    hours: string;
  };
  currentPrivacyNoticeVersion: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

/** Finalidad: uso de los datos personales para el que se pide Consentimiento. */
export type Purpose = 'accountAndOrders' | 'marketing' | 'panelAccess';

/** `privacyNotices/{version}`: Aviso de privacidad. Solo se crea, nunca se edita. */
export interface PrivacyNotice {
  text: string;
  purposes: Purpose[];
  publishedAt: Timestamp;
  updatedBy: string;
}
