if ( typeof exports === 'undefined')
	exports = {};
/*
 L3G4200D 3 Axis Digital Gyro
 ====================

 Notes
 --------------------
 This is using I2C for comms

 ODR is 100 Hz for my Normal Mode
 SDO pulled to ground for address of 0x68

 TODO: need to dump the gyro registers at startup for validation of running config

 */

var b = require("bonescript");
var i2c = require("i2c");
var async = require("async");

var register = {
	who_am_i : 0x0f,
	ctrl_reg1 : 0x20,
	ctrl_reg2 : 0x21,
	ctrl_reg3 : 0x22,
	ctrl_reg4 : 0x23,
	ctrl_reg5 : 0x24,
	reference : 0x25,
	out_temp : 0x26,
	status_reg : 0x27,
	out_x_l : 0x28,
	out_x_h : 0x29,
	out_y_l : 0x2a,
	out_y_h : 0x2b,
	out_z_l : 0x2c,
	out_z_h : 0x2d,
	fifo_ctrl_reg : 0x2e,
	fifo_src_reg : 0x2f,
	int1_cfg : 0x30,
	int1_src : 0x31,
	int1_tsh_xh : 0x32,
	int1_tsh_xl : 0x33,
	int1_tsh_yh : 0x34,
	int1_tsh_yl : 0x35,
	int1_tsh_zh : 0x36,
	int1_tsh_zl : 0x37,
	int1_duration : 0x38
};

var bit = {
	zyxda : 0x08
};

var address = 0x69;
var port = '/dev/i2c-1';

var command = {
	normal_mode : 0x1f,
	data_ready : 0x08,
	block_data_update : 0x80
};

var wire = new i2c(address, {
	device : port
});
var deviceReady = false;

var initialize = function() {
	wire.writeBytes(register.ctrl_reg3, [command.data_ready], function(err) {
		console.log("Initialize Error Reg3:", err);
		deviceReady = false;
	});
	wire.writeBytes(register.ctrl_reg4, [command.block_data_update], function(err) {
		console.log("Initialize Error Reg4:", err);
		deviceReady = false;
	});
	wire.writeBytes(register.ctrl_reg1, [command.normal_mode], function(err) {
		console.log("Initialize Error Reg1:", err);
		deviceReady = false;
	});

	if (waitForData()) {
		deviceReady = true;
		console.log("Gyro Ready");
	};
	calibrate();

};

var waitForData = function() {
	var status = 0x00;
	while (true) {
		try {
			status = 0x00;
			wire.readBytes(register.status_reg, 1, function(err, data) {
				if (err) {
					console.log("Error Waiting for Data: ", err);
				}
				if (data) {
					status = data.readUInt8(0);
				}
			});
			if ((status & bit.zyxda) == bit.zyxda) {
				return true;
			}
		} catch(e) {
			console.log("Error:", e);
		}
	}
};

var minCalibration = 50;
//at 250 DPS, 1 unit = 0.00875 degrees
// which means that 114.28 units = 1 degree
var dpu = 114.28;

var accum = {
	x : 0,
	y : 0,
	z : 0
};
var dt = 0.01;
//sample rate 10 ms or 100Hz

//angle is an integral
//concept taken from: http://www.pieter-jan.com/node/7
var getAngle = function() {
	var sample = {}
	read(function(data) {
		sample.x = (data.x - calibrated.x) / dpu * dt;
		sample.y = (data.y - calibrated.y) / dpu *dt;
		sample.z = (data.z - calibrated.z) / dpu *dt;
		accum.x += sample.x;
		accum.y += sample.y;
		accum.z += sample.z;
	});
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
var angle = function(observer){
	observer(accum);
};
var read = function(observer) {
	if (waitForData()) {
		try {
			async.parallel([
			function(callback) {
				wire.readBytes(register.out_x_l, 1, function(err, res) {
					callback(err, res);
				});
			},
			function(callback) {
				wire.readBytes(register.out_x_h, 1, function(err, res) {
					callback(err, res);
				});
			},
			function(callback) {
				wire.readBytes(register.out_y_l, 1, function(err, res) {
					callback(err, res);
				});
			},
			function(callback) {
				wire.readBytes(register.out_y_h, 1, function(err, res) {
					callback(err, res);
				});
			},
			function(callback) {
				wire.readBytes(register.out_z_l, 1, function(err, res) {
					callback(err, res);
				});
			},
			function(callback) {
				wire.readBytes(register.out_z_h, 1, function(err, res) {
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
				////^^^^-----^^^^

				var r = {
					x : xh + xl,
					y : yh + yl,
					z : zh + zl
				}
				observer(r);
			});

		} catch(e) {
			console.log("Error:", e);
		}
	};
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
			console.log("Calibration data: ", data);
			cx += data.x;
			cy += data.y;
			cz += data.z;
		});
	}
	calibrated.x = cx / minCalibration;
	calibrated.y = cy / minCalibration;
	calibrated.z = cz / minCalibration;
	console.log("Calibration Complete", calibrated);
};

//exports below
exports.initialize = initialize;
exports.angle = angle;
exports.run = run;
exports.stop = stop;

