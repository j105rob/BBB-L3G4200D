if ( typeof exports === 'undefined')
	exports = {};
/*
 * n50 is the nostromo n50 gamepad
 * ==================================================
 * 
 *
 */

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
		var seg1 = data.readInt8(0);
		var seg2 = data.readInt8(1);
		var seg3 = data.readInt8(2);
		var seg4 = data.readInt8(3);
		var tot = seg1+seg2+seg3+seg4;

		
		console.log(seg1,seg2,seg3,seg4);
		console.log("****************************");
	});
};
var setState = function() {

};
//exports below
exports.initialize = initialize;
exports.state = state;
