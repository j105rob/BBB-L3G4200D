if ( typeof exports === 'undefined')
	exports = {};
/*
 * Trigger is the GPIO Digital signal for the trigger
 * ==================================================
 * The trigger in the gun is always high until the trigger is pulled.
 * 
 * In the code triggerState = 0 when signal is high, and 1 when the signal is low.
 * 
 * 0 = no trigger pull
 * 1 = trigger pull
 * 
 *
 */

var b = require('bonescript');
var trig = "P8_17";
b.pinMode(trig, b.INPUT);

var registers = {
	triggerState : 0
};
var state = function(observer){
	return observer(resisters);
}
var initialize = function() {
};
var isOn = true;
//this puts the trigger into a loop
var run = function() {
	if (isOn) {
		process.nextTick( function() {
			getState();
			run();
		}.bind(this));
	}
};
var stop = function() {
	isOn = false;
};

var getState = function() {
	if (b.digitalRead(trig) == b.LOW) {
		registers.triggerState = 1;
	} else {
		registers.triggerState = 0;
	}
};
//exports below
exports.initialize = initialize;
exports.run = run;
exports.stop = stop;
exports.state = state;
