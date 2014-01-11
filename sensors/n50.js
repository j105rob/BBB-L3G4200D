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

var value = {
	hatCenter:32896,
	hatLeft: 32768,
	hatRight:33023,
	hatForward:128,
	hatBackward:65408,
	wheelMin:47,
	wheelMax:255,
	key1:1,
	key2:2,
	key3:4,
	key4:8,
	key5:16,
	key6:32,
	key7:64,
	key8:128,
	key9:256,
	key10:512	
};

var HID = require('node-hid');
var hidstream = require('hidstream');
var devices = HID.devices();
//assumption is that there is only one HID on the gun attached to USB and it is the n50!!
var n50 = new hidstream.device(devices[0].path);
var n50Raw = new HID.HID(devices[0].path);
var registers = {

};
var state = function(observer){
	return observer(registers);
}
var initialize = function() {
	n50Raw.on("data", function(data) {
		var hat = data.readUInt16LE(0);
		var keys = data.readUInt16LE(2);
		var wheel = data.readUInt8(4);


		
		console.log(hat,keys,wheel);
		console.log("****************************");
	});
};
var setState = function() {

};
//exports below
exports.initialize = initialize;
exports.state = state;
