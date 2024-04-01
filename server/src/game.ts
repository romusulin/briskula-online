import { Deck } from '@briskula-online/briskula-shared-entities';
import { Server, Socket } from 'socket.io';
import { ICard, ranks, pointsByRank, PlayedCard, EVENTS } from '@briskula-online/briskula-shared-entities';

export class Game {
	deck: Deck;
	players: string[];
	playerOnTurnIndex: number;
	io: Server;
	table: PlayedCard[];
	pointsByPlayer: { [playerId: string]: number};
	briscolaCard: ICard | null;
	roomId: string;

	constructor(io: Server, sockets: Socket[], roomId: string) {
		console.log('Starting game... players:' + sockets);
		this.io = io;
		this.players = sockets.map(s => s.id);
		this.deck = new Deck();
		this.deck.shuffle();
		this.table = [];
		this.pointsByPlayer = {
			[this.players[0]]: 0,
			[this.players[1]]: 0
		};
		this.roomId = roomId;

		this.dealCards(3);

		this.briscolaCard = this.deck.draw()[0];
		this.io.to(this.roomId).emit(EVENTS.SET_BRISCOLA, {card: this.briscolaCard});

		this.playerOnTurnIndex = 0;
		this.io.to(this.roomId).emit(EVENTS.PLAYER_ON_TURN, { playerOnTurn: this.players[this.playerOnTurnIndex]});

		sockets.forEach(s => {
			s.on(EVENTS.PLAY_CARD, this.playedCardHandler.bind(this));
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
			this.table = [];
			this.io.to(this.roomId).emit(EVENTS.HAND_FINISHED, this.pointsByPlayer);
			this.playerOnTurnIndex = this.players.findIndex((p) => winningCard.player === p);
			this.dealCards(1);
			console.log('Table:' + JSON.stringify(this.table));
			console.log(`Player #${this.playerOnTurnIndex} ${winningCard.player} won the round with: ${JSON.stringify(winningCard.card)}`);
		}

		if (this.getAccumulatedPoints() === 120) {
			this.io.to(this.roomId).emit(EVENTS.GAME_OVER, this.pointsByPlayer);
		}

		this.io.to(this.roomId).emit(EVENTS.PLAYER_ON_TURN, { playerOnTurn: this.players[this.playerOnTurnIndex]});
	}

	dealCards(numberOfCards: number) {
		const sortedPlayers = [...this.players].sort((a,b) => {
			return a === this.players[this.playerOnTurnIndex] ? -1 : 1;
		});

		for (const player of sortedPlayers) {
			if (!this.deck.length()) {
				this.io.to(this.roomId).emit(EVENTS.DRAW_CARD, {
					player: player,
					cards: this.briscolaCard
				});
				this.briscolaCard = null;
				this.io.to(this.roomId).emit(EVENTS.SET_BRISCOLA, {card: null});
			} else {
				const drawnCards = this.deck.draw(numberOfCards);
				this.io.to(this.roomId).emit(EVENTS.DRAW_CARD, {
					player: player,
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
		return Object.keys(this.pointsByPlayer).reduce((acc, key) => {
			return acc + this.pointsByPlayer[key];
		}, 0);
	}
}
