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