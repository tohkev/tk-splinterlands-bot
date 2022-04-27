require("dotenv").config();
const { run, setupAccount } = require("./index");
const { sleep } = require("./helper");
const chalk = require("chalk");
const log = require("fancy-log");

const isMultiAccountMode =
	process.env.MULTI_ACCOUNT?.toLowerCase() === "true" ? true : false;

async function startMulti() {
	const sleepingTimeInMinutes = process.env.MINUTES_BATTLES_INTERVAL || 30;
	const sleepingTime = sleepingTimeInMinutes * 60000;
	let missingValue = false;
	let accounts = process.env.ACCOUNT.split(",");
	let passwords = process.env.PASSWORD.split(",");
	let count = 1;

	// trim account and password
	accounts = accounts.map((e) => e.trim());
	passwords = passwords.map((e) => e.trim());
	// split @ to prevent email use
	accounts = accounts.map((e) => e.split("@")[0]);
	// accounts count
	log(
		chalk.bold.redBright(
			`Accounts count: ${accounts.length}, passwords count: ${passwords.length}`
		)
	);
	if (accounts.length !== passwords.length) {
		throw new Error(
			"The number of accounts and passwords do not match. Too many commas?"
		);
	}

	if (accounts.length < 2) {
		throw new Error(
			"MULTI_ACCOUNT set to true, but less than two accounts detected."
		);
	}

	log(chalk.bold.white("List of accounts to run:"));
	for (let i = 0; i < accounts.length; i++) {
		let msg = "This account";
		log(chalk.bold.whiteBright(`${i + 1}. ${accounts[i]}`));

		if (accounts[i].length === 0 && passwords[i].length === 0) {
			missingValue = true;
			msg += " is missing account and password value.";
		} else if (accounts[i].length === 0) {
			missingValue = true;
			msg += " is missing account value.";
		} else if (passwords[i].length === 0) {
			missingValue = true;
			msg += " is missing password value.";
		} else {
			msg += " has all the required values.";
		}
		log(msg);
	}

	if (missingValue)
		throw new Error("Fix your ACCOUNT and/or PASSWORD value in .env file.");

	while (true) {
		log(chalk.bold.whiteBright.bgGreen(`Running bot iter-[${count}]`));
		for (let i = 0; i < accounts.length; i++) {
			setupAccount(accounts[i], passwords[i], isMultiAccountMode);
			try {
				await run();
			} catch (e) {
				log("Error on main:", e);
			}

			log(`Finished running ${accounts[i]} account...\n`);
		}
		log(
			"waiting for the next battle in",
			sleepingTime / 1000 / 60,
			"minutes at",
			new Date(Date.now() + sleepingTime).toLocaleString(),
			"\n"
		);
		await sleep(sleepingTime);
		count++;
	}
}

async function startSingle() {
	let account = process.env.ACCOUNT.split("@")[0]; // split @ to prevent email use
	let password = process.env.PASSWORD;

	if (account.includes(",")) {
		console.error(
			"There is a comma in your account name. Are you trying to run multiple account?"
		);
		console.error(
			"If yes, then you need to set MULTI_ACCOUNT=true in the .env file."
		);
		throw new Error("Invalid account value.");
	}

	setupAccount(account, password, isMultiAccountMode);
	await run();
}

(async () => {
	log(`isMultiAccountMode: ${isMultiAccountMode}`);
	if (isMultiAccountMode) {
		log("Running mode: multi");
		await startMulti();
	} else {
		log("Running mode: single");
		await startSingle();
	}
})();
