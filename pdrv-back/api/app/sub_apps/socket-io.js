const fs = require('fs');
const privateKey = fs.readFileSync('/etc/letsencrypt/live/dev-rdv-api.fonicom.io.fonicom.io/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/dev-rdv-api.fonicom.io.fonicom.io/cert.pem', 'utf8');
const credentials = {
    key: privateKey,
    cert: certificate,
    ca: fs.readFileSync('/etc/letsencrypt/live/dev-rdv-api.fonicom.io.fonicom.io/chain.pem', 'utf8')
};

const app = require('express')();
const https = require('https').createServer(credentials, app);
const io = require('socket.io')(https, {
    maxHttpBufferSize: 1e6, // 1MB
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

let users = [];

io.on('connection', (socket) => {
    const sessionID = socket.id;
    users.push(sessionID);
    console.log('Connected:', sessionID);

    socket.on('disconnect', () => {
        users = users.filter((id) => id !== sessionID);
        console.log('Disconnected:', sessionID);
    });

   socket.on('error', (err) => {
        console.error('Socket error:', err);
    });

    socket.on('next.client', (data) => {
        console.log('next.client', data);
        io.emit('next.client', data);
    });

    // In your socket server code
    socket.on('appointment.created', (data, callback) => {
        console.log('appointment.created event received:', data);

        // Broadcast to all clients
        io.emit('appointment.created', data);

        // Send acknowledgment back to sender
        if (typeof callback === 'function') {
            callback({ success: true, timestamp: new Date().toISOString() });
        }
    });

    socket.on('appointment.reminder', (data, callback) => {
        console.log('appointment.reminder event received:', data);

        // Broadcast to all clients
        io.emit('appointment.reminder', data);

        // Send acknowledgment back to sender
        if (typeof callback === 'function') {
            callback({ success: true, timestamp: new Date().toISOString() });
        }
    });

});

https.on('error', (err) => {
    console.error('HTTPS server error:', err);
});

https.listen(3010, () => {
    console.log('Notification socket server listening on PORT 3010');
});