const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const DELETE_AFTER_SECONDS = 5;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true }
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true,scale:1 });
  console.log('Scanne le QR code avec ton WhatsApp mobile.');
});

client.on('ready', () => {
  console.log('Bot connecté à WhatsApp !');
});

client.on('message_create', async msg => {
  if (!msg.fromMe) return;

  const chat = await msg.getChat();
  if (!chat.isGroup) return;

  setTimeout(async () => {
    try {
      await msg.delete(true);
      console.log('Message supprimé pour tout le monde');
    } catch (error) {
      console.log('Suppression pour tous impossible, suppression locale');
      await msg.delete(false);
    }
  }, DELETE_AFTER_SECONDS * 1000);
});

client.initialize();
