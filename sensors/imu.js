if ( typeof exports === 'undefined')
	exports = {};
/*
 * IMU combines the Accel & Gyro Data
 * ====================================
 *
 * READ THIS!!! http://www.starlino.com/imu_guide.html
 *
 */

var gyro = require("./l3g4200d");
var accel = require("./adxl345");
var trigger = require("./trigger");

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
};

//10ms or 100 Hz
var dt = 0.01;
//pi
var m_pi = 3.14159265359;

// y axis is roll
// x axis is pitch
// z axis is yaw
var registers = {
	RxEst : 0,
	RyEst : 0,
	RzEst : 0,
	RxGyro : 0,
	RyGyro : 0,
	RzGyro : 0,
	Axz : 0,
	Ayz : 0,
	pitch : 0,
	roll : 0,
	trigger:0

};

var prevRegisters = {};

var gyroWeight = 0.98;
var accelWeight = 0.02;

//complementary filter based on http://www.pieter-jan.com/node/11
//http://www.instructables.com/id/Guide-to-gyro-and-accelerometer-with-Arduino-inclu/
var rnd = function(v) {
	return Math.round(v * 10) / 10;
}
var complementary = function(accel, gyro) {
	//sign flips for correcting coods btw gyro and accel
	var flipGyroTy = (gyro.DPSy) * -1;

	registers.pitch += flipGyroTy;
	registers.roll += gyro.DPSx;

	if (accel.Gmag > 0.5 && accel.Gmag < 2.0) {
		registers.pitch = (registers.pitch * gyroWeight) + (accel.pitch * accelWeight);
		registers.roll = (registers.roll * gyroWeight) + (accel.roll * accelWeight);
	}
	//console.log(rnd(registers.pitch), rnd(registers.roll));

};
var getAngle = function() {
	//need to parallelize the calls to the sensors, then process when data arrives
	read(function(data) {
		//implement the complementary filter
		complementary(data.accel, data.gyro);
		//set the trigger state
		registers.trigger = data.trigger.triggerState;
	});

};
var state = function(observer) {
	observer(registers);
};
var isOn = true;
//this puts the gyro into a loop
var run = function() {
	if (isOn) {
		process.nextTick( function() {
			getAngle();
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
