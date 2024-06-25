const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const puppeteer = require('puppeteer');
const qrcode = require('qrcode-terminal');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const connection = require('./config/db');

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

    // Existing code for sending messages
    function intervalfunc() {
        connection.query("select * from message where status = '0'", function (err, result) {
            if (err) throw err;
            result.forEach((message) => {
                const code = `${message.pesan}`;
                const number = `${message.number}`;
                const text = `${code}`;
                const chatid = number.substring(1) + "@c.us";
                client.sendMessage(chatid, text);
                console.log(`${message.pesan}`);
                connection.query(`update message set status = '1' where status = '0'`, function (err) {
                    if (err) throw err;
                    console.log('success kirim pesan', { time: JSON.stringify(new Date()) });
                });
            });
        });
    }
    setInterval(intervalfunc, 3000);
});

// Create new group
app.post('/create-group', async (req, res) => {
    const { groupName, participants } = req.body;

    try {
        const chat = await client.createGroup(groupName, participants.map(number => number + '@c.us'));
        res.status(200).json({ status: 'success', chat });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// Add member to group
app.post('/add-member', async (req, res) => {
    const { groupId, participant } = req.body;

    try {
        const chat = await client.getChatById(groupId);
        await chat.addParticipants([participant + '@c.us']);
        res.status(200).json({ status: 'success', message: 'Participant added' });
    } catch (error) {
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
