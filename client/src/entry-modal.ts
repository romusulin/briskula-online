import Swal from 'sweetalert2';
import { socket} from './socket-instance';
import { EVENTS} from '@briskula-online/briskula-shared-entities';

window['playerName'] = '';

const htmlModal = (roomIds: string[]) => `
	<h2>Rooms:</h2>
    <div id="lobbiesContainer">
        ${(roomIds || []).map(id => generateLobbiesHtml(id)).join('\n')}
    </div>
`;

const generateLobbiesHtml = (roomId: string) => {
	return `
	<div
		class="lobby hover-effect"
		onclick="var lobbies=document.querySelectorAll('.lobby');lobbies.forEach(function(el){el.classList.remove('selected')});this.classList.add('selected');window['selectedRoom']='${roomId}'"
	>
		${roomId}
	</div>
	`
}

let intervalTimerId;

export const showEntryModal = () => {
	Swal.fire({
		title: '<strong>What is your name?</strong>',
		icon: 'info',
		input: 'text',
		inputLabel: 'Your name',
		inputValidator: (val) => {
			if (!val) {
				return 'You need to type your name';
			}

			if (val?.length > 12) {
				return 'Name too long';
			}
		},
		showCloseButton: false,
		showCancelButton: false,
		showDenyButton: true,
		denyButtonText: 'Join',
		confirmButtonText: 'Create a room',
		html: htmlModal([]),
		returnInputValueOnDeny: true,
		didOpen: () => {
			intervalTimerId = setInterval(async () => {
				const data = await fetch('/rooms', { method: 'GET'});
				const jsonData = await data.json();
				Swal.getHtmlContainer().innerHTML = htmlModal(jsonData);
			}, 2500);
		},
		allowOutsideClick: false
	}).then((res) => {
		clearInterval(intervalTimerId);
		const playerName = res.value;
		if (res.isConfirmed) {
			Swal.fire({
				title: 'Waiting for players...',
				showCancelButton: true,
				didOpen: async () => {
					socket.once(EVENTS.SET_BRISCOLA, () => {
						Swal.close();
					});
					socket.emit(EVENTS.JOIN_LOBBY, {
						name: playerName,
						lobbyId: playerName
					});
					Swal.showLoading();
				}
			}).then((res) => {
				if (res.isDismissed) {
					socket.emit(EVENTS.LEAVE_LOBBY);
					showEntryModal();
				}
			});
		}

		if (res.isDenied) {
			Swal.fire({
				title: 'Joining...',
				didOpen: async () => {
					Swal.showLoading();
					socket.once(EVENTS.SET_BRISCOLA, () => {
						Swal.close();
					});
					socket.emit(EVENTS.JOIN_LOBBY,  {
						name: playerName,
						lobbyId: window['selectedRoom']
					});
				}
			})
		}
	});
};



