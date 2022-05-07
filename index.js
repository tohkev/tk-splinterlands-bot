//'use strict';
const puppeteer = require("puppeteer");
const Table = require("easy-table");
const log = require("fancy-log");

const splinterlandsPage = require("./splinterlandsPage");
const user = require("./user");
const card = require("./cards");
const {
	clickOnElement,
	getElementText,
	getElementTextByXpath,
	teamActualSplinterToPlay,
	sleep,
	reload,
} = require("./helper");
const quests = require("./quests");
const ask = require("./possibleTeams");
const chalk = require("chalk");
const findCardById = require("./findCardById");
const cardDatabase = require("./data/cardsDetails.json");
const colorMap = require("./util/colorMap");

let isMultiAccountMode = false;
let account = "";
let password = "";
let totalDec = 0;
let winTotal = 0;
let loseTotal = 0;
let undefinedTotal = 0;
const ecrRecoveryRatePerHour = 1.04;

// LOAD MY CARDS
async function getCards() {
	const myCards = await user.getPlayerCards(account);
	return myCards;
}

async function getQuest() {
	return quests
		.getPlayerQuest(account)
		.then((x) => x)
		.catch((e) =>
			log(
				"No quest data, splinterlands API didnt respond, or you are wrongly using the email and password instead of username and posting key"
			)
		);
}

async function closePopups(page) {
	if (await clickOnElement(page, ".close", 4000)) return;
	await clickOnElement(page, ".modal-close-new", 1000, 2000);
	await clickOnElement(page, ".modal-close", 4000, 2000);
}

async function checkEcr(page) {
	try {
		const ecr = await getElementTextByXpath(
			page,
			"//div[@class='dec-options'][1]/div[@class='value'][2]/div",
			100
		);
		if (ecr) {
			log(
				chalk.bold.whiteBright.bgMagenta(
					"Your current Energy Capture Rate is " +
						ecr.split(".")[0] +
						"%"
				)
			);
			return parseFloat(ecr);
		}
	} catch (e) {
		log(chalk.bold.redBright.bgBlack("ECR not defined"));
	}
}

async function findSeekingEnemyModal(page, visibleTimeout = 10000) {
	let findOpponentDialogStatus = 0;
	/*  findOpponentDialogStatus value list
        0: modal #find_opponent_dialog has not appeared
        1: modal #find_opponent_dialog has appeared and not closed
        2: modal #find_opponent_dialog has appeared and closed
    */

	findOpponentDialogStatus = await page
		.waitForSelector("#find_opponent_dialog", {
			timeout: visibleTimeout,
			visible: true,
		})
		.then(() => {
			return 1;
		})
		.catch((e) => {
			log(e.message);
			return 0;
		});

	if (findOpponentDialogStatus === 1) {
		findOpponentDialogStatus = await page
			.waitForSelector("#find_opponent_dialog", {
				timeout: 50000,
				hidden: true,
			})
			.then(() => {
				return 2;
			})
			.catch(async (e) => {
				log(e.message);
				await reload(page); // reload the page, in case the page is not responding
				return 1;
			});
	}

	return findOpponentDialogStatus;
}

async function findCreateTeamButton(
	page,
	findOpponentDialogStatus = 0,
	btnCreateTeamTimeout = 5000
) {
	return await page
		.waitForSelector(".btn--create-team", { timeout: btnCreateTeamTimeout })
		.then(() => {
			log("start the match");
			return true;
		})
		.catch(async () => {
			if (findOpponentDialogStatus === 2)
				console.error("Is this account timed out from battle?");
			console.error("btn--create-team not detected");
			return false;
		});
}

