var b = require("./l3g4200d");

var d = require('dgram');

b.initialize();
b.calibrate();

var client = d.createSocket("udp4");
var bufLen = 12;
var port = 10002;
var addr = "192.168.100.92";
/*
 // Return RC low-pass filter output samples, given input samples,
 // time interval dt, and time constant RC
 function lowpass(real[0..n] x, real dt, real RC)
 var real[0..n] y
 var real α := dt / (RC + dt)
 y[0] := x[0]
 for i from 1 to n
 y[i] := y[i-1] + α * (x[i] - y[i-1])
 return y
 */
var x0 = 0;
var y0 = 0;
var z0 = 0;
var dt = 1 / 100;
var rc = 0.3;
var alpha = dt / (rc + dt);
var samples = new Array(10);

function lowPass(data) {
	var smoothed = {};
	var x, y, z;
	smoothed.x = x = Math.round((alpha * data.x) + (1.0 - alpha) * x0);
	smoothed.y = y = Math.round((alpha * data.y) + (1.0 - alpha) * y0);
	smoothed.z = z = Math.round((alpha * data.z) + (1.0 - alpha) * z0);
	x0 = x;
	y0 = y;
	z0 = z;
	return smoothed;
};

var bcTaps = 25;
var numSamples = 0;
var bcX = new Array();
var bcY = new Array();
var bcZ = new Array();

function boxCar(data) {
	data = lowPass(data);
	if (numSamples < bcTaps) {
		bcX.push(data.x);
		bcY.push(data.y);
		bcZ.push(data.z);
		numSamples++;
		return data;
	}else{
		bcX.shift();
		bcY.shift();
		bcZ.shift();
		bcX.push(data.x);
		bcY.push(data.y);
		bcZ.push(data.z);
		var res = {x:0,y:0,z:0};
		for(var i=0;i<bcTaps-1;i++){
			res.x = res.x + bcX[i];
			res.y = res.y  + bcY[i];
			res.z = res.z + bcZ[i];
		};
		res.x = Math.round(res.x/bcTaps);
		res.y = Math.round(res.y/bcTaps);
		res.z = Math.round(res.z/bcTaps);
		//console.log(res);
		return res;
	}
	
};

var nextTickCnt = 0;
var minMs = 9;
var lastTickTime = [0, 0];

var angle = {x:0,y:0,z:0};

function accum(data){
	angle.x += (data.x);
	angle.y += (data.y);
	angle.z += (data.z);
	return angle;
}

function send() {
	//nextTickCnt++;
	//console.log(nextTickCnt);

	//var diff = process.hrtime(lastTickTime);
	//var delta = diff[0] * 1e9 + diff[1] * 1.0e-6;
	//if (delta > minMs) {
		//console.log("BenchMark took %d millisecs", diff[0] * 1e9 + diff[1] * 1.0e-6);
		process.nextTick( function() {
			lastTickTime = process.hrtime();
			b.angle(function(data) {
				//var smoothed = lowPass(data);
				//var smoothed = boxCar(data);
				var smoothed = data;
				//smoothed = accum(smoothed);
				console.log(smoothed);
				var buf = new Buffer(12);
				buf.writeFloatLE(smoothed.x, 0);
				buf.writeFloatLE(smoothed.y, 4);
				buf.writeFloatLE(smoothed.z, 8);
				client.send(buf, 0, buf.length, port, addr, function() {
				});
				//nextTickCnt--;
				send();
			});
		}.bind(this));
	//} else {
	//	send();
		//console.log("skipping loop");
	//}

};
send();
