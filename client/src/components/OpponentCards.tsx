import { EVENTS, PlayedCard } from '@briskula-online/briskula-shared-entities';
import { socket } from '../socket-instance';
import { useEffect, useState } from 'react';
import { Card } from './Card.tsx';

export function OpponentCards() {
	const [numberOfCards, setNumberOfCards] = useState(0);
	useEffect(() => {
		socket.on(EVENTS.PLAY_CARD, (res: PlayedCard) => {
			if (res.player !== socket.id) {
				setNumberOfCards((prev) => prev--);
			}
		});
	}, []);


	const cards = [];
	for (let i = 0; i < numberOfCards; i++) {
		cards.push(<Card />);
	}

	return (
		<div id="opponent-cards" className="row">
			cards
		</div>
	);
}
