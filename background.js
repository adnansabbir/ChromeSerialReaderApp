let _web_app_port = null;
let device_list = [];
let connectionId = '';
let dataReceived = '';
let data_receiving_started = false;
const Serial = chrome.serial;

let onGetDevices = function (ports) {
    device_list = [];
    for (let i = 0; i < ports.length; i++) {

        if (device_list.indexOf(ports[i].path) === -1)
            device_list.push(ports[i].path);
        console.log(ports[i].path);
    }
    _web_app_port.postMessage({device_list: device_list});
};
// Serial.getDevices(onGetDevices);
const onConnect = function (connectionInfo) {
    // The serial port has been opened. Save its id to use later.
    if (connectionInfo) {
        connectionId = connectionInfo.connectionId;
        if (_web_app_port) {
            _web_app_port.postMessage({
                serial_port_status: 'connected',
                connection_id: connectionId
            });
        }
    }
    Serial.onReceive.addListener(onReceiveCallback);
};

function str2ab(str) {
    let buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    let bufView = new Uint16Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

let onReceiveCallback = (connection) => {
    let lines_received = '';
    if (connection.connectionId === connectionId && connection.data) {
        let str = String.fromCharCode.apply(null, new Uint8Array(connection.data));
        lines_received += ab2str(connection.data);
        if (lines_received[0] === '{') {
            dataReceived += lines_received;
            data_receiving_started = true;
        } else if (data_receiving_started && lines_received.slice(lines_received.length - 1) === '}') {
            data_receiving_started = false;
            dataReceived += lines_received;
            onWholeBufferRead(dataReceived);
            dataReceived = '';
        } else if (data_receiving_started) {
            dataReceived += lines_received;
        }
        // console.log(lines_received);
    }
};


// Convert ArrayBuffer  to String
const ab2str = function (buf) {
    try {
        let bufView = new Uint8Array(buf);
        let encodedString = String.fromCharCode.apply(null, bufView);
        return decodeURIComponent(escape(encodedString));
    } catch (e) {
        console.log(e);
    }
};

// After Reading All data in buffer
const onWholeBufferRead = (data) => {
    console.log(JSON.parse(data));
    if (_web_app_port) {
        console.log(_web_app_port);
        _web_app_port.postMessage(JSON.parse(data));
    }
};

chrome.runtime.onConnectExternal.addListener((port) => {
    _web_app_port = port;
    device_list = [];
    Serial.getDevices(onGetDevices);
    console.log('setting up new connection');
    _web_app_port.onMessage.addListener((msg) => {
        if (msg['sender'] === 'chrome-serial-reader') {
            _web_app_port.postMessage({
                establishConnection: true,
            });
        } else if (msg['port_config']) {
            if (connectionId) {
                Serial.disconnect(connectionId, () => {
                    console.log('Disconnected Serial First and reconnecting');
                    Serial.connect(msg['port_config']['port'], {bitrate: parseInt(msg['port_config']['baudRate'])}, onConnect);
                });
            } else {
                Serial.connect(msg['port_config']['port'], {bitrate: parseInt(msg['port_config']['baudRate'])}, onConnect);
            }
            // Connect to the serial port with given data
        } else if (msg['disconnect_serial'] === true) {
            disconnectSerial();
        } else if (msg['reload_ports'] === true) {
            Serial.getDevices(onGetDevices);
        }
    });
    _web_app_port.onDisconnect.addListener(() => {
        _web_app_port = null;
        disconnectSerial();
        // Serial.disconnect(connectionId, () => {
        //     if (_web_app_port) {
        //         _web_app_port.postMessage({
        //             serial_port_status: 'disconnected'
        //         });
        //     }
        // });
    })
});

connectSerial = (port_config) => {
    Serial.connect(port_config['port'], {bitrate: parseInt(port_config['baudRate'])}, onConnect());
};


disconnectSerial = () => {
    Serial.disconnect(connectionId, () => {
        if (_web_app_port) {
            _web_app_port.postMessage({
                serial_port_status: 'disconnected'
            });
        }
    });
};
