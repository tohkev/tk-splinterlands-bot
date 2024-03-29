require("dotenv").config();
const fetch = require("node-fetch");
const log = require("fancy-log");
const isLimitingRule = require("./util/isLimitingRule.js");

const summoners = {
	260: "fire",
	257: "water",
	437: "water",
	// 224: "dragon", drake
	// 189: "earth", wizard of eastwood
	// 145: "death", contessa l'ament
	// 240: "dragon",
	// 167: "fire",  pyre
	438: "death",
	// 156: "life", mother khala
	440: "fire",
	// 114: "dragon",
	441: "life",
	439: "earth",
	// 262: "dragon",
	261: "life",
	// 178: "water",  bortus
	258: "death",
	27: "earth",
	38: "life",
	49: "death",
	5: "fire",
	70: "fire",
	38: "life",
	73: "life",
	259: "earth",
	74: "death",
	72: "earth",
	// 442: "dragon", quix
	71: "water",
	// 88: "dragon",
	// 78: "dragon",
	// 200: "dragon",
	16: "water",
	239: "life",
	254: "water",
	235: "death",
	113: "life",
	109: "death",
	110: "fire",
	// 291: "dragon",
	278: "earth",
	236: "fire",
	// 56: "dragon",
	112: "earth",
	111: "water",
	// 56: "dragon",
	// 205: "dragon",
	// 130: "dragon",
};

const summonerColor = (id) => {
	const summonerDetails = summoners.find((x) => x[id]);
	return summonerDetails ? summonerDetails[id] : "";
};

const getSummonersFromSplinter = (splinterArr) => {
	const res = [];
	Object.keys(summoners).forEach((id) => {
		if (splinterArr.indexOf(summoners[id]) > -1) {
			res.push(id);
		}
	});
	return res;
};

const convertBattlesToArray = (battles) => {
	return battles.map((battle) => {
		return [
			battle.summoner_id ? parseInt(battle.summoner_id) : "",
			battle.monster_1_id ? parseInt(battle.monster_1_id) : "",
			battle.monster_2_id ? parseInt(battle.monster_2_id) : "",
			battle.monster_3_id ? parseInt(battle.monster_3_id) : "",
			battle.monster_4_id ? parseInt(battle.monster_4_id) : "",
			battle.monster_5_id ? parseInt(battle.monster_5_id) : "",
			battle.monster_6_id ? parseInt(battle.monster_6_id) : "",
			battle.splinter,
			battle.winRate ? parseInt(battle.winRate) : "",
			battle.sampleSize ? parseInt(battle.sampleSize) : "",
		];
	});
};

const getBattlesWithRuleset = (ruleset, mana, splinters, player) => {
	try {
		const wild = process.env.FORMAT.toLowerCase() === "wild" ? true : false;
		const rulesetEncoded = encodeURIComponent(ruleset);
		const summoners = getSummonersFromSplinter(splinters);
		const host = process.env.API || "http://localhost:5000/";
		const url = `getteams?ruleset=${rulesetEncoded}&mana=${mana}&player=${player}&summoners=${
			summoners ? JSON.stringify(summoners) : ""
		}&wild=${wild}&gladius=false`;

		log("API call: ", host + url);
		return fetch(host + url, { timeout: 10000 })
			.then((x) => x && x.json())
			.then((data) => {
				return convertBattlesToArray(data.teams);
			})
			.catch((e) => log("fetch ", e));
	} catch (e) {
		log(e);
	}
};

const getBattlesGeneral = (ruleset, mana, splinters, player) => {
	try {
		const wild = process.env.FORMAT.toLowerCase() === "wild" ? true : false;
		const summoners = getSummonersFromSplinter(splinters);
		const host = process.env.API || "http://localhost:5000/";
		let rulesetEncoded = "";

		const rulesSplit = ruleset.split("|");

		for (let i = 0; i < rulesSplit.length; i++){
			if (isLimitingRule.indexOf(rulesSplit[i]) > -1){
				if (rulesetEncoded === ""){
					rulesetEncoded += rulesSplit[i]
				}
				else {
					rulesetEncoded += ("|" + rulesSplit[i])
				}
			}
		}

		rulesetEncoded = encodeURIComponent(rulesetEncoded);
		// if (isLimitingRule.indexOf(rulesSplit[0]) > -1) {
		// 	rulesetEncoded = encodeURIComponent(rulesSplit[0]);
		// } else if (isLimitingRule.indexOf(rulesSplit[1]) > -1) {
		// 	rulesetEncoded = encodeURIComponent(rulesSplit[1]);
		// }

		const url = `getteams?ruleset=${rulesetEncoded}&mana=${mana}&player=${player}&summoners=${
			summoners ? JSON.stringify(summoners) : ""
		}&wild=${wild}&gladius=false`;

		log("API call: ", host + url);
		return fetch(host + url, { timeout: 10000 })
			.then((x) => x && x.json())
			.then((data) => {
				return convertBattlesToArray(data.teams);
			})
			.catch((e) => log("fetch ", e));
	} catch (e) {
		log(e);
	}
};

const teamSelection = async (possibleTeams, matchDetails, quest) => {
	let priorityToTheQuest =
		process.env.QUEST_PRIORITY === "false" ? false : true;
	log("quest custom option set as:", priorityToTheQuest);

	//CHECK FOR QUEST:
	if (priorityToTheQuest && possibleTeams.length > 1 && quest) {
		const questCheck = matchDetails.splinters.includes(quest.splinter);
		const filteredTeamsForQuest = possibleTeams.filter(
			(team) => team[7] === quest.splinter
		);
		log("play for the focus: ", quest.splinter, "? ", questCheck);

		if (
			filteredTeamsForQuest?.length >= 1 &&
			questCheck &&
			filteredTeamsForQuest[0][8]
		) {
			log("Playing for focus..");
			return {
				summoner: filteredTeamsForQuest[0][0],
				cards: filteredTeamsForQuest[0],
			};
		} else {
			log("No viable teams found, not considering focus..");
			return {
				summoner: possibleTeams[0][0],
				cards: possibleTeams[0],
			};
		}
	}

	if (possibleTeams.length > 0) {
		return {
			summoner: possibleTeams[0][0],
			cards: possibleTeams[0],
		};
	}

	log("No available team to be played...");
	return null;
};

module.exports.getBattlesWithRuleset = getBattlesWithRuleset;
module.exports.teamSelection = teamSelection;
module.exports.getSummonersFromSplinter = getSummonersFromSplinter;
module.exports.getBattlesGeneral = getBattlesGeneral;
