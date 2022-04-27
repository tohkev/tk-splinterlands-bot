# Splinterlands Bot by tohkev

This is my iteration of a [Splinterlands](https://www.splinterlands.com) bot based on [alfficcadenti](https://github.com/alfficcadenti/splinterlands-bot)'s bot v1.12.0. This bot also requires [NodeJs](https://nodejs.org/it/download/) installed to run.

Unlike the original, this bot was created to run games based on my private API which has data collected from countless games specifically gears towards cards I have. As such, this bot is currently getting a 75% win rate at the silver and lower gold ranks. There is no local history that the bot will work off currently.

## Getting Started:

You **need** to install NodeJS from https://nodejs.org/en/download/ (at least the last stable version 14.18.0)

Once NodeJS is installed and you downloaded the bot in a specific folder, you need to set your configuration in the .env file:

This bot requires you to input your login information (usename & posting key) in the environmental variables. There is a file named `.env-example` that can be used as a template, you will just need to remove `-example` from the filename and add your username/posting key.

Example:

-   `ACCOUNT=youraccountname`
-   `PASSWORD=yourpostingkey`

**DISCLAIMER:** the bot needs the **username and posting key** in order to login. **Don't use the email and password**. If you don't have the posting key, you need to _'Request Keys'_ from the top right menu in Splinterlands. You will receive a link to follow where you will get your Hive private keys. **Store them safely and don't share them with anyone!**

Once you have installed NodeJS and prepared the .env file, open the command line/terminal on this folder and run:

`npm install` and then `npm start` to initiate the installation of dependencies.

### Configuration:

`MINUTES_BATTLES_INTERVAL` - This controls the interval between games (in minutes) the bot will play games.

`QUEST_PRIORITY` - If 'true', the bot will prioritize teams adhering to the quest (currently on working on splinter quests).

`CLAIM_SEASON_REWARD` - If 'true', the bot will automatically collect your season rewards if available.

`CLAIM_DAILY_QUEST_REWARD` - If 'true', the bot will automatically collect your completed quest rewards if available.

`HEADLESS` - If 'true', the bot will run in the background (no GUI).

`ECR_STOP_LIMIT` - This tells the bot not to play a game when ECR is above a specified limit (in percentage).

`ECR_RECOVER_TO` - This tells the bot when to continue playing when ECR has reached a specified amount (in percentage).

`SKIP_QUEST` - This allows the bot to re-roll your current quest if you have a specified quest (life, snipe, etc).

Example:

-   `QUEST_PRIORITY=false`

-   `MINUTES_BATTLES_INTERVAL=30`

-   `CLAIM_SEASON_REWARD=true`

-   `CLAIM_DAILY_QUEST_REWARD=false`

-   `HEADLESS=false`

-   `ECR_STOP_LIMIT=50`

-   `ECR_RECOVER_TO=99`

-   `SKIP_QUEST=life,snipe,neutral`

### Running bot with multiaccount setting

in order to run multple accounts launching the script only once, you can simply add the list of usernames and posting keys in the .env file and set the variable `MULTI_ACCOUNT` as true:

-   `MULTI_ACCOUNT=true`
-   `ACCOUNT=user1,user2,user,...`
-   `PASSWORD=postingkey1,postingkey2,postingkey3,...`
