import { EVENTS } from '@briskula-online/briskula-shared-entities';
import $ from 'jquery';
import * as Notifications from './notifications';
import { showEntryModal } from './entry-modal';
import { socket } from './socket-instance';

const briscolaEl = document.getElementById('briscola');
const playerHandEl = document.getElementById('player-cards');
const deckEl = document.getElementById('deck');
const playAreaEl = document.getElementById('play-area');
const opponentCardsEl = document.getElementById('opponent-cards');

let playerHand = [];
let playArea = [];
let myTurn = false;
let handOverCooldown = false;

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
	myTurn = res.playerOnTurn === socket.id;
	if (myTurn) {
		Notifications.success('It is your turn.');
	}
});


socket.on(EVENTS.PLAY_CARD, (res) => {
	const elements = opponentCardsEl.children;
	if (res.player === socket.id || !elements.length) {
		return;
	}

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
	setTimeout(() => {
		Notifications.success(`'Game over. You've won ${res[socket.id]} points in total.`);
	}, 2500);
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
				Notifications.warning("Not your turn!");
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
		const randomRotation = Math.floor(Math.random() * 40) - 20;
		playAreaHtml += `<div class="card" style="transform: rotate(${randomRotation}deg)"><img src="/images/${suitRank}.jpg"></div>`
	}

	playAreaEl.innerHTML = playAreaHtml;
}

window.onload = () => {
	showEntryModal();
};
