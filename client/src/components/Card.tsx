const images = require.context('../assets', true);
export function Card({suit, rank}: {suit?: string; rank?: string;}) {
	let fileSrc;
	if (!suit && !rank) {
		fileSrc = images('P0.jpg');
	} else {
		fileSrc = images(`${suit}${rank}.jpg`);
	}

	return <img alt={`${suit}${rank}`} src={fileSrc}/>
}
