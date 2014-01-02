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
	accel.initialize({
		lowPass : true
	});
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
	RxEst : 0,
	RyEst : 0,
	RzEst : 0,
	RxGyro : 0,
	RyGyro : 0,
	RzGyro : 0,
	Axz:0,
	Ayz:0

};

var prevRegisters = {};

var gyroWeight = 0.90;
var accelWeight = 0.10;

//complementary filter based on http://www.pieter-jan.com/node/11
//http://www.instructables.com/id/Guide-to-gyro-and-accelerometer-with-Arduino-inclu/

var complementary = function(accel, gyro) {
	//our accel has 10 bit resolution so 1024 = 4G, 1G = 256, 0.5G = 128, 0.25G = 64

	//registers.pitch = gyro.x;
	//originally PJ subtracted out the roll to keep the signs the same..
	//registers.roll = gyro.y;
	//registers.yaw = gyro.z;

	prevRegisters = registers;

	registers.accel = accel;
	registers.gyro = gyro;

	//start with the Accel's values
	registers.RxEst = accel.Rx;
	registers.RyEst = accel.Ry;
	registers.RzEst = accel.Rz;

	var avgRateAxz = (gyro.Axz + prevRegisters.Axz) / 2;
	registers.Axz = prevRegisters.Axz + avgRateAxz * dt;
	var avgRateAyz = (gyro.Ayz + prevRegisters.Ayz) / 2;
	registers.Ayz = prevRegisters.Ayz + avgRateAyz * dt;

	registers.RxGyro = Math.sin(registers.Axz) / Math.sqrt(1 + Math.pow(Math.cos(registers.Axz), 2) * Math.pow(Math.tan(registers.Ayz), 2));
	registers.RyGyro = Math.sin(registers.Ayz) / Math.sqrt(1 + Math.pow(Math.cos(registers.Ayz), 2) * Math.pow(Math.tan(registers.Axz), 2));
	var s = function(v) {
		if (v >= 0) {
			return 1
		} else {
			return -1
		};
	};
	registers.RzGyro = s(gyro.Rz) * Math.sqrt(1 - Math.pow(registers.RxGyro, 2) - Math.pow(registers.RyGyro, 2));
	
	//sign flips
	
	registers.pitch = Math.round((accel.pitchAcc*0.10+gyro.Ty*0.90)*100)/100;
	registers.roll = Math.round((accel.rollAcc*0.02+gyro.Tx*0.98)*100)/100;
	
	console.log(registers.pitch,accel.pitchAcc,gyro.Ty);
	

	/*
	 if (accel.Gmag > 64 && accel.Gmag < 1024) {
	 //TODO: suggest moving the vector calcs into the accel class.
	 var pitchAcc = Math.atan2(accel.LSBy, accel.LSBz) * 180 / m_pi;
	 var rollAcc = Math.atan2(accel.LSBx, accel.LSBz) * 180 / m_pi;
	 //TODO: need to calc a yaw vector.
	 registers.pitch = registers.pitch * gyroWeight + pitchAcc * accelWeight;
	 registers.roll = registers.roll * gyroWeight + rollAcc * accelWeight;
	 //console.log(registers);
	 };
	 */
	//console.log(Math.round(registers.RxEst*100)/100,Math.round(registers.RyEst*100)/100,Math.round(registers.RzEst*100)/100);

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
