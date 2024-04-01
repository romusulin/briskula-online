
export const suits = ['K', 'B', 'S', 'D'];
export type ISuit = typeof suits[number];
export const ranks = ['1', '3', 'R', 'C', 'F', '7', '6', '5', '4', '2'] as const;
export type IRank = typeof ranks[number];

export const pointsByRank = {
	'1': 11,
	'3':10,
	'R': 4,
	'C': 3,
	'F': 2,
	'7': 0,
	'6': 0,
	'5': 0,
	'4': 0,
	'2': 0
};

export interface ICard {
	suit: ISuit;
	rank: IRank;
}

export class Card implements ICard {
	suit: ISuit;
	rank: IRank;

	constructor(suit: ISuit, rank: IRank) {
		this.suit = suit;
		this.rank = rank;
	}
}
