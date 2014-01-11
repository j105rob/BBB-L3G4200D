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
			
			var smoothed = data;
			//console.log(data.roll,data.pitch,data.trigger);
			var buf = new Buffer(12);
			buf.writeFloatLE(smoothed.roll, 0);
			buf.writeFloatLE(smoothed.pitch, 4);
			buf.writeFloatLE(smoothed.trigger, 8);
			blenderClient.send(buf);
			
			send();
		});

	}.bind(this));
};
send();
