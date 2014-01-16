var imu = require("./sensors/imu");

var blenderClient = require("./clients/blenderClient");

//start the imu
imu.initialize();
imu.run();

//packet layout
// rrrrpppptt tt
// 0123456789 0123456789 0123456789

function send() {
	process.nextTick( function() {
		imu.state(function(data) {
			//console.log(data.n50.keys,data.n50.hat);
			var buf = new Buffer(24);
			buf.writeFloatLE(data.pitchDiff, 0);
			buf.writeFloatLE(data.rollDiff, 4);
			buf.writeFloatLE(data.trigger, 8);
			
			buf.writeFloatLE(data.n50.wheel, 12);
			
			buf.writeFloatLE(data.n50.hat, 16);
			
			buf.writeFloatLE(data.n50.keys, 20);
			
			blenderClient.send(buf);
			
			send();
		});

	}.bind(this));
};
send();
