const express = require("express");
const app = express();

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

const qrcode = require('qrcode-terminal');
const Pino = require('pino');

const DELETE_AFTER_SECONDS = 10;
let sock;
let isStarting = false;

/* ===============================
   🌐 SERVEUR HTTP POUR RENDER
================================ */
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🤖 Bot WhatsApp actif sur Render");
});

app.listen(PORT, () => {
  console.log(`🌍 Serveur web lancé sur le port ${PORT}`);
});

/* ===============================
   🤖 BOT WHATSAPP
================================ */
async function startBot() {
  if (isStarting) return;
  isStarting = true;

  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    auth: state,
    version,
    logger: Pino({ level: 'silent' }),
    browser: ['Bot', 'Chrome', '1.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📱 Scanne le QR Code');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      console.log('✅ Bot connecté');
      isStarting = false;
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;

      if (code === DisconnectReason.loggedOut) {
        console.log('❌ Session expirée → supprime le dossier session');
        isStarting = false;
      } else {
        console.log('♻️ Reconnexion dans 5 secondes...');
        isStarting = false;
        setTimeout(startBot, 5000);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message) return;
    if (!msg.key.fromMe) return;
    if (!msg.key.remoteJid.endsWith('@g.us')) return;

    setTimeout(async () => {
      try {
        await sock.sendMessage(msg.key.remoteJid, { delete: msg.key });
        console.log('🗑 Message supprimé');
      } catch {
        console.log('⚠️ Suppression échouée');
      }
    }, DELETE_AFTER_SECONDS * 1000);
  });
}

startBot();
