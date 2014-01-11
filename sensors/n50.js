if ( typeof exports === 'undefined')
	exports = {};
/*
 * n50 is the nostromo n50 gamepad
 * ==================================================
 * 
 *
 */

var HID = require('node-hid');
var devices = HID.devices();
//assumption is that there is only one HID on the gun attached to USB and it is the n50!!
var n50 = new HID.HID(devices[0].path);
var registers = {

};
var state = function(observer){
	return observer(registers);
}
var initialize = function() {
	n50.on("data", function(data) {
		console.log(data);
	});
};
var setState = function() {

};
//exports below
exports.initialize = initialize;
exports.state = state;
