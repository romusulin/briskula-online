import { Card } from './card';
import { ranks, suits } from './card';

export class Deck {
	cards: Card[];

	constructor() {
		this.cards = [];

		for (const suit of suits) {
			for (const rank of ranks) {
				this.cards.push(new Card(suit, rank));
			}
		}
	}

	shuffle() {
		for (let i = this.cards.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
		}
	}

	draw(numberOfCards: number = 1): Card[] {
		const drawnCards: Card[] = [];
		for (let i = 0; i < numberOfCards; i++) {
			const card = this.cards.pop();
			if (!card) {
				throw new Error('No cards left in deck');
			}

			drawnCards.push(card);
		}


		return drawnCards;
	}

	length(): number {
		return this.cards.length;
	}
}
