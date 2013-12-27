var gyro = require("./sensors/l3g4200d");
var accel = require("./sensors/adxl345");
var blenderClient = require("./clients/blenderClient");

//start the gyro
gyro.initialize();
gyro.calibrate();
//start the accel
accel.initialize();
accel.calibrate();

function send() {
	process.nextTick( function() {
		lastTickTime = process.hrtime();
		gyro.angle(function(data) {
			//var smoothed = lowPass(data);
			//var smoothed = boxCar(data);
			var smoothed = data;
			//smoothed = accum(smoothed);
			//console.log(smoothed);
			var buf = new Buffer(12);
			buf.writeFloatLE(smoothed.x, 0);
			buf.writeFloatLE(smoothed.y, 4);
			buf.writeFloatLE(smoothed.z, 8);
			blenderClient.send(buf);
			//nextTickCnt--;
			send();
		});

	}.bind(this));

};
send();
