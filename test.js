var imu = require("./sensors/imu");

var blenderClient = require("./clients/blenderClient");

//start the imu
imu.initialize();
imu.run();

//packet layout
// rrrrpppptw hhkk
// 0123456789 0123456789 0123456789

function send() {
	process.nextTick( function() {
		imu.state(function(data) {
			console.log(data.pitch,data.roll);
			var buf = new Buffer(24);
			buf.writeFloatLE(data.pitch, 0);
			buf.writeFloatLE(data.roll, 4);
			buf.writeUInt8(data.trigger, 8);
			buf.writeUInt8(data.n50.wheel, 9);
			
			buf.writeUInt16LE(data.n50.hat, 10);
			
			buf.writeUInt16LE(data.n50.keys, 12);
			
			blenderClient.send(buf);
			
			send();
		});

	}.bind(this));
};
send();
