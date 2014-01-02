if ( typeof exports === 'undefined')
	exports = {};

/*
 * AXDL345 3 axis accel
 * ===========================
 *
 * Notes:
 * ------------
 * Using i2c
 * Address is 53
 *
 */

var b = require("bonescript");
var i2c = require("i2c");
var async = require("async");
var lowPass = require("../filters/lowpass");

var register = {
	DEVID : 0x00, //Device ID Register
	THRESH_TAP : 0x1D, //Tap Threshold
	OFSX : 0x1E, //X-axis offset
	OFSY : 0x1F, //Y-axis offset
	OFSZ : 0x20, //Z-axis offset
	DURATION : 0x21, //Tap Duration
	LATENT : 0x22, //Tap latency
	WINDOW : 0x23, //Tap window
	THRESH_ACT : 0x24, //Activity Threshold
	THRESH_INACT : 0x25, //Inactivity Threshold
	TIME_INACT : 0x26, //Inactivity Time
	ACT_INACT_CTL : 0x27, //Axis enable control for activity and inactivity detection
	THRESH_FF : 0x28, //free-fall threshold
	TIME_FF : 0x29, //Free-Fall Time
	TAP_AXES : 0x2A, //Axis control for tap/double tap
	ACT_TAP_STATUS : 0x2B, //Source of tap/double tap
	BW_RATE : 0x2C, //Data rate and power mode control
	POWER_CTL : 0x2D, //Power Control Register
	INT_ENABLE : 0x2E, //Interrupt Enable Control
	INT_MAP : 0x2F, //Interrupt Mapping Control
	INT_SOURCE : 0x30, //Source of interrupts
	DATA_FORMAT : 0x31, //Data format control
	DATAX0 : 0x32, //X-Axis Data 0
	DATAX1 : 0x33, //X-Axis Data 1
	DATAY0 : 0x34, //Y-Axis Data 0
	DATAY1 : 0x35, //Y-Axis Data 1
	DATAZ0 : 0x36, //Z-Axis Data 0
	DATAZ1 : 0x37, //Z-Axis Data 1
	FIFO_CTL : 0x38, //FIFO control
	FIFO_STATUS : 0x39	//FIFO status
};

var address = 0x53;
var port = '/dev/i2c-1';

//min calib based on spec sheet
var minCalibration = 100;

var command = {
	normal_mode : 0x01,
	measurement_mode : 0x08
};

var wire = new i2c(address, {
	device : port
});
var deviceReady = false;
var options = {};
var initialize = function(args) {

	if (args.lowPass) {
		options.lowPass = args.lowPass;
	}
	console.log("Accel Options:", options);

	wire.writeBytes(register.DATA_FORMAT, [command.normal_mode], function(err) {
		console.log("Initialize Error Data Format:", err);
		deviceReady = false;
	});
	wire.writeBytes(register.POWER_CTL, [command.measurement_mode], function(err) {
		console.log("Initialize Error POWER_CTL:", err);
		deviceReady = false;
	});
	deviceReady = true;
	calibrate();
};
//Convert the accelerometer value to G's.
//With 10 bits measuring over a +/-4g range we can find how to convert by using the equation:
//G-range = 8 because -4 to +4 is 8;
// ScaleFactor = Measurement Value * (G-range /(2^10)) or Gs = Measurement Value * (8/1024)
var ScaleFactor = 0.0078;
//pi
var m_pi = 3.14159265359;
//G = LSB converted to Gravity
//LSB = is the calibrated LSB
//R = Inertial force vector
//Rx..Rz = normalized inertial vector
//A = the angles btw R & x..z

