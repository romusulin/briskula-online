import express from 'express';
import { Server, Socket } from 'socket.io';
import { Game } from './game';
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server);


const rooms:{[key: string]: Socket[]} = {};

io.on('connection', (socket) => {
	console.log(`Player connected ${socket.id}`);
	socket.on('PLAYER_READY', (res) => {
		if (!res.roomId) {
			return;
		}

		console.log('Player ready: ' + res.player);
		if (!rooms[res.roomId]) {
			rooms[res.roomId] = [socket];
		} else {
			rooms[res.roomId].push(socket);
		}

		if (rooms[res.roomId].length == 2) {
			console.log(`2 players ready in #${res.roomId}: ${rooms[res.roomId]}`);
			const readyPlayers = rooms[res.roomId];
			readyPlayers.forEach(rp => rp.join(res.roomId));
			new Game(io, readyPlayers, res.roomId);
			rooms[res.roomId] = [];
		}
	});

});

const PORT = process.env.PORT || 80;
server.listen(PORT, () => {
	console.log(`Listening on :${PORT}`);
});

app.use(express.static('public'));
