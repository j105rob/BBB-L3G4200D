if ( typeof exports === 'undefined')
	exports = {};
/*
 * n50 is the nostromo n50 gamepad
 * ==================================================
 *
 * seems to deliver the data via a buffer in the following format:
 *
 * first byte is left and right on the hat
 * second byte is forward and back
 * third and forth byte are the keys
 * fifth byte is the wheel
 *
 * by combining the bytes in the associated groups we can use bitwise logic to determine keys pressed
 *
 *
 */

var keys = {
	hatCenter : 1,
	hatLeft : 2,
	hatRight : 4,
	hatForward : 8,
	hatBack : 16,
	wheelMin : 47,
	wheelMax : 255,
	key1 : 1,
	key2 : 2,
	key3 : 4,
	key4 : 8,
	key5 : 16,
	key6 : 32,
	key7 : 64,
	key8 : 128,
	key9 : 256,
	key10 : 512
};

var HID = require('node-hid');
var devices = HID.devices();
//assumption is that there is only one HID on the gun attached to USB and it is the n50!!
var n50Raw = new HID.HID(devices[0].path);
var registers = {
	hat : 0,
	keys : 0,
	wheel : 0
};
var state = function(observer) {
	return observer(registers);
}
var initialize = function() {
	n50Raw.on("data", function(data) {
		var h1 = data.readUInt8(0);
		var h2 = data.readUInt8(1);
		var h = 0;
		switch(h1) {
			case 0:
				h = h | keys.hatLeft;
				break;
			case 128:
				h = h | keys.hatCenter;
				break;
			case 255:
				h = h | keys.hatRight;
				break;
		};
		switch(h2) {
			case 0:
				h = h | keys.hatForward;
				break;
			case 128:
				h = h | keys.hatCenter;
				break;
			case 255:
				h = h | keys.hatBack;
				break;
		};
		//console.log(h1,h2,h);
		//registers.hat = data.readUInt16LE(0);
		registers.hat = h;
		registers.keys = data.readUInt16LE(2);
		registers.wheel = data.readUInt8(4);
	});
};
//exports below
exports.initialize = initialize;
exports.state = state;
exports.keys = keys;
