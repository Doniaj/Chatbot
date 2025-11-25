const app_config = require("../helpers/app").appConfig;
const { io } = require("socket.io-client");

class AppSocket {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.pendingEmissions = []; // Store emissions that failed due to connection issues

        this.connect();

        // Set up a periodic check to ensure socket is connected
        setInterval(() => this.checkConnection(), 30000);
    }

    connect() {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
        }


        this.socket = io(app_config['socketUrl'].toString(), {
            secure: true,
            transports: ["websocket", "polling"],
            rejectUnauthorized: false,
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 20000,
            cors: { origin: '*' }
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;

            // Process any pending emissions
            this.processPendingEmissions();

            // Broadcast connected event
            this.emit('socket.status', {
                status: 'connected',
                id: this.socket.id,
                timestamp: new Date().toISOString()
            });
        });

        this.socket.on('connect_error', (error) => {
            this.isConnected = false;

            this.reconnectAttempts++;
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                setTimeout(() => this.connect(), 2000);
            }
        });

        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;

            if (reason === 'io server disconnect' || reason === 'transport close') {
                setTimeout(() => this.connect(), 1000);
            }
        });

        this.socket.on('error', (error) => {
            console.error('[AppSocket] Socket error:', error);
        });
    }

    checkConnection() {
        if (!this.isSocketConnected() && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.connect();
        }
    }

    processPendingEmissions() {
        if (this.pendingEmissions.length > 0) {

            // Process each pending emission
            const pending = [...this.pendingEmissions];
            this.pendingEmissions = [];

            pending.forEach(item => {
                this.emit(item.event, item.data, item.callback);
            });
        }
    }

    emit(event, data, callback) {
        if (!this.isSocketConnected()) {
            console.warn(`[AppSocket] Cannot emit '${event}', socket not connected. Storing for later emission.`);

            if (this.pendingEmissions.length >= 50) {
                this.pendingEmissions.shift(); // Remove oldest
            }

            this.pendingEmissions.push({ event, data, callback });

            this.reconnect();
            return false;
        }


        if (callback && typeof callback === 'function') {
            return this.socket.emit(event, data, callback);
        } else {
            return this.socket.emit(event, data);
        }
    }


    reconnect() {

        if (this.socket) {
            this.socket.disconnect();
            setTimeout(() => this.connect(), 500);
        }
    }

    isSocketConnected() {
        return this.isConnected && this.socket && this.socket.connected;
    }
}

module.exports = new AppSocket();