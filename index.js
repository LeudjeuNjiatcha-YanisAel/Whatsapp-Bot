const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const Pino = require('pino');

const DELETE_AFTER_MS = 10_000;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');

  const sock = makeWASocket({
    auth: state,
    logger: Pino({ level: 'silent' }),
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.key?.fromMe) return;
    if (!msg.key.remoteJid.endsWith('@g.us')) return;

    setTimeout(async () => {
      try {
        await sock.sendMessage(
          msg.key.remoteJid,
          { delete: msg.key }
        );
      } catch {}
    }, DELETE_AFTER_MS);
  });

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    }
  });
}

startBot();

