var b = require('bonescript');
var trig = "P8_17";
b.pinMode(trig, b.INPUT);

var triggerTest = function() {
	process.nextTick( function() {
		if (b.digitalRead(trig) == b.LOW) {
			console.log("> Fire Enabled");
		} else {
			console.log("> Fire DISABLED");
		}
		triggerTest();
	}.bind(this));
};
triggerTest();
