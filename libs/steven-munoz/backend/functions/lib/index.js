"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onScrumChanged = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
const nodemailer = __importStar(require("nodemailer"));
admin.initializeApp();
const SENDGRID_API_KEY = (0, params_1.defineSecret)("SENDGRID_API_KEY");
const SMTP_USER = (0, params_1.defineSecret)("SMTP_USER");
const SMTP_PASS = (0, params_1.defineSecret)("SMTP_PASS");
exports.onScrumChanged = (0, firestore_1.onDocumentWritten)({
    document: "board2/scrum",
    region: "us-central1",
    secrets: [SENDGRID_API_KEY, SMTP_USER, SMTP_PASS],
}, async () => {
    // Obtener la key correctamente
    const apiKey = SENDGRID_API_KEY.value();
    const smtpUser = SMTP_USER.value();
    const smtpPass = SMTP_PASS.value();
    console.log("🔐 Secret recibido:", apiKey ? "Sí" : "No");
    mail_1.default.setApiKey(apiKey);
    const msg = {
        to: "darkmixt@gmail.com",
        from: "notificaciones@steven-munoz.info",
        subject: "Cambio detectado en Scrum",
        text: "Se detectó un cambio en board2/scrum.",
    };
    try {
        await mail_1.default.send(msg);
        console.log("✔ Correo enviado");
    }
    catch (e) {
        console.error("❌ Error enviando:", e);
    }
    const transporter = nodemailer.createTransport({
        service: "gmail",
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
    await ref.set({
        count: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return 'Correo enviado y contador actualizado';
});
//# sourceMappingURL=index.js.map