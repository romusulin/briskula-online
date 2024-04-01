import { Deck, ICard, EVENTS } from '@briskula-online/briskula-shared-entities';
import { io, Socket } from 'socket.io-client';
import $ from 'jquery';

const socket= io();

const startGameButton = document.getElementById('btn-start-game');
const briscolaEl = document.getElementById('briscola');
const playerHandEl = document.getElementById('player-cards');
const deckEl = document.getElementById('deck');
const playAreaEl = document.getElementById('play-area');
const opponentCardsEl = document.getElementById('opponent-cards');

let playerHand = [];
let playArea = [];
let myTurn = false;
let score = 0;
let handOverCooldown = false;

startGameButton.onclick = () => {
	const roomId = document.getElementById('room-id')['value'];
	socket.emit(EVENTS.PLAYER_READY, {
		player: socket.id,
		roomId: roomId
	});
};

socket.on(EVENTS.SET_BRISCOLA, (res) => {
	briscolaEl.innerHTML = !res.card ? '' : `<img src="/images/${res.card.suit}${res.card.rank}.jpg">`;
	deckEl.innerHTML = !res.card ? '' : `<img src="/images/P0.jpg">`;
});

socket.on(EVENTS.DRAW_CARD, (res) => {
	console.log(`JA SAM: ${socket.id}`);
	console.log(`Dobio sam karte : ${JSON.stringify(res)}`);

	if (res.player !== socket.id || !res.cards?.length) {
		return;
	}

	playerHand.push(...res.cards);
	redrawPlayerHand();
	redrawOpponentHand();
});

socket.on(EVENTS.PLAYER_ON_TURN, (res) => {
	console.log(`Na redu je ${res.playerOnTurn} +++ ${res.playerOnTurn === socket.id}`);
	myTurn = res.playerOnTurn === socket.id;
})


socket.on(EVENTS.PLAY_CARD, (res) => {
	if (res.player === socket.id) {
		return;
	}

	const elements = opponentCardsEl.children;
	const randomIndex = Math.floor(Math.random()* elements.length);
	elements[randomIndex].remove();

	playArea.push(res.card);
	redrawPlayArea();
});

socket.on(EVENTS.HAND_FINISHED, (res) => {
	handOverCooldown = true;
	document.getElementById("points").innerText = String(res[socket.id]);
	playArea = [];
	setTimeout(() => {
		handOverCooldown = false;
		redrawPlayArea();
	}, 3000);
});

socket.on(EVENTS.GAME_OVER, (res) => {
	alert(res);
});

const redrawOpponentHand = () => {
	const elements = opponentCardsEl.children;
	const missingCards = 3 - elements.length;
	for (let i = 0; i < missingCards; i++) {
		$(opponentCardsEl).append('<div class="card"><img src="/images/P0.jpg"></div>');
	}
}

const redrawPlayerHand = () => {
	let playerHandHtml = '';

	for (const card of playerHand) {
		const suitRank = `${card.suit}${card.rank}`;
		playerHandHtml += `<div class="card" suit="${card.suit}" rank="${card.rank}"><img src="/images/${suitRank}.jpg"></div>`
	}

	playerHandEl.innerHTML = playerHandHtml;
	for (const cardDiv of playerHandEl.children) {
		cardDiv.addEventListener('click', function() {
			if (handOverCooldown) {
				return;
			}

			if (!myTurn) {
				alert("Not your turn!");
				return;
			}

			const card = {
				suit: this.getAttribute('suit'),
				rank: this.getAttribute('rank')
			};

			socket.emit(EVENTS.PLAY_CARD, {
				player: socket.id,
				card: card
			});

			playArea.push(card);
			playerHand = [...(playerHand.filter(c => c.rank !== card.rank || c.suit !== card.suit) || [])];
			redrawPlayerHand();
			redrawPlayArea();
			myTurn = false;
		});
	}
}

const redrawPlayArea = () => {
	let playAreaHtml = '';

	for (const card of playArea) {
		const suitRank = `${card.suit}${card.rank}`;
		playAreaHtml += `<div class="card"><img src="/images/${suitRank}.jpg"></div>`
	}

	playAreaEl.innerHTML = playAreaHtml;
}
