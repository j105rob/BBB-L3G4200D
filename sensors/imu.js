if ( typeof exports === 'undefined')
	exports = {};
/*
 * IMU combines the Accel & Gyro Data also adds trigger and n50 gamepad
 * ====================================
 *
 * READ THIS!!! http://www.starlino.com/imu_guide.html
 *
 */

var gyro = require("./l3g4200d");
var accel = require("./adxl345");
var trigger = require("./trigger");
var n50 = require("./n50");

var async = require("async");

var initialize = function() {
	//start the gyro
	gyro.initialize();
	gyro.run();

	//start the accel
	accel.initialize({
		lowPass : true
	});
	accel.run();

	//start the trigger
	trigger.initialize();
	trigger.run();

	//start the gamepad
	n50.initialize();
};

var registers = {
	pitch : 0,
	roll : 0,
	trigger : 0

};

var gyroWeight = 0.95;
var accelWeight = 0.05;

//complementary filter based on http://www.pieter-jan.com/node/11
//http://www.instructables.com/id/Guide-to-gyro-and-accelerometer-with-Arduino-inclu/
var rnd = function(v) {
	return Math.round(v * 10) / 10;
}
var gMagAccum = 0;
//TODO: move this func into a filter
var complementary = function(accel, gyro) {
	//sign flips for correcting coods btw gyro and accel
	var flipGyroTy = (gyro.DPSy) * -1;

	registers.pitch += flipGyroTy;
	registers.roll += gyro.DPSx;

	//console.log(process.uptime());

	if (accel.R > 0.9 && accel.R < 2.0) {
		registers.pitch = (registers.pitch * gyroWeight) + (accel.pitch * accelWeight);
		registers.roll = (registers.roll * gyroWeight) + (accel.roll * accelWeight);
	}
	//console.log(rnd(registers.pitch), rnd(registers.roll));
	registers.pitch = rnd(registers.pitch);
	registers.roll = rnd(registers.roll);

};
var center = {
	roll : 0,
	pitch : 0,
	x1 : 0.5,
	y1 : 0.5,

};
//http://stackoverflow.com/questions/1471370/normalizing-from-0-5-1-to-0-1
var setCenter = function() {
	//check for re-center key
	if (registers.n50.keys & n50.keys.key5) {
		center.roll = registers.roll;
		center.pitch = registers.pitch;

	} else {
		if (registers.n50.keys & n50.keys.key1) {
			center.roll = registers.roll;
			center.pitch = registers.pitch;
		};

		//normailze the center
		registers.pitchDiff = center.pitch - registers.pitch;
		registers.rollDiff = center.roll - registers.roll;

		//reset the guns center
		center.roll = registers.roll;
		center.pitch = registers.pitch;

		//console.log(registers.sPitch);
	}
};
var ticks = 0;
var getAngle = function() {
	read(function(data) {
		ticks += 1;
		//implement the complementary filter
		complementary(data.accel, data.gyro);
		//set the trigger state
		registers.trigger = data.trigger.triggerState;
		//set the n50 state
		registers.n50 = data.n50;
	});

};
var state = function(observer) {
	observer(registers);
};
var isOn = true;
//this puts the imu into a loop
var run = function() {
	if (isOn) {
		process.nextTick( function() {
			getAngle();
			setCenter();
			run();
		}.bind(this));
	}
};
var stop = function() {
	isOn = false;
};
var read = function(observer) {

	try {
		async.parallel({
			gyro : function(callback) {
				gyro.angle(function(data) {
					callback(null, data);
				});
			},
			accel : function(callback) {
				accel.angle(function(data) {
					callback(null, data);
				});
			},
			trigger : function(callback) {
				trigger.state(function(data) {
					callback(null, data)
				});
			},
			n50 : function(callback) {
				n50.state(function(data) {
					callback(null, data)
				});
			}
		}, function(err, res) {
			//console.log(err, res);
			observer(res);
		});

	} catch(e) {
		console.log("Error:", e);
	}

};
//exports below
exports.initialize = initialize;
exports.run = run;
exports.stop = stop;
exports.state = state;
