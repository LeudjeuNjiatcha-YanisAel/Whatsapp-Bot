const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const DELETE_AFTER_MS = 10_000;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  }
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  console.log('📱 Scanne le QR code');
});

client.on('ready', () => {
  console.log('✅ Bot WhatsApp connecté');
});

/**
 * Suppression ultra rapide
 */
client.on('message_create', msg => {
  if (!msg.fromMe) return;
  if (!msg.from || !msg.from.endsWith('@g.us')) return;
  if (msg.hasMedia) return;

  setTimeout(() => {
    msg.delete(true)
      .catch(() => msg.delete(false))
      .catch(() => {});
  }, DELETE_AFTER_MS);
});

client.initialize();

