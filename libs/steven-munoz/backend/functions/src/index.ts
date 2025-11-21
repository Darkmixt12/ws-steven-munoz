import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import sgMail from "@sendgrid/mail";
import * as nodemailer from "nodemailer";

admin.initializeApp();

const SENDGRID_API_KEY = defineSecret("SENDGRID_API_KEY");
const SMTP_USER = defineSecret("SMTP_USER");
const SMTP_PASS = defineSecret("SMTP_PASS");

export const onScrumChanged = onDocumentWritten(
  {
    document: "board2/scrum",
    region: "us-central1",
    secrets: [SENDGRID_API_KEY, SMTP_USER, SMTP_PASS],
  },
  async () => {

    // Obtener la key correctamente
    const apiKey = SENDGRID_API_KEY.value();
    const smtpUser = SMTP_USER.value();
    const smtpPass = SMTP_PASS.value();

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

          const transporter = nodemailer.createTransport({
        service: "gmail", // Puede ser Outlook/SMTP propio
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const nodemailerMsg = {
        from: `"Scrum Notifier" <${smtpUser}>`,
        to: "munozsteven@hotmail.com",
        subject: "Cambio detectado en Scrum (Nodemailer)",
        text: "Este correo se envió usando Nodemailer + SMTP.",
      };

      await transporter.sendMail(nodemailerMsg);
      console.log("✔ Correo enviado con Nodemailer");

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
