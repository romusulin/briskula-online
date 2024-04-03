import { Socket } from 'socket.io';

export type Player = {
	name: string;
	socket: Socket;
};

export class LobbyManager {
	lobbies: {[key: string]: Player[]}

	constructor() {
		this.lobbies = {};
	}


	addPlayer(roomId: string, player: Player) {
		if (!this.lobbies[roomId]) {
			this.lobbies[roomId] = [player];
		} else {
			this.lobbies[roomId].push(player);
		}
	}

	getPlayers(roomId: string) {
		return this.lobbies?.[roomId] || [];
	}

	removePlayer(socketId: string) {
		for (const [roomId, players] of Object.entries(this.lobbies)) {
			if (players.map(p => p.socket.id).includes(socketId)) {
				delete this.lobbies[roomId];
			}
		}
	}

	removeLobby(roomId: string) {
		if (this.lobbies[roomId]) {
			delete this.lobbies[roomId];
		}
	}
}
