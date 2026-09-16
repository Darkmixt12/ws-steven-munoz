import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { normalizeEmail, type Employee, type Invitation } from 'tienda/domain';

/**
 * Ingreso al Panel (Modelo de datos §5.4).
 *
 * Es la excepción a la regla del §11: no exige Empleado Activo ni Permiso,
 * porque existe justamente para quien todavía no es ninguna de las dos cosas.
 * Solo exige sesión y correo verificado, que es lo mismo que exigen las reglas
 * de Firestore ([ADR 0002](../../../../docs/adr/0002-permisos-del-panel-leyendo-el-empleado.md)).
 *
 * No escribe `staffDirectory` ni la Bitácora: un Empleado Invitado no tiene
 * nombre todavía, y `StaffDirectoryEntry` exige uno. Los estrena
 * `completeEmployeeProfile`, que es quien lo pasa a Activo.
 */
export const enterPanel = onCall({ region: 'us-central1' }, async (request) => {
  const auth = request.auth;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Hay que iniciar sesión.');
  }
  if (auth.token.email_verified !== true) {
    throw new HttpsError(
      'failed-precondition',
      'Hay que verificar el correo antes de entrar al Panel.'
    );
  }

  const email = normalizeEmail(String(auth.token.email ?? ''));
  const db = getFirestore();
  const employeeRef = db.doc(`employees/${auth.uid}`);
  const invitationRef = db.doc(`invitations/${email}`);

  /**
   * El veredicto sale de la transacción en vez de lanzarse dentro: al rechazar
   * una Invitación vencida hay que borrarla, y un error abortaría ese borrado.
   */
  const verdict = await db.runTransaction(async (tx) => {
    const employeeSnapshot = await tx.get(employeeRef);

    if (employeeSnapshot.exists) {
      const current = employeeSnapshot.data() as Employee;
      if (current.status === 'disabled') {
        return { entered: false, message: 'Este acceso al Panel está deshabilitado.' };
      }
      // Un Empleado Invitado entra: le falta completar su perfil, no acceder.
      tx.update(employeeRef, {
        lastPanelEntryAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { entered: true, status: current.status };
    }

    const invitationSnapshot = await tx.get(invitationRef);
    if (!invitationSnapshot.exists) {
      return { entered: false, message: 'No hay ninguna invitación para este correo.' };
    }

    const invitation = invitationSnapshot.data() as Invitation;
    // El TTL sobre `expiresAt` borra tarde, así que la vigencia se comprueba igual.
    if (invitation.expiresAt.toMillis() <= Date.now()) {
      tx.delete(invitationRef);
      return { entered: false, message: 'La invitación venció.' };
    }

    const now = FieldValue.serverTimestamp();
    tx.create(employeeRef, {
      email,
      name: null,
      phone: null,
      role: invitation.role,
      status: 'invited',
      statusReason: null,
      invitedBy: invitation.invitedBy,
      invitedAt: invitation.invitedAt,
      statusChangedAt: now,
      lastPanelEntryAt: now,
      anonymizedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    tx.delete(invitationRef);

    return { entered: true, status: 'invited' as const };
  });

  if (!verdict.entered) {
    throw new HttpsError('permission-denied', verdict.message ?? 'Sin acceso al Panel.');
  }

  // El estado le dice al Panel si mandar a completar el perfil o a las pantallas.
  return { status: verdict.status };
});
