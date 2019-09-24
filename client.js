'use strict';

const midi = require('midi');
const WebSocketClient = require('websocket').client;
var config = require('./config');
//console.log(config);
const output = new midi.Output();// Set up a new output.
let portName=config.host+':'+config.port;
console.log("Open virtual MIDI port: "+portName);
output.openVirtualPort(portName);

var client = new WebSocketClient();
client.on('connectFailed', function(error) {
    console.error(error.toString());
    output.closePort();
});

client.on('connect', function(connection) {

    console.log('WebSocket Client Connected to '+connection.remoteAddress);

    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });

    connection.on('close', function() {
        console.log('Connection Closed');
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
        if (message.binaryData.length==1) {//MTC
            var msg = [];
            console.log('todo');
        }else if (message.binaryData.length==3) {//
            var msg = [];
            let b0=message.binaryData[0];
            let b1=message.binaryData[1];
            let b2=message.binaryData[2];
            let chan=b0 & 0x0f;
            var type=b0 & 0xf0;
            switch(type){
                case 0xc0:msg=[b0,b1];break;//¯\_(ツ)_/¯ bugfix 'Program change'
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