async function launchBattle(page) {
	const maxRetries = 3;
	let retriesNum = 1;
	let btnCreateTeamTimeout = 50000;
	let findOpponentDialogStatus = await findSeekingEnemyModal(page);
	let isStartBattleSuccess = await findCreateTeamButton(
		page,
		findOpponentDialogStatus
	);

	while (!isStartBattleSuccess && retriesNum <= maxRetries) {
		log(`Launch battle iter-[${retriesNum}]`);
		if (findOpponentDialogStatus === 0) {
			isStartBattleSuccess = await page
				.waitForXPath("//button[contains(., 'BATTLE')]", {
					timeout: 20000,
				})
				.then((button) => {
					button.click();
					return true;
				})
				.catch(() => {
					console.error(
						"[ERROR] waiting for Battle button. is Splinterlands in maintenance?"
					);
					return false;
				});
			if (!isStartBattleSuccess) {
				await reload(page);
				await sleep(5000);
				retriesNum++;
				continue;
			}

			findOpponentDialogStatus = await findSeekingEnemyModal(page);
		}

		if (findOpponentDialogStatus === 1 || findOpponentDialogStatus === 2) {
			if (findOpponentDialogStatus === 2) {
				log("opponent found?");
				btnCreateTeamTimeout = 5000;
			}
			isStartBattleSuccess = await findCreateTeamButton(
				page,
				findOpponentDialogStatus,
				btnCreateTeamTimeout
			);
		}

		if (!isStartBattleSuccess) {
			console.error(
				"Refreshing the page and retrying to retrieve a battle"
			);
			await reload(page);
			await sleep(5000);
		}

		retriesNum++;
	}

	return isStartBattleSuccess;
}

async function clickSummonerCard(page, teamToPlay) {
	let clicked = true;
	await sleep(3000);
	await page
		.waitForXPath(`//div[@card_detail_id="${teamToPlay.summoner}"]`, {
			timeout: 10000,
		})
		.then((card) => {
			card.click();
		})
		.catch(() => {
			clicked = false;
			log(chalk.bold.redBright("Summoner not clicked."));
		});

	return clicked;
}

async function clickFilterElement(page, teamToPlay, matchDetails) {
	let clicked = true;
	const playTeamColor =
		teamActualSplinterToPlay(teamToPlay.cards.slice(0, 6)) ||
		matchDetails.splinters[0];
	await sleep(2000);
	log("Dragon play TEAMCOLOR", playTeamColor);
	await page
		.waitForSelector("#splinter_selection_modal", {
			visible: true,
			timeout: 10000,
		})
		// .then(() => console.log("filter element visible"))
		.catch(() => log("filter element not visible"));

	await page
		.waitForXPath(`//div[@data-original-title="${playTeamColor}"]`, {
			timeout: 10000,
		})
		.then((selector) => {
			selector.click();
		})
		.catch(() => {
			log(chalk.bold.redBright("filter element not clicked"));
			clicked = false;
		});
	if (!clicked) return clicked;

	await page
		.waitForSelector("#splinter_selection_modal", {
			hidden: true,
			timeout: 10000,
		})
		.then(() => log("filter element closed"))
		.catch(() => {
			log("filter element not closed");
		});

	return clicked;
}

async function clickMembersCard(page, teamToPlay) {
	let clicked = true;

	for (i = 1; i <= 6; i++) {
		if (teamToPlay.cards[i]) {
			await page
				.waitForXPath(
					`//div[@card_detail_id="${teamToPlay.cards[
						i
					].toString()}"]`,
					{ timeout: 10000 }
				)
				.then((card) => {
					card.click();
				})
				.catch(() => {
					clicked = false;
					log(
						chalk.bold.redBright(teamToPlay.cards[i], "not clicked")
					);
				});
			if (!clicked) break;
		}
		await page.waitForTimeout(1000);
	}

	return clicked;
}

async function clickCreateTeamButton(page) {
	let clicked = true;

	await page
		.waitForSelector(".btn--create-team", { timeout: 10000 })
		.then((e) => {
			e.click();
		})
		.catch(() => {
			clicked = false;
			log("Create team didnt work. Did the opponent surrender?");
		});

	return clicked;
}

async function logGame(teamToPlay, matchDetails) {
	const gameTable = new Table();

	gameTable.cell("Mana", matchDetails.mana);
	gameTable.cell("Ruleset", matchDetails.rules);
	gameTable.cell(
		"Win Rate",
		!teamToPlay.cards[8] ? "0%" : teamToPlay.cards[8] + "%"
	);
	gameTable.cell("Sample Size", teamToPlay.cards[9]);
	gameTable.newRow();

	const teamTable = new Table();
	let teamData = [];

	for (let i = 0; i < 7; i++) {
		if (teamToPlay.cards[i]) {
			//dynamically getting card info from API
			// let card = await findCardById(teamToPlay.cards[i]);
			let card = cardDatabase.find(
				(card) => card.id === teamToPlay.cards[i]
			);
			teamData.push(card);
		} else {
			break;
		}
	}

	for (let i = 0; i < teamData.length; i++) {
		teamTable.cell("Card", i === 0 ? "Summoner" : `Monster #${i}`);
		teamTable.cell("ID", teamData[i].id);
		teamTable.cell("Name", teamData[i].name);
		teamTable.cell("Splinter", colorMap[teamData[i].color]);
		teamTable.newRow();
	}

	console.log("\n", gameTable.toString());
	console.log(teamTable.toString());
}

