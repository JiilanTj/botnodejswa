const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    },
    webVersionCache: {
        type: "remote",
        remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html"
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

app.post('/add-members', async (req, res) => {
    const { groupName, participants } = req.body;
    const delayInSeconds = 1; // Jeda 1 detik antara setiap penambahan
    const maxRetries = 3; // Maksimal 3 kali percobaan

    try {
        const chats = await client.getChats();
        const groupChat = chats.find(chat => chat.name === groupName);

        if (!groupChat) {
            throw new Error('Group not found');
        }

        const groupId = groupChat.id._serialized;
        const chat = await client.getChatById(groupId);

        for (const participant of participants) {
            let added = false;
            let retryCount = 0;

            while (!added && retryCount < maxRetries) {
                try {
                    // Periksa apakah peserta sudah ada dalam grup
                    const existingParticipants = chat.participants.map(p => p.id._serialized);
                    if (!existingParticipants.includes(participant + '@c.us')) {
                        await chat.addParticipants([participant + '@c.us']);
                        console.log(`Added participant: ${participant}`);
                        added = true;
                    } else {
                        console.log(`Participant ${participant} already in the group`);
                        added = true;
                    }
                } catch (error) {
                    console.error(`Error adding participant ${participant}:`, error.message);
                    retryCount++;
                    if (retryCount < maxRetries) {
                        console.log(`Retrying to add participant ${participant} (Attempt ${retryCount + 1}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, delayInSeconds * 1000));
                    }
                }
            }

            if (!added) {
                console.error(`Failed to add participant ${participant} after ${maxRetries} attempts`);
            } else {
                await new Promise(resolve => setTimeout(resolve, delayInSeconds * 1000));
            }
        }

        res.status(200).json({ status: 'success', message: 'Participants added to group' });
    } catch (error) {
        console.error('Error while adding participants to group:', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

client.on('disconnected', (reason) => {
    console.log('disconnected whatsapp bot', reason);
});

client.initialize();

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
