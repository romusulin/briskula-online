import { Deck } from '@briskula-online/briskula-shared-entities';
import { Server, Socket } from 'socket.io';
import { ICard, ranks, pointsByRank, PlayedCard, EVENTS } from '@briskula-online/briskula-shared-entities';
import { Player } from './lobby-manager';

export class Game {
	deck: Deck;
	players: Player[];
	playerOnTurnIndex: number;
	io: Server;
	table: PlayedCard[];
	pointsByPlayer: { [playerId: string]: number};
	briscolaCard: ICard | null;
	roomId: string;
	isDeckEmptied: boolean;

	constructor(io: Server, players: Player[], roomId: string) {
		console.log('Starting game... players:' + JSON.stringify(players.map(p=>p.name)));
		this.io = io;
		this.players = players;
		this.deck = new Deck();
		this.deck.shuffle();
		this.table = [];
		this.pointsByPlayer = {
			[this.players[0].socket.id]: 0,
			[this.players[1].socket.id]: 0
		};
		this.roomId = roomId;
		this.isDeckEmptied = false;
		this.playerOnTurnIndex = 0;

		this.dealCards(3);

		this.briscolaCard = this.deck.draw()[0];
		this.io.to(this.roomId).emit(EVENTS.SET_BRISCOLA, {card: this.briscolaCard});
		console.log(`Setting briscola to: ${this.briscolaCard}`);


		this.io.to(this.roomId).emit(EVENTS.PLAYER_ON_TURN, { playerOnTurn: this.players[this.playerOnTurnIndex].socket.id});

		players.forEach(s => {
			s.socket.on(EVENTS.PLAY_CARD, this.playedCardHandler.bind(this));
			s.socket.on('disconnect', () => {
				// TODO: Abort the game
				console.log(`### Player ${s.name} has disconnected.`);
			});
		});
	}

	playedCardHandler(res: PlayedCard) {
		this.io.to(this.roomId).emit(EVENTS.PLAY_CARD, res);

		this.table.push(res);

		if (this.table.length < 2) {
			this.playerOnTurnIndex = this.playerOnTurnIndex === 0 ? 1 : 0;
		} else {
			const winningCard = this.findWinningCard();
			this.updateScore(winningCard);

			this.io.to(this.roomId).emit(EVENTS.HAND_FINISHED, this.pointsByPlayer);
			this.playerOnTurnIndex = this.players.findIndex((p) => winningCard.player === p.socket.id);
			this.dealCards(1);
			console.log('Table:' + JSON.stringify(this.table));
			console.log(`Player #${this.playerOnTurnIndex} ${winningCard.player} won the round with: ${JSON.stringify(winningCard.card)}`);
			console.log(`Current score: ${this.pointsByPlayer[this.players[0].socket.id]} - ${this.pointsByPlayer[this.players[1].socket.id]}`)
			this.table = [];
		}

		// TODO: This needs to be removed and replaced that all cards have been played
		if (this.getAccumulatedPoints() === 120) {
			this.io.to(this.roomId).emit(EVENTS.GAME_OVER, this.pointsByPlayer);
			this.players.forEach(p => p.socket.leave(this.roomId));
		}

		this.io.to(this.roomId).emit(EVENTS.PLAYER_ON_TURN, { playerOnTurn: this.players[this.playerOnTurnIndex].socket.id});
	}

	dealCards(numberOfCards: number) {
		if (this.isDeckEmptied) {
			return;
		}

		const sortedPlayers = [...this.players.map(p => p.socket.id)].sort((a,b) => {
			return a === this.players[this.playerOnTurnIndex].socket.id ? -1 : 1;
		});

		for (const playerSockedId of sortedPlayers) {
			if (!this.deck.length()) {
				this.io.to(this.roomId).emit(EVENTS.DRAW_CARD, {
					player: playerSockedId,
					cards: [this.briscolaCard]
				});
				this.io.to(this.roomId).emit(EVENTS.SET_BRISCOLA, {card: null});

				// After drawing briscola - draw no more cards
				this.isDeckEmptied = true;
			} else {
				const drawnCards = this.deck.draw(numberOfCards);
				this.io.to(this.roomId).emit(EVENTS.DRAW_CARD, {
					player: playerSockedId,
					cards: drawnCards
				});
			}
		}

		console.log(`Dealt ${numberOfCards} card(s) to each player... ${this.deck.length()} left in deck`);
	}

	updateScore(winningCard: PlayedCard) {
		for (const wonCard of this.table) {
			this.pointsByPlayer[winningCard.player] += pointsByRank[wonCard.card.rank];
		}
	}

	findWinningCard() {
		const cardsFollowingBriscola = this.table.filter((c) => {
			return c.card.suit === this.briscolaCard?.suit
		});

		if (cardsFollowingBriscola.length === 1) {
			return cardsFollowingBriscola[0];
		}

		if (cardsFollowingBriscola.length === 2) {
			return this.findHigherRankingPlayedCard(this.table[0], this.table[1]);
		}

		if (this.table[0].card.suit !== this.table[1].card.suit) {
			return this.table[0];
		}

		return this.findHigherRankingPlayedCard(this.table[0], this.table[1]);
	}

	findHigherRankingPlayedCard(a: PlayedCard, b: PlayedCard): PlayedCard {
		const firstIndex = ranks.indexOf(a.card.rank);
		const secondIndex = ranks.indexOf(b.card.rank);

		return firstIndex < secondIndex ? a : b;
	}

	getAccumulatedPoints() {
		const sum =  Object.keys(this.pointsByPlayer).reduce((acc, key) => {
			return acc + this.pointsByPlayer[key];
		}, 0);
		console.log(`Total sum of points: ${sum}`);

		return sum;
	}
}
