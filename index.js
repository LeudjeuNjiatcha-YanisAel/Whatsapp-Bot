const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const fs = require('fs');

const DELETE_AFTER_SECONDS = 10;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', async qr => {
  await QRCode.toFile('qr.png', qr);
  console.log('📸 QR code généré : télécharge qr.png et scanne-le');
});

client.on('ready', () => {
  console.log('✅ Bot connecté à WhatsApp !');
});

client.on('message_create', async msg => {
  if (!msg.fromMe) return;

  const chat = await msg.getChat();
  if (!chat.isGroup) return;

  setTimeout(async () => {
    try {
      await msg.delete(true);
      console.log('🗑️ Message supprimé pour tout le monde');
    } catch (e) {
      await msg.delete(false);
    }
  }, DELETE_AFTER_SECONDS * 1000);
});

client.initialize();

