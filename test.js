var imu = require("./sensors/imu");

var blenderClient = require("./clients/blenderClient");

//start the imu
imu.initialize();
imu.run();

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function(data) {
  process.stdout.write("Got Data: "+data);
});

function send() {
	process.nextTick( function() {
		imu.state(function(data) {
			var buf = new Buffer(24);
			buf.writeFloatLE(data.roll, 0);
			buf.writeFloatLE(data.pitch, 4);
			buf.writeFloatLE(data.trigger, 8);
			buf.writeFloatLE(data.n50.hat, 12);
			buf.writeFloatLE(data.n50.wheel, 16);
			buf.writeFloatLE(data.n50.keys, 20);
			
			blenderClient.send(buf);
			
			send();
		});

	}.bind(this));
};
send();
