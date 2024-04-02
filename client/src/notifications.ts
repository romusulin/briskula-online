import Awn from 'awesome-notifications';
const notifier = new Awn();

const success = (msg: string) => {
	notifier.succes(msg, {
		durations:{
			success: 2000
		},
		labels: {
			success: ''
		}
	});
};

const warning = (msg: string) => {
	notifier.warning(msg, {
		durations:{
			warning: 2000
		},
		labels: {
			warning: ''
		}
	});
};

export {
	success,
	warning
};
