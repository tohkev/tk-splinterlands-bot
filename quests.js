const fetch = require("node-fetch");
const log = require("fancy-log");

const quests = [
	{ name: "defend", element: "life" },
	{ name: "pirate", element: "water" },
	{ name: "lyanna", element: "earth" },
	{ name: "stir", element: "fire" },
	{ name: "rising", element: "death" },
	{ name: "gloridax", element: "dragon" },
];

const getQuestSplinter = (questName) => {
	const playerQuest = quests.find((quest) => quest.name === questName);
	return playerQuest.element;
};

const getPlayerQuest = (username) =>
	fetch(
		`https://api2.splinterlands.com/players/quests?username=${username}`,
		{
			credentials: "omit",
			headers: {
				accept: "application/json, text/javascript, */*; q=0.01",
			},
			referrer: `https://splinterlands.com/?p=collection&a=${username}`,
			referrerPolicy: "no-referrer-when-downgrade",
			body: null,
			method: "GET",
			mode: "cors",
		}
	)
		.then((x) => x && x.json())
		.then((x) => {
			if (x[0]) {
				const questDetails = {
					name: x[0].name,
					splinter: getQuestSplinter(x[0].name),
					created_date: x[0].created_date,
				};
				return questDetails;
			}
		})
		.catch(() => {
			log(
				"Error: game-api.splinterlands did not respond trying api.splinterlands... "
			);
			fetch(
				`https://api.splinterlands.io/players/quests?username=${username}`,
				{
					credentials: "omit",
					headers: {
						accept: "application/json, text/javascript, */*; q=0.01",
					},
					referrer: `https://splinterlands.com/?p=collection&a=${username}`,
					referrerPolicy: "no-referrer-when-downgrade",
					body: null,
					method: "GET",
					mode: "cors",
				}
			)
				.then((x) => x && x.json())
				.then((x) => {
					if (x[0]) {
						const questDetails = {
							name: x[0].name,
							splinter: getQuestSplinter(x[0].name),
						};
						return questDetails;
					}
				})
				.catch((e) =>
					log(
						"[ERROR QUEST] Check if Splinterlands is down. Are you using username or email? please use username"
					)
				);
		});

module.exports.getPlayerQuest = getPlayerQuest;
