import {io} from "socket.io-client";
import siteConfig from "../configs/site.config";


if (window._socketInstance) {
    console.log("Disconnecting existing socket instance");
    window._socketInstance.disconnect();
}

let socket = io(siteConfig.socketBaseUrl, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    withCredentials: true,
    forceNew: true,
    autoConnect: true
});

window._socketInstance = socket;

class PushService {
    constructor() {
        this.isConnected = null;
        this.onConnectionChange = null;
        this.eventListeners = {};

        this.setupConnectionListeners();

        socket.onAny((event, ...args) => {
            console.log(`SOCKET EVENT: ${event}`, args[0]);
        });

        if (!socket.connected) {
            console.log("Socket not connected on init, connecting...");
            setTimeout(() => socket.connect(), 500);
        }
    }

    setupConnectionListeners() {
        socket.on('connect', () => {
            console.log('✅ SOCKET CONNECTED:', socket.id);
            this.isConnected = true;

            if (this.onConnectionChange) {
                this.onConnectionChange(true);
            }

            this.refreshEventListeners();
        });

        socket.on('connect_error', (error) => {
            console.error('❌ SOCKET CONNECTION ERROR:', error.message);
            this.isConnected = false;

            if (this.onConnectionChange) {
                this.onConnectionChange(false);
            }
        });

        socket.on('disconnect', (reason) => {
            console.log('⚠️ SOCKET DISCONNECTED:', reason);
            this.isConnected = false;

            if (this.onConnectionChange) {
                this.onConnectionChange(false);
            }
            if (reason === 'io server disconnect') {
                setTimeout(() => socket.connect(), 1000);
            }
        });
    }

    refreshEventListeners() {
        console.log("Socket reconnected, refreshing event listeners");
    }

    reconnect() {
        console.log('🔄 RECONNECTING SOCKET...');

        if (socket) {
            socket.disconnect();
            setTimeout(() => socket.connect(), 500);
        }
    }

    removeEvent(event) {
        console.log(`Removing listener for event: ${event}`);
        socket.off(event);
        delete this.eventListeners[event];
    }



    getEvent(callback, event) {
        console.log(`Adding listener for event: ${event}`);

        this.removeEvent(event);

        socket.on(event, (data) => {
            console.log(`🔔 RECEIVED '${event}' EVENT:`, data);

            if (event === 'appointment.reminder' && data && data.notification) {
                const notification = data.notification;

                if (notification.is_sent) {
                    console.log("Received a SENT reminder notification - passing through");
                    callback(null, data);
                    return;
                }

                if (notification.availability) {
                    const date = notification.availability.start_date ||
                        new Date().toISOString().split('T')[0];
                    const time = notification.availability.start_time;

                    if (time) {
                        const now = new Date();
                        const appointmentTime = new Date(`${date}T${time}`);
                        const minutesUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (60 * 1000);

                        console.log(`Time until appointment: ${minutesUntilAppointment.toFixed(1)} minutes`);


                        if (minutesUntilAppointment > 30) {
                            console.log(`FILTERING reminder - too far in future (${minutesUntilAppointment.toFixed(1)} min)`);
                            return; // Don't pass to callback
                        }
                    }
                }
            }

            callback(null, data);
        });

        this.eventListeners[event] = true;
    }
    sendMessage(event, data) {
        if (socket && socket.connected) {
            console.log(`📤 EMITTING '${event}' EVENT:`, data);
            socket.emit(event, data);
            return true;
        } else {
            console.error(`❌ Cannot emit '${event}' - socket not connected`);
            this.reconnect();
            return false;
        }
    }

    areNotificationsEnabled() {
        return 'Notification' in window && Notification.permission === 'granted';
    }



    showNotification(title, options = {}) {
        if (!this.areNotificationsEnabled()) {
            console.log('Browser notifications not enabled');
            return null;
        }

        try {
            const notification = new Notification(title, options);

            notification.onclick = () => {
                console.log('Notification clicked');
                window.focus();
                notification.close();
            };

            return notification;
        } catch (error) {
            console.error('Error showing notification:', error);
            return null;
        }
    }


}

export default PushService;