const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const gpio = require('rpi-gpio');
var gpiop = gpio.promise;
const bodyParser = require('body-parser');

const motor1A = 19; // Green wire
const motor1B = 21; // Blue wire
const motor1E = 23; // Blue wire
const sensorTrig = 16; // yellow
const sensorEcho = 18; //white
const time = 3000;

gpiop.setup(motor1A, gpio.DIR_OUT);
gpiop.setup(motor1B, gpio.DIR_OUT);
gpiop.setup(motor1E, gpio.DIR_OUT);
gpiop.setup(sensorTrig, gpio.DIR_OUT);
gpiop.setup(sensorEcho, gpio.DIR_IN);

app.use(bodyParser.json());

app.get('/', (req, res) => {
	res.send("Connected to rpi3!");
});

function motor(instr) {
	console.log(instr);
	if (instr === 'open') {
		gpio.write(motor1A, true); // 1 & 0 => C
		gpio.write(motor1B, false);
		gpio.write(motor1E, true);
	}
	else if (instr === 'close') {
		gpio.write(motor1A, false);
		gpio.write(motor1B, true);
		gpio.write(motor1E, true);
	}
	else {
		gpio.write(motor1E, false);
	}
}

app.post('/', (req, res) => {
	const instr = req.body.instruction;
	if (instr === 'open') {
		motor('open');
		setTimeout(() => {
			motor('stop');
		}, time);
	}
	else if (instr === 'close') {
		motor('close');
		setTimeout(() => {
			motor('stop');
		}, time);
	}
	else {
		motor('stop');
	}

	res.send("hello");
});

io.on('connection', (socket) => {
	console.log('a user connected');

	socket.on('instruction', (data) => {
		if (data === 'open all') {
			motor('open');
			setTimeout(() => {
				motor('stop');
			}, time);
		}
		else if (data === 'close all') {
			motor('close');
			setTimeout(() => {
				motor('stop');
			}, time);
		}
		else {
			motor(data);
		}
	})

	socket.on('disconnect', () => {
		console.log('a user disconnected');
	})
})

//app.get('/look', (req, res) => {
//	gpio.read(sensorEcho, (err, val) => {
//		if (err) throw err;
//		console.log(val);
//	})
//	gpio.write(sensorTrig, true);
//
//	gpio.write(sensorTrig, false);
//
//	gpio.read(sensorEcho, (err, val) => {
//		if (err) throw err;
//		console.log(val);
//
//	});
//	var value = 0;
//	while (value === 0) {
//		gpio.read(sensorEcho, (err, val) => {
//			if (err) throw err;
//			value = val;
//		});
//	}
//	var start = new Date().getTime();
//	while (value === 1) {
//		gpio.read(sensorEcho, (err, val) => {
//			if (err) throw err;
//			value = val;
//		});
//	}
//	var end = new Date().getTime();
//
//	var dist = ((end - start) * 3.43) / 2;
//
//	res.send(dist);
//	res.send('done');
//})

process.on('SIGINT', () => {
	gpio.destroy(() => {
		console.log('All pins unexported');
		process.exit();
	})
})

http.listen(8080, () => {
	console.log("listening on port 8080");
});
