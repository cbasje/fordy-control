import { Door } from '../../types/door';
import { Message } from '../../types/message';
import { EventType, getEventTypeLabel } from '../../types/event';

export const finalConversation = (
	name: string,
	lang: string,
	event: EventType
): { [id: number]: Message } => ({
	0: {
		id: 0,
		text: [''],
		children: [1],
	},
	1: {
		id: 1,
		text: ['Hey,', { text: name, lang }],
		children: [2],
		callback: {
			functionName: 'sendWelcome',
		},
	},
	2: {
		id: 2,
		text: [
			`I see that you are in a hurry to get to your ${getEventTypeLabel(
				event
			)} in ${Math.round(Math.random() * 60)} minutes.`,
			'I loaded the address from your calendar into the navigation system.',
		],
		callback: {
			functionName: 'openDoor',
			args: [Door.Front],
		},
	},
});
