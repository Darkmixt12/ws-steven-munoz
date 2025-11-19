import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import sgMail from "@sendgrid/mail";

admin.initializeApp();

const SENDGRID_API_KEY = defineSecret("SENDGRID_API_KEY");

export const onScrumChanged = onDocumentWritten(
  {
    document: "board2/scrum",
    region: "us-central1",
    secrets: [SENDGRID_API_KEY],
  },
  async () => {

    // Obtener la key correctamente
    const apiKey = SENDGRID_API_KEY.value();

    console.log("🔐 Secret recibido:", apiKey ? "Sí" : "No");

    sgMail.setApiKey(apiKey);

    const msg = {
      to: "darkmixt@gmail.com",
      from: "notificaciones@steven-munoz.info",
      subject: "Cambio detectado en Scrum",
      text: "Se detectó un cambio en board2/scrum.",
    };

    try {
      await sgMail.send(msg);
      console.log("✔ Correo enviado");
    } catch (e) {
      console.error("❌ Error enviando:", e);
    }

    // Actualizar Firestore
    const ref = admin.firestore().collection('notifications').doc('global');

    await ref.set(
      {
        count: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return 'Correo enviado y contador actualizado';
  }
);
