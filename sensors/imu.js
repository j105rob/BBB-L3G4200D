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
var async = require("async");

var initialize = function() {
	//start the gyro
	gyro.initialize();
	gyro.run();

	//start the accel
	accel.initialize({lowPass:true});
	accel.run();
};

//10ms or 100 Hz
var dt = 0.01;
//pi
var m_pi = 3.14159265359;

// y axis is roll
// x axis is pitch
// z axis is yaw
var registers = {
	roll : 0,
	pitch : 0,
	yaw : 0
};

var gyroWeight = 0.90;
var accelWeight = 0.10;

//complementary filter based on http://www.pieter-jan.com/node/11
//http://www.instructables.com/id/Guide-to-gyro-and-accelerometer-with-Arduino-inclu/

var complementary = function(accel, gyro) {
	//our accel has 10 bit resolution so 1024 = 4G, 1G = 256, 0.5G = 128, 0.25G = 64
	//console.log("Force Mag:",accel.forceMagnitude);
	registers.pitch = gyro.x;
	//originally PJ subtracted out the roll to keep the signs the same.. 
	registers.roll = (gyro.y)*-1;
	registers.yaw = gyro.z;
	registers.accel = accel;
	registers.gyro = gyro;
	
	if (accel.forceMagnitude > 64 && accel.forceMagnitude < 1024) {
		//TODO: suggest moving the vector calcs into the accel class.
		var pitchAcc = Math.atan2(accel.yraw, accel.zraw) * 180 / m_pi;
		var rollAcc = Math.atan2(accel.xraw, accel.zraw) * 180 / m_pi;
		//TODO: need to calc a yaw vector.
		registers.pitch = registers.pitch * gyroWeight + pitchAcc * accelWeight;
		registers.roll = registers.roll * gyroWeight + rollAcc * accelWeight;
		//console.log(registers);
	};
	console.log(registers);

};
var getAngle = function() {
	//need to parallelize the calls to the sensors, then process when data arrives
	read(function(data) {
		//implement the complementary filter
		complementary(data.accel, data.gyro);
	});

};
var angle = function(observer) {
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
exports.angle = angle;
