import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

const success = (msg: string) => {
	Toastify({
		text: msg,
		duration: 2000,
		gravity: "top",
		position: "right",
		style: {
			background: "linear-gradient(to right, #00b09b, #96c93d)",
		}
	}).showToast();
};

const warning = (msg: string) => {
	Toastify({
		text: msg,
		duration: 2000,
		gravity: "top",
		position: "right",
		style: {
			background: "linear-gradient(to right, #ffea29, #dea412)",
		}
	}).showToast();
};

export {
	success,
	warning
};
