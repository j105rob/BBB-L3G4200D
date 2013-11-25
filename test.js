var b = require("./l3g4200d");

var d = require('dgram');

b.initialize();
b.calibrate();

var client = d.createSocket("udp4");
var bufLen = 12;
var port = 10002;
var addr = "192.168.100.92";

var x0 = 0;
var y0 = 0;
var z0 = 0;
var dt = 1 / 100;
var rc = 0.9;
var alpha = dt / (rc + dt);

function lowPass(data) {
	var smoothed = {};
	var x, y, z;
	smoothed.x = x = (alpha * data.x) + (1.0 - alpha) * x0;
	smoothed.y = y = (alpha * data.y) + (1.0 - alpha) * y0;
	smoothed.z = z = (alpha * data.z) + (1.0 - alpha) * z0;
	x0 = x;
	y0 = y;
	z0 = z;
	return smoothed;
};

var nextTickCnt = 0;
var minMs = 20;
var lastTickTime = [0,0];
function send() {
	//nextTickCnt++;
	//console.log(nextTickCnt);

	var diff = process.hrtime(lastTickTime);
	var delta = diff[0] * 1e9 + diff[1] * 1.0e-6;
	if (delta > minMs) {
		console.log("BenchMark took %d millisecs", diff[0] * 1e9 + diff[1] * 1.0e-6);
		process.nextTick( function() {
			lastTickTime = process.hrtime();
			b.angle(function(data) {
				var smoothed = lowPass(data);
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
	}else{
		send();
		//console.log("skipping loop");
	}

};
send();