async function clickCards(page, teamToPlay, matchDetails) {
	const maxRetries = 6;
	let retriesNum = 1;
	let allCardsClicked = false;

	while (!allCardsClicked && retriesNum <= maxRetries) {
		log(`Click cards iter-[${retriesNum}]`);
		if (retriesNum > 1) {
			await reload(page);
			await page.waitForTimeout(5000);
			if (!(await clickCreateTeamButton(page))) {
				retriesNum++;
				continue;
			}
		}

		if (!(await clickSummonerCard(page, teamToPlay))) {
			retriesNum++;
			continue;
		}

		if (
			card.color(teamToPlay.cards[0]) === "Gold" &&
			!(await clickFilterElement(page, teamToPlay, matchDetails))
		) {
			retriesNum++;
			continue;
		}
		await page.waitForTimeout(5000);

		if (!(await clickMembersCard(page, teamToPlay))) {
			retriesNum++;
			continue;
		}
		allCardsClicked = true;
	}

	return allCardsClicked;
}

async function findBattleResultsModal(page) {
	let isBattleResultVisible = false;

	isBattleResultVisible = await page
		.waitForSelector("div.battle-results", { timeout: 5000, visible: true })
		.then(() => {
			return true;
		})
		.catch(() => {
			log("battle results not visible");
			return false;
		});

	if (!isBattleResultVisible) return;

	try {
		const winner = await getElementText(
			page,
			"section.player.winner .bio__name__display",
			15000
		);
		if (winner.trim() == account) {
			const decWon = await getElementText(
				page,
				".player.winner span.dec-reward span",
				1000
			);
			log(chalk.green("You won! Reward: " + decWon + " DEC"));
			totalDec += !isNaN(parseFloat(decWon)) ? parseFloat(decWon) : 0;
			winTotal += 1;
		} else {
			log(chalk.red("You lost"));
			loseTotal += 1;
		}
	} catch {
		log("Could not find winner - draw?");
		undefinedTotal += 1;
	}
	await clickOnElement(page, ".btn--done", 20000, 10000);
	await clickOnElement(page, "#menu_item_battle", 20000, 10000);

	log(
		"Total Battles: " +
			(winTotal + loseTotal + undefinedTotal) +
			chalk.green(" - Win Total: " + winTotal) +
			chalk.yellow(" - Draw? Total: " + undefinedTotal) +
			chalk.red(" - Lost Total: " + loseTotal)
	);
	log(chalk.green("Total Earned: " + totalDec + " DEC"));

	return true;
}

async function commenceBattle(page) {
	let waitForOpponentDialogStatus = 0;
	/*  waitForOpponentDialogStatus value list
        0: modal #wait_for_opponent_dialog has not appeared
        1: modal #wait_for_opponent_dialog has appeared and not closed
    */
	let btnRumbleTimeout = 20000;

	waitForOpponentDialogStatus = await page
		.waitForSelector("#wait_for_opponent_dialog", {
			timeout: 10000,
			visible: true,
		})
		.then(() => {
			return 1;
		})
		.catch(() => {
			log("wait_for_opponent_dialog not visible");
			return 0;
		});

	if (waitForOpponentDialogStatus === 1) {
		await page
			.waitForSelector("#wait_for_opponent_dialog", {
				timeout: 100000,
				hidden: true,
			})
			.then(() => {
				btnRumbleTimeout = 5000;
			})
			.catch((e) => log(e.message));
	}

	await page.waitForTimeout(5000);
	const isBtnRumbleVisible = await page
		.waitForSelector("#btnRumble", { timeout: btnRumbleTimeout })
		.then(() => {
			return true;
		})
		.catch(() => {
			log("btnRumble not visible");
			return false;
		});
	// if btnRumble not visible, check battle results modal in case the opponent surrendered
	if (!isBtnRumbleVisible && (await findBattleResultsModal(page))) return;
	else if (!isBtnRumbleVisible) return;

	await page.waitForTimeout(5000);
	await page
		.$eval("#btnRumble", (elem) => elem.click())
		// .then(() => console.log("btnRumble clicked"))
		.catch(() => log("btnRumble didnt click")); //start rumble
	await page
		.waitForSelector("#btnSkip", { timeout: 10000 })
		// .then(() => console.log("btnSkip visible"))
		.catch(() => log("btnSkip not visible"));
	await page
		.$eval("#btnSkip", (elem) => elem.click())
		// .then(() => console.log("btnSkip clicked"))
		.catch(() => log("btnSkip not visible")); //skip rumble
	await page.waitForTimeout(5000);

	await findBattleResultsModal(page);
}

