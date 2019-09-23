'use strict';

// dependencies
const midi = require('midi');
//const webSocketServer = require('websocket').server;
const WebSocketClient = require('websocket').client;
const fs = require('fs');
var config = require('./config');
console.log(config);

const output = new midi.Output();// Set up a new output.
// Create a virtual input port.
let portName="WebSocket Client";
console.log("Open virtual MIDI port: "+portName);
output.openVirtualPort(portName);

var client = new WebSocketClient();
client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {

    console.log('WebSocket Client Connected to '+connection.remoteAddress);

    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });

    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
        // Close the MIDI port when done.
        output.closePort();
    });

    connection.on('message', function(message) {

        if (message.type === 'binary') {
            //ok
        }else{
            return false;
        }

        //console.log(typeof message, message, message.binaryData.length);
        //console.log(typeof message);
        if (message.binaryData.length==3) {
            var msg = [];
            let b0=message.binaryData[0];
            let b1=message.binaryData[1];
            let b2=message.binaryData[2];
            let chan=b0 & 0x0f;
            var type=b0 & 0xf0;
            switch(type){
                case 0xc0:msg=[b0,b1];break;//'Program change'
                default:
                    msg=[b0,b1,b2];break;
            }
            console.log(msg);
            output.sendMessage(msg);// Send a MIDI message.
        }else{
            console.log("message.binaryData.length=="+message.binaryData.length);
        }

    });

});

let url='ws://'+config.host+':'+config.port;
console.log(url);
client.connect(url);