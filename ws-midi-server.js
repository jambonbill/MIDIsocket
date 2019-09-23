'use strict';

// Create a virtual MIDI input,
// on which you can send your events,
// that will be forwarded over webSocket to connected clients

// dependencies
const os = require('os');
const ifaces = os.networkInterfaces();
const midi = require('midi');
const webSocketServer = require('websocket').server;
const http = require('http');
var config = require('./config');
var serverPort=config.port;

//Get local ip address(es)
Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0;
  ifaces[ifname].forEach(function (iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }
    if (alias >= 1) {
      console.log(ifname + ':' + alias, iface.address);// this single interface has multiple ipv4 addresses
    } else {
      console.log(ifname, iface.address);// this interface has only one ipv4 adress
    }
    ++alias;
  });
});

var players = {};//Connected nodes
var nextPlayerId = 0;

// create http server - but do we really need ????
var server = http.createServer(function(request, response) { });
server.listen(serverPort, function() {
    console.log("Server is listening on port " + serverPort);
});


// create websocket server
var wServer = new webSocketServer({ httpServer: server });

// connection request callback
wServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);
    connection.binaryType = "arraybuffer";//this is the shit

    var player = {};
    player.connection = connection;
    player.id = nextPlayerId;
    nextPlayerId++;
    players[player.id] = player;

    console.log((new Date()) + ' connect: ' + player.id);
    console.log(players.length + "nodes");

    // message received callback
    connection.on('message', function(message) {
        if (message.type == 'binary' && 'binaryData' in message && message.binaryData instanceof Buffer) {
            // this works!
            console.log('received:',message);
            //console.log(message);
        }
    });

    // connection closed callback
    connection.on('close', function(connection) {
        console.log((new Date()) + ' disconnect: ' + player.id);
        delete players[player.id];
    });
});

// Set up a new input.
const input = new midi.Input();

// Configure a callback.
input.on('message', (deltaTime, message) => {
    //forward received midi messages to connected ws clients :)
    //console.log(`m: ${message} d: ${deltaTime}`);

    // Todo : send only two bytes on prg change //
    var buf = new Buffer(3);
    buf[0] = message[0];
    buf[1] = message[1];
    buf[2] = message[2];
    console.log(buf);

    for (var index in players) {
        var player = players[index];
        console.log('sending: ', buf);
        //player.connection.send(byteArray.buffer);
        player.connection.sendBytes(buf);
    }
});

// Create a virtual input port.
let portName="WebSocket:"+serverPort;
console.log("Open virtual MIDI port: "+portName);
input.openVirtualPort(portName);