async function startBotPlayMatch(page, browser) {
	log(new Date().toLocaleString(), "opening browser...");
	try {
		await page.setUserAgent(
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3163.100 Safari/537.36"
		);
		await page.setViewport({
			width: 1800,
			height: 1500,
			deviceScaleFactor: 1,
		});

		await page.goto("https://splinterlands.com/");
		await page.waitForTimeout(8000);

		let item = await page
			.waitForSelector("#log_in_button > button", {
				visible: true,
			})
			.then((res) => res)
			.catch(() => log("Already logged in"));

		if (item != undefined) {
			await splinterlandsPage
				.login(page, account, password)
				.catch((e) => {
					log(e);
					throw new Error("Login Error");
				});
		}

		await page.goto("https://splinterlands.com/?p=battle_history");
		await page.waitForTimeout(8000);
		await closePopups(page);
		await closePopups(page);

		const ecr = await checkEcr(page);
		if (ecr === undefined) throw new Error("Fail to get ECR.");

		if (
			process.env.ECR_STOP_LIMIT &&
			process.env.ECR_RECOVER_TO &&
			ecr < parseFloat(process.env.ECR_STOP_LIMIT)
		) {
			if (ecr < parseFloat(process.env.ECR_STOP_LIMIT)) {
				log(
					chalk.bold.red(
						`ECR lower than limit ${
							process.env.ECR_STOP_LIMIT
						}%. reduce the limit in the env file config or wait until ECR will be at ${
							process.env.ECR_RECOVER_TO || "100"
						}%`
					)
				);
			} else if (ecr < parseFloat(process.env.ECR_RECOVER_TO)) {
				log(
					chalk.bold.red(
						`ECR Not yet Recovered to ${process.env.ECR_RECOVER_TO}`
					)
				);
			}

			// calculating time needed for recovery
			ecrNeededToRecover =
				parseFloat(process.env.ECR_RECOVER_TO) - parseFloat(ecr);
			recoveryTimeInHours = Math.ceil(
				ecrNeededToRecover / ecrRecoveryRatePerHour
			);

			log(
				chalk.bold.white(
					`Time needed to recover ECR, approximately ${
						recoveryTimeInHours * 60
					} minutes.`
				)
			);
			await closeBrowser(browser);
			log(
				chalk.bold.white(
					`Initiating sleep mode. The bot will awaken at ${new Date(
						Date.now() + recoveryTimeInHours * 3600 * 1000
					).toLocaleString()}`
				)
			);
			await sleep(recoveryTimeInHours * 3600 * 1000);

			throw new Error(`Restart needed.`);
		}

		const quest = await getQuest();
		if (!quest) {
			log(
				"Error for quest details. Splinterlands API didnt work or you used incorrect username, remove @ and dont use email"
			);
		}

		if (
			process.env.SKIP_QUEST &&
			quest?.splinter &&
			process.env.SKIP_QUEST.split(",").includes(quest?.splinter) &&
			quest?.total !== quest?.completed
		) {
			try {
				await page
					.click("#quest_new_btn")
					.then(async (a) => {
						await page.reload();
						log("New quest requested");
					})
					.catch((e) => log("Cannot click on new quest"));
			} catch (e) {
				log("Error while skipping new quest");
			}
		}

		const myCards = await getCards()
			.then((x) => {
				return x;
			})
			.catch(() =>
				log(
					"cards collection api didnt respond. Did you use username? avoid email!"
				)
			);

		if (myCards) {
			log(account, " deck size: " + myCards.length);
		} else {
			log(account, " playing only basic cards");
		}

		//check if season reward is available
		if (process.env.CLAIM_SEASON_REWARD === "true") {
			try {
				log("Season reward check: ");
				await page
					.waitForSelector("#claim-btn", {
						visible: true,
						timeout: 3000,
					})
					.then(async (button) => {
						button.click();
						log(
							`claiming the season reward. you can check them here https://peakmonsters.com/@${account}/explorer`
						);
						await page.waitForTimeout(20000);
						await page.reload();
					})
					.catch(() =>
						log(
							`no season reward to be claimed, but you can still check your data here https://peakmonsters.com/@${account}/explorer`
						)
					);
				await page.waitForTimeout(3000);
				await page.reload();
			} catch (e) {
				log.info("no season reward to be claimed");
			}
		}

		//if quest done claim reward. default to true. to deactivate daily quest rewards claim, set CLAIM_DAILY_QUEST_REWARD false in the env file
		log(
			"claim daily quest setting:",
			process.env.CLAIM_DAILY_QUEST_REWARD,
			"Quest details: ",
			quest
		);
		const isClaimDailyQuestMode =
			process.env.CLAIM_DAILY_QUEST_REWARD === "false" ? false : true;
		if (isClaimDailyQuestMode === true) {
			try {
				await page
					.waitForSelector("#quest_claim_btn", { timeout: 5000 })
					.then((button) => button.click())
					.then(async (a) => {
						await page.waitForTimeout(15000);
						await page.reload();
						log("Quest claimed");
					})
					.then(() =>
						page.goto("https://splinterlands.com/?p=battle_history")
					);
			} catch (e) {
				log.info(
					"no quest reward to be claimed waiting for the battle..."
				);
			}
		}
		await page.waitForTimeout(5000);

		// LAUNCH the battle
		if (!(await launchBattle(page)))
			throw new Error("The Battle cannot start");

		// GET MANA, RULES, SPLINTERS, AND POSSIBLE TEAM
		await page.waitForTimeout(10000);
		let [mana, rules, splinters] = await Promise.all([
			splinterlandsPage
				.checkMatchMana(page)
				.then((mana) => mana)
				.catch(() => "no mana"),
			splinterlandsPage
				.checkMatchRules(page)
				.then((rulesArray) => rulesArray)
				.catch(() => "no rules"),
			splinterlandsPage
				.checkMatchActiveSplinters(page)
				.then((splinters) => splinters)
				.catch(() => "no splinters"),
		]);

		const matchDetails = {
			mana: mana,
			rules: rules,
			splinters: splinters,
			myCards: myCards,
		};
		await page.waitForTimeout(2000);
		let possibleTeams = await ask
			.getBattlesWithRuleset(rules, mana, splinters, account)
			.catch((e) => log("Error from possible team API call: ", e));

		if (!possibleTeams || possibleTeams.length === 0) {
			log(
				chalk.bold.redBright(
					"No team found. 2nd attempt to find team.."
				)
			);
			possibleTeams = await ask
				.getBattlesGeneral(rules, mana, splinters, account)
				.catch((e) => log("Error from last resort API call: ", e));
		}

		if (possibleTeams && possibleTeams.length) {
			log("Retrieved " + possibleTeams.length + " teams.");
		} else {
			throw new Error("No teams available to be played");
		}

		//TEAM SELECTION
		const teamToPlay = await ask.teamSelection(
			possibleTeams,
			matchDetails,
			quest
		);

		logGame(teamToPlay, matchDetails);

		let startFight = false;
		if (teamToPlay) {
			startFight = await clickCreateTeamButton(page);
			if (!startFight) {
				// if click create team button fails, check battle results in case the opponent surrendered
				if (await findBattleResultsModal(page)) {
					return;
				} else {
					log("Create team didnt work, waiting 5 sec and retry");
					await page.reload();
					await page.waitForTimeout(5000);
					startFight = await clickCreateTeamButton(page);
				}
			}

			if (!startFight) {
				// if click create team button fails, check battle results in case the opponent surrendered
				await findBattleResultsModal(page);
				return;
			}
		} else {
			log(teamToPlay);
			throw new Error("Team Selection error: no possible team to play");
		}

		await page.waitForTimeout(5000);

		// Click cards based on teamToPlay value.
		startFight = await clickCards(page, teamToPlay, matchDetails);
		if (!startFight) return;

		// start fight
		await page.waitForTimeout(5000);
		await page
			.waitForSelector(".btn-green", { timeout: 1000 })
			// .then(() => console.log("btn-green visible"))
			.catch(() => log("btn-green not visible"));
		await page
			.$eval(".btn-green", (elem) => elem.click())
			// .then(() => console.log("btn-green clicked"))
			.catch(async () => {
				log("Start Fight didnt work, waiting 5 sec and retry");
				await page.waitForTimeout(5000);
				await page
					.$eval(".btn-green", (elem) => elem.click())
					// .then(() => console.log("btn-green clicked"))
					.catch(() => {
						startFight = false;
						log(
							"Start Fight didnt work. Did the opponent surrender?"
						);
					});
			});

		if (startFight) await commenceBattle(page);
		else await findBattleResultsModal(page);
	} catch (e) {
		log(chalk.bold.redBright("No teams found, skipping game.."));
	}
}

