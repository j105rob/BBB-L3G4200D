if ( typeof exports === 'undefined')
	exports = {};

var d = require('dgram');

var client = d.createSocket("udp4");
var bufLen = 12;
var port = 10002;
var addr = "192.168.100.92";

var send = function(buf) {
	client.send(buf, 0, buf.length, port, addr, function() {
	});
}

exports.send = send;
