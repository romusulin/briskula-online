import express from 'express';
import { Server, Socket } from 'socket.io';
import { Game } from './game';
import { LobbyManager } from './lobby-manager';
import { EVENTS } from '@briskula-online/briskula-shared-entities';
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

type Player = {
	name: string;
	socket: Socket;
};

const rooms:{[key: string]: Player[]} = {};

const roomManager = new LobbyManager();

io.on('connection', (socket) => {
	console.log(`Player connected ${socket.id}`);
	socket.on(EVENTS.JOIN_LOBBY, (res: {name:string; lobbyId: string;}) => {
		if (!res.lobbyId) {
			return;
		}

		console.log('Player ready: ' + res.name);
		const player = {
			name: res.name,
			socket: socket
		};
		roomManager.addPlayer(res.lobbyId, player);

		const playersInLobby = roomManager.getPlayers(res.lobbyId);
		if (playersInLobby.length == 2) {
			console.log(`2 players ready in #${res.lobbyId}: ${playersInLobby.map(p => p.name).join(' & ')}`);
			playersInLobby.forEach(p => p.socket.join(res.lobbyId));
			new Game(io, playersInLobby, res.lobbyId);
			roomManager.removeLobby(res.lobbyId);
		}
	});

	socket.on(EVENTS.LEAVE_LOBBY, () => {
		roomManager.removePlayer(socket.id);
	});

	socket.on('disconnect', () => {
		roomManager.removePlayer(socket.id);
	});
});



const PORT = process.env.PORT || 80;
server.listen(PORT, () => {
	console.log(`Listening on :${PORT}`);
});

app.get('/rooms', (req, res, next) => {
	res.json(Object.keys(roomManager.lobbies));
});

app.use(express.static('public'));