// 30 MINUTES INTERVAL BETWEEN EACH MATCH (if not specified in the .env file)
const sleepingTimeInMinutes = process.env.MINUTES_BATTLES_INTERVAL || 30;
const sleepingTime = sleepingTimeInMinutes * 60000;
const isHeadlessMode = process.env.HEADLESS === "false" ? false : true;
const executablePath = process.env.CHROME_EXEC || null;
let puppeteer_options = {
	headless: isHeadlessMode, // default is true
	args: [
		"--no-sandbox",
		"--disable-setuid-sandbox",
		//'--disable-dev-shm-usage',
		//'--disable-accelerated-2d-canvas',
		// '--disable-canvas-aa',
		// '--disable-2d-canvas-clip-aa',
		//'--disable-gl-drawing-for-tests',
		// '--no-first-run',
		// '--no-zygote',
		"--disable-dev-shm-usage",
		// '--use-gl=swiftshader',
		// '--single-process', // <- this one doesn't works in Windows
		// '--disable-gpu',
		// '--enable-webgl',
		// '--hide-scrollbars',
		"--mute-audio",
		// '--disable-infobars',
		// '--disable-breakpad',
		"--disable-web-security",
	],
};
if (executablePath) {
	puppeteer_options["executablePath"] = executablePath;
}

