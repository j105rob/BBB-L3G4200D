var imu = require("./sensors/imu");

var blenderClient = require("./clients/blenderClient");

//start the imu
imu.initialize();
imu.run();

function send() {
	process.nextTick( function() {
		imu.angle(function(data) {
			/*
			var smoothed = data;
			console.log("gyro data:",data);
			var buf = new Buffer(12);
			buf.writeFloatLE(smoothed.x, 0);
			buf.writeFloatLE(smoothed.y, 4);
			buf.writeFloatLE(smoothed.z, 8);
			blenderClient.send(buf);
			*/
			send();
		});

	}.bind(this));
};
send();
