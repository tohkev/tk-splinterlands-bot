require("dotenv").config();
const { run, setupAccount } = require("./index");
const { sleep } = require("./helper");
const chalk = require("chalk");
const log = require("fancy-log");

async function singleBrawl(account, password) {
	setupAccount(account, password, isMultiAccountMode);
	await run();
}

(async () => {
	log(`Brawl mode: ${username}`);
	await singleBrawl();
})();