async function run() {
	let start = true;

	log("START ", account, new Date().toLocaleString());
	const browser = await puppeteer.launch(puppeteer_options);

	//const page = await browser.newPage();
	let [page] = await browser.pages();

	await page.setDefaultNavigationTimeout(500000);
	await page.on("dialog", async (dialog) => {
		await dialog.accept();
	});
	await page.on("error", function (err) {
		const errorMessage = err.toString();
		log("browser error: ", errorMessage);
	});
	await page.on("pageerror", function (err) {
		const errorMessage = err.toString();
		log("browser page error: ", errorMessage);
	});
	page.goto("https://splinterlands.com/");
	page.recoverStatus = 0;
	page.favouriteDeck = process.env.FAVOURITE_DECK || "";
	while (start) {
		log("Recover Status: ", page.recoverStatus);
		await startBotPlayMatch(page, browser)
			.then(async () => {
				log("Closing battle", new Date().toLocaleString());

				if (isMultiAccountMode) {
					start = false;
					await closeBrowser(browser);
				} else {
					await page.waitForTimeout(5000);
					log(
						account,
						"waiting for the next battle in",
						sleepingTime / 1000 / 60,
						"minutes at",
						new Date(Date.now() + sleepingTime).toLocaleString()
					);
					await sleep(sleepingTime);
				}
			})
			.catch((e) => {
				log(e);
				start = false;
			});
	}
	if (!isMultiAccountMode) {
		await restart(browser);
	}
}

async function closeBrowser(browser) {
	log("Closing browser...");
	await browser
		.close()
		.then(() => {
			log("Browser closed.");
		})
		.catch((e) => {
			log(
				chalk.bold.redBright.bgBlack("Fail to close browser. Reason:"),
				chalk.bold.whiteBright.bgBlack(e.message)
			);
		});
}

async function restart(browser) {
	log(chalk.bold.redBright.bgBlack("Restarting bot..."));
	await closeBrowser(browser);
	await run();
}

function setupAccount(uname, pword, multiAcc) {
	account = uname;
	password = pword;
	isMultiAccountMode = multiAcc;
}

exports.run = run;
exports.setupAccount = setupAccount;
