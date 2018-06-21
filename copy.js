const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const VersionControl = require('./objects/versioncontrol');
const Validator = require('./objects/validator');
const Serializer = require('./objects/serializer');
const Cleaner = require('./objects/cleaner');
const Creator = require('./objects/creator');
const Logger = require('./objects/logger');
const settings = require('./settings.json');
const client = new Discord.Client();

let isBackup = false;
let isRestore = false;
let isClone = false;
let backupFile = 'guildData.json';

client.on('ready', async () => {
    if (!client.user.bot) {
        Logger.logError('Specified user token is not a bot user token.');
        return process.exit(1);
    }
    Logger.logMessage(`Successfully logged in as ${client.user.tag}. Starting script.`);

    let originalGuildId = settings.originalGuildId;
    let newGuildId = settings.newGuildId;
    let newGuildAdminRoleId = settings.newGuildAdminRoleId;
    let guildData = { step: 1 };

    try {
        // Check discord.js version
        let djsVersion = require('./node_modules/discord.js/package.json').version;
        if (djsVersion !== '12.0.0-dev') throw new Error('Please don\'t install discord.js with \'npm install discord.js\'! Installation instructions are in the README.');

        // Check script version
        let { version } = require('./package.json');
        let result = await VersionControl.checkVersion(version).catch(err => {
            return { error: err || new Error('failed') };
        });
        if (result.error) console.log(`${result.error}\nScript execution will resume.`)
        else if (version !== result.version) throw new Error(`You are not using the latest script version. Please redownload the repository.`
            + `\nYour version: ${version}\nLatest version: ${result.version}`);
        if (!result.error) console.log('Latest script version installed');

        // Settings Validation only on restore or clone
        let data = { changed: false };
        if (!isBackup) data = Validator.validateSettings(client, originalGuildId, newGuildId, newGuildAdminRoleId);
        if (data.changed) newGuildAdminRoleId = data.newGuildAdminRoleId;

        // Load/Create serialized guildData
        if (fs.existsSync(backupFile) && isRestore) {
            guildData = require(`./${backupFile}`);
            guildData.step = 1;
            Logger.logMessage(`${guildData.step++}. Serialized data was found and will be used.`);
        } else if (isRestore) {
            throw new Error(`Specified restore but guild backup '${backupFile}' doesn't exist.`);
        } else {
            if (!client.guilds.has(originalGuildId)) {
                throw new Error('Original guild to copy does not exist. Please check if the id in the ' +
                    'settings is correct and if the bot is also member of this guild.');
            }
            let banCollection = new Discord.Collection();
            try {
                if (settings.copyBans) banCollection = await client.guilds.get(originalGuildId).fetchBans();
            } catch (banError) {
                throw new Error('You tried to copy bans without giving the bot the BAN_MEMBERS permissions on the original guild.');
            }
            guildData = Serializer.serializeOldGuild(client, originalGuildId, banCollection, guildData, backupFile);
        }

        // Stop on backup only
        if (isBackup) {
            Logger.logMessage(`${guildData.step}. Program execution finished because backup was specified.`);
            await client.destroy();
            return process.exit();
        }

        // Cleanup new guild
        guildData = await Cleaner.cleanNewGuild(client, newGuildId, newGuildAdminRoleId, guildData);

        // Create new guild
        await Creator.setData(client, guildData, newGuildId, newGuildAdminRoleId);
    } catch (err) {
        Logger.logError(err);
    }

    await client.destroy();
    return process.exit();
});

client.on('rateLimit', rateLimitObj => {
    if (settings.debug) {
        Logger.logMessage(`Rate limit reached!\nTimeout: ${rateLimitObj.timeout}\nLimit: ${rateLimitObj.limit}\n` +
            `TimeDiff: ${rateLimitObj.timeDifference}\nMethod: ${rateLimitObj.method}\nPath: ${rateLimitObj.path}\n` +
            `Route: ${rateLimitObj.route}`);
    }
});

function printUsage() {
    console.log(
        `Usage:
  * Backup guild to file: node copy.js backup <backupFile (optional)>
  * Restore guild from file: node copy.js restore <backupFile (optional)>
  * Clone guild to guild: node copy.js clone`
    );
    process.exit(1);
}

function main() {
    const args = process.argv.slice(2)
    if (args.length < 1 || !['backup', 'restore', 'clone'].includes(args[0])) {
        printUsage();
    } else if (args.length >= 2 && ['backup', 'restore'].includes(args[0])) {
        if (path.extname(args[1]) === '.json') {
            backupFile = args[1];
        } else {
            backupFile = args[1] + '.json';
        }
    }
    isBackup = args[0] === 'backup';
    isRestore = args[0] === 'restore';
    isClone = args[0] === 'clone';
    client.login(settings.token);
}

main();