var registers = {
	Gx : 0,
	Gy : 0,
	Gz : 0,
	LSBx : 0,
	LSBy : 0,
	LSBz : 0,
	Gmag : 0,
	R : 0,
	Rx : 0,
	Ry : 0,
	Rz : 0,
	Axr : 0,
	Ayr : 0,
	Azr : 0
};
var angle = function(observer) {
	observer(registers);
};
var getAngle = function(observer) {
	read(function(data) {
		registers.LSBx = (data.x + calibrated.x);
		registers.LSBy = (data.y + calibrated.y);
		registers.LSBz = (data.z + calibrated.z);
		registers.Gx = registers.LSBx * ScaleFactor;
		registers.Gy = registers.LSBy * ScaleFactor;
		registers.Gz = registers.LSBz * ScaleFactor;

		registers.R = Math.sqrt(Math.pow(registers.Gx, 2) + Math.pow(registers.Gy, 2) + Math.pow(registers.Gz, 2));
		//normalized inertial force vector
		registers.Rx = registers.Gx / registers.R;
		registers.Ry = registers.Gy / registers.R;
		registers.Rz = registers.Gz / registers.R;

		registers.Axr = Math.acos(registers.Gx / registers.R);
		registers.Ayr = Math.acos(registers.Gy / registers.R);
		registers.Azr = Math.acos(registers.Gz / registers.R);

		registers.rollAcc = Math.atan2(registers.Gy, registers.Gz)*180/m_pi;
		registers.pitchAcc = Math.atan2(registers.Gx, registers.Gz)*180/m_pi;
		registers.yawAcc = Math.atan2(registers.Gy,registers.Gx)*180/m_pi;

		registers.Gmag = (Math.abs(registers.Gx) + Math.abs(registers.Gy) + Math.abs(registers.Gz));
	});
};

var isOn = true;
//this puts the accel into a loop
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

var calibrated = {
	x : 0,
	y : 0,
	z : 0
};
var calibrate = function() {
	var cx = 0, cy = 0, cz = 0;
	for (var i = 0; i < minCalibration; i++) {

		read(function(data) {
			//console.log("Accel Calibration data: ", data);
			cx += data.x;
			cy += data.y;
			cz += data.z;
		});
	}
	console.log("Accel Calib Accums (x,y,z):", cx, cy, cz);
	calibrated.x = ((cx / minCalibration) / 4) * -1;
	calibrated.y = ((cy / minCalibration) / 4) * -1;

	calibrated.z = (((cz / minCalibration) - 256) / 4) * -1;

	console.log("Accel Calibration Complete", calibrated);
};
var read = function(observer) {

	try {
		async.parallel([
		function(callback) {
			wire.readBytes(register.DATAX0, 1, function(err, res) {
				callback(err, res);
			});
		},
		function(callback) {
			wire.readBytes(register.DATAX1, 1, function(err, res) {
				callback(err, res);
			});
		},
		function(callback) {
			wire.readBytes(register.DATAY0, 1, function(err, res) {
				callback(err, res);
			});
		},
		function(callback) {
			wire.readBytes(register.DATAY1, 1, function(err, res) {
				callback(err, res);
			});
		},
		function(callback) {
			wire.readBytes(register.DATAZ0, 1, function(err, res) {
				callback(err, res);
			});
		},
		function(callback) {
			wire.readBytes(register.DATAZ1, 1, function(err, res) {
				callback(err, res);
			});
		}], function(err, res) {
			// my guess is that this is where the segfault is happening.
			var xl = res[0].readInt8(0);
			var xh = res[1].readInt8(0) << 8;
			var yl = res[2].readInt8(0);
			var yh = res[3].readInt8(0) << 8;
			var zl = res[4].readInt8(0);
			var zh = res[5].readInt8(0) << 8;
			//console.log("test",xh|xl);
			////^^^^-----^^^^
			var r = {};

			r.x = res[1].readInt8(0) << 8 | res[0].readInt8(0);
			r.y = res[3].readInt8(0) << 8 | res[2].readInt8(0);
			r.z = res[5].readInt8(0) << 8 | res[4].readInt8(0);
			/*
			 r.x = xl+xh;
			 r.y = yl+yh;
			 r.z = zl+zh;
			 */
			if (options.lowPass) {
				observer(lowPass.filter(r));
			} else {
				observer(r);
			};

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
