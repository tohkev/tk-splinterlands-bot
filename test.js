const Table = require("easy-table");
const findCardById = require("./findCardById");

// async function logGame(mana, teamToPlay, ruleset) {
// 	const gameTable = new Table();

// 	gameTable.cell("Mana", mana);
// 	gameTable.cell("Ruleset", ruleset);
// 	gameTable.cell("Win Rate", teamToPlay.cards[8]);
// 	gameTable.cell("Sample Size", teamToPlay.cards[9]);
// 	gameTable.newRow();

// 	const teamTable = new Table();
// 	let teamData = [];

// 	for (let i = 0; i < 7; i++) {
// 		if (teamToPlay.cards[i]) {
// 			let card = await findCardById(teamToPlay.cards[i]);
// 			teamData.push(card);
// 		} else {
// 			break;
// 		}
// 	}

// 	for (let i = 0; i < teamData.length; i++) {
// 		teamTable.cell("Card", i === 0 ? "Summoner" : `Monster #${i}`);
// 		teamTable.cell("ID", teamData[i].id);
// 		teamTable.cell("Name", teamData[i].name);
// 		teamTable.cell("Splinter", teamData[i].color);
// 		teamTable.newRow();
// 	}

// 	console.log(gameTable.toString());
// 	console.log(teamTable.toString());
// }

// logGame(
// 	14,
// 	{
// 		summoner: 440,
// 		cards: [440, 404, 3, 408, "", "", "", "fire", 100, 1],
// 	},
// 	"ruleset"
// );

// *******************************************************************

const cardDetails = require("./data/cardsDetails.json");

let res = [];
const sample = {
	id: 1,
	name: "Goblin Shaman",
	color: "Red",
	type: "Monster",
	sub_type: null,
	rarity: 1,
	drop_rate: 80,
	stats: {
		mana: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
		attack: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		ranged: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		magic: [0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
		armor: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		health: [4, 4, 3, 4, 3, 3, 3, 4, 5, 6],
		speed: [2, 3, 2, 2, 2, 3, 4, 4, 4, 4],
		abilities: [["Weaken"], [], [], [], ["Slow"], [], [], [], [], []],
	},
	is_starter: false,
	editions: "0,1",
};

cardDetails.forEach((card) => {
	let editions = card.editions.split(",");
	if (editions.indexOf("6") > -1) {
		res.push(card.id);
	}
});

console.log(res);
