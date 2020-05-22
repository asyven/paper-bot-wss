const WebSocket = require('ws');
let httpProxy = require('http-proxy');

const Chance = require('chance');
const chance = new Chance();

class VCoinWS {

    constructor() {
        this.ws = null;
        this.ttl = null;
        this.retryTime = 1e3;
        this.onOnlineCallback = null;
        this.allowReconnect = true;
        this.tickTtl = null;
        this.connected = false;
        this.onConnectSend = [];
        this.wsServer = "";
        this.group_id = null;
        this.debug = false;
    }

    run(wsServer, cb, options = { debug: false, proxy: false }) {
        this.wsServer = wsServer || this.wsServer;
        this.selfClose();

        if (cb) {
            this.onOnlineCallback = cb;
        }

        if (options.debug) {
            this.debug = options.debug;
        }

        try {
            if (options.proxy) {
                let proxy = httpProxy.createProxyServer({
                    target: 'yourproxy',
                    ws: true
                });
                
                this.ws = new WebSocket(this.wsServer, { proxy });
            } else{
                this.ws = new WebSocket(this.wsServer);
            }
            

            this.ws.onopen = _ => {
                this.connected = true;

                this.onConnectSend.forEach(e => {
                    if (this.ws)
                        this.ws.send(e);
                });
                this.onConnectSend = [];

                this.onOpen();
            };

            this.ws.onerror = e => {
                console.error("Проблемы с подключением: ", e);
                this.reconnect(wsServer, true);
            };

            this.ws.onclose = _ => {
                this.connected = false;

                clearInterval(this.tickTtl);
                this.tickTtl = null;


                this.ws = null;

                this.reconnect(wsServer);
            };

            this.ws.onmessage = ({ data: msg }) => {

                if ("[" === msg[0]) {
                    let data = JSON.parse(msg);

                    if (this.debug) {
                        console.log(`[R]`, data);
                    }
                    
                    if (this.onRawDataCallback) {
                        this.onRawDataCallback(data);
                    }
                }
            };
        } catch (e) {
            console.error("Ошибка при запуске майнера: ", e);
            this.reconnect(wsServer);
        }
    }

    onOpen() {
        if (this.onOnlineCallback)
            this.onOnlineCallback();

        this.retryTime = 1000;
    }

    close() {
        this.allowReconnect = false;
        clearTimeout(this.ttl);
        clearInterval(this.tickTtl);
        this.selfClose();
    }

    selfClose() {
        if (this.ws)
            try {
                this.ws.close();
            } catch (e) {
                this.connected = false;
            }
    }

    reconnect(e, force) {
        if (this.allowReconnect || force) {
            clearTimeout(this.ttl);
            this.ttl = setTimeout(_ => {
                this.run(e || this.wsServer);
            }, this.retryTime + Math.round(7e3 * Math.random()));
            this.retryTime *= 1.3
        }
    }

    onRawData(e) {
        this.onRawDataCallback = e
    }


    async sendScroll() {
        let slot4 = chance.integer({ min: 1, max: 255 });
        let slot567 = chance.pickone([0, 255]);
        let slot8 = chance.integer({ min: 71, max: 242 });
        let slot12 = chance.integer({ min: 1, max: 255 });
        let slot13 = chance.pickone([0, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
        let slot16 = chance.integer({ min: 0, max: 255 });
        let slot17 = slot16 >= 162 ? 1 : 0;
        let slot20 = chance.integer({ min: 0, max: 255 });
        let slot21 = chance.pickone([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2]);

        const buffer = new Uint8Array([
            2, 0, 0, 0,
            slot4, slot567, slot567, slot567,
            slot8, 0, 0, 0,
            slot12, slot13, 0, 0,
            slot16, slot17, 0, 0,
            slot20, slot21, 0, 0
        ]);
        return await this.sendPackBinary(buffer);
    }

    async sendPong() {
        return await this.sendPackMethod(["pong"]);
    }

    async sendRawPacket(data) {
        return await this.sendPackMethod(data);
    }

    sendPackMethod(e) {
        let t = this;

        return new Promise(function (n, r) {
            try {
                let data = JSON.stringify(e);
                if (t.debug) {
                    console.log(`[S]`, data);
                }
                
                if (t.connected) {
                    t.ws.send(data);
                } else {
                    t.onConnectSend.push(data);
                }
                
            } catch (e) {
                r(e);
            }
        });
    }

    sendPackBinary(data) {
        let t = this;

        return new Promise(function (n, r) {
            try {
                if (t.debug) {
                    console.log(`[S]`, JSON.stringify(data));
                }
                
                if (t.connected) {
                    t.ws.send(data);
                } else {
                    t.onConnectSend.push(data);
                }

            } catch (e) {
                r(e);
            }
        });
    }

}


module.exports = VCoinWS;