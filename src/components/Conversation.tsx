import {
	ActionIcon,
	Button,
	Grid,
	Group,
	NumberInput,
	SegmentedControl,
	Select,
	Stack,
	TextInput,
	Title,
} from '@mantine/core';
import { useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { Door, getDoorLabel } from '../types/door';
import { Message, MessageText } from '../types/message';
import { getObjectTypeLabel, ObjectType } from '../types/object';
import {
	ConversationType,
	getConversationTypeLabel,
} from '../types/conversation';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
	conversationState,
	doorState,
	eventState,
	heightState,
	langState,
	nameState,
	objectState,
} from '../store/atoms';
import { messagesState } from '../store/selectors';
import { ArrowClockwise } from 'phosphor-react';
import { EventType, getEventTypeLabel } from '../types/event';
import { speak, speakMessageText } from '../util/speech';

function Conversation() {
	const [selectedMessage, setSelectedMessage] = useState(0);

	const [conv, setConv] = useRecoilState(conversationState);
	const [name, setName] = useRecoilState(nameState);
	const [lang, setLang] = useRecoilState(langState);
	const [door, setDoor] = useRecoilState(doorState);
	const [height, setHeight] = useRecoilState(heightState);
	const [object, setObject] = useRecoilState(objectState);
	const [event, setEvent] = useRecoilState(eventState);

	const messages = useRecoilValue(messagesState) ?? [];

	const {
		openDoor,
		closeDoor,
		sendWelcome,
		sendLoading,
		sendConfirmation,
		startPairing,
		stopPairing,
	} = useSocket();

	const getMessageLabel = (text: MessageText[]) => {
		const cutoff = 7;
		const label = text
			.map((t) => {
				if (typeof t === 'string') {
					return t;
				} else return t.text;
			})
			.join(' ')
			.split(' ');

		return `${label.slice(0, cutoff).join(' ')} ${
			label.length > cutoff ? '...' : ''
		}`;
	};

	const clickMessage = (message: Message) => {
		setSelectedMessage(message.id);
		if (!message.preventSpeak) speakMessageText(message.text);

		if (!!message.callback) {
			switch (message.callback.functionName) {
				case 'sendWelcome':
					sendWelcome();
					break;
				case 'openDoor':
					openDoor(
						message.callback.args
							? (message.callback.args[0] as Door)
							: door
					);
					break;
				case 'changeDoor':
					if (message.callback.args) {
						const newDoor = message.callback.args[0] as Door;
						setDoor(newDoor);

						if (newDoor !== door) {
							closeDoor(door);
							speak(
								`Oh, I am sorry. I will open the ${getDoorLabel(
									newDoor
								)} for you now.`
							);
							openDoor(newDoor);
						}
					}
					break;
				case 'closeDoor':
					closeDoor(
						message.callback.args
							? (message.callback.args[0] as Door)
							: door
					);
					break;
				case 'sendLoading':
					sendLoading();
					break;
				case 'sendConfirmation':
					sendConfirmation();
					break;
				case 'startPairing':
					startPairing();
					break;
				case 'stopPairing':
					stopPairing();
					break;
				default:
					console.warn('Unsupported callback function');
					break;
			}
		}
	};

	const resetMessages = () => {
		setSelectedMessage(0);
	};

	return (
		<Stack>
			<Title order={2}>Conversation controls</Title>

			<Grid grow justify="center">
				<Grid.Col span={12}>
					<SegmentedControl
						value={conv}
						onChange={(value) => {
							setConv(value as ConversationType);
							resetMessages();
						}}
						data={Object.values(ConversationType).map((c) => ({
							value: c,
							label: getConversationTypeLabel(c),
						}))}
					/>
				</Grid.Col>

				<Grid.Col span={6}>
					<TextInput
						placeholder="Name"
						label="Name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
				</Grid.Col>

				<Grid.Col span={6}>
					<NumberInput
						placeholder="Height"
						label="Height"
						value={height}
						onChange={(e) => setHeight(e!)}
						min={150}
						max={220}
						required
					/>
				</Grid.Col>

				<Grid.Col span={6}>
					<Select
						label="Object detected"
						value={object}
						onChange={(e) => setObject(e as ObjectType)}
						data={Object.values(ObjectType).map((o) => ({
							value: o,
							label: getObjectTypeLabel(o),
						}))}
					/>
				</Grid.Col>

				<Grid.Col span={6}>
					<Select
						label="Door"
						value={door}
						onChange={(e) => setDoor(e as Door)}
						data={Object.values(Door).map((d) => ({
							value: d,
							label: getDoorLabel(d),
						}))}
					/>
				</Grid.Col>

				<Grid.Col span={6}>
					<Select
						label="Event"
						value={event}
						onChange={(e) => setEvent(e as EventType)}
						data={Object.values(EventType).map((e) => ({
							value: e,
							label: getEventTypeLabel(e),
						}))}
					/>
				</Grid.Col>

				<Stack
					styles={(theme) => ({
						root: {
							marginTop: theme.spacing.xl,
							padding: theme.spacing.xs,
							width: '100%',
						},
					})}
				>
					<Group position="apart">
						<Title order={4}>Conversation</Title>

						{selectedMessage !== 0 && (
							<ActionIcon
								title="Repeat previous message"
								color="gray"
								onClick={() => {
									const msg = messages[selectedMessage];
									if (!msg.preventSpeak)
										speakMessageText(msg.text);
								}}
							>
								<ArrowClockwise size={20} weight="bold" />
							</ActionIcon>
						)}
					</Group>

					{messages[selectedMessage].children?.map((child, index) => (
						<Button
							color={
								messages[child].preventSpeak
									? 'pink'
									: 'primary'
							}
							styles={(theme) => ({
								root: {
									width: '100%',
									height: 'auto',
									paddingBlock: theme.spacing.xs,
									lineHeight: 1.3,
								},
								label: { whiteSpace: 'normal' },
							})}
							onClick={() => clickMessage(messages[child])}
							key={messages[child].id}
						>
							{getMessageLabel(messages[child].text)}
						</Button>
					))}

					{!messages[selectedMessage].children && (
						<Button
							color="gray"
							type="reset"
							onClick={() => resetMessages()}
							leftIcon={
								<ArrowClockwise size={20} weight="bold" />
							}
						>
							Reset conversation
						</Button>
					)}
				</Stack>
			</Grid>
		</Stack>
	);
}

export default Conversation;
