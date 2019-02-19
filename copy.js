const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const VersionControl = require('./objects/versioncontrol');
const Validator = require('./objects/validator');
const Serializer = require('./objects/serializer');
const Cleaner = require('./objects/cleaner');
const Creator = require('./objects/creator');
const Logger = require('./objects/logger');
const Translator = require('./objects/translator');
const settings = require('./settings.json');
const client = new Discord.Client();

let isBackup = false;
let isRestore = false;
let backupFile = 'guildData.json';

client.on('ready', async () => {
    await Translator.loadTranslations().catch(langError => {
        console.error(langError);
        return process.exit(1);
    });

    if (!['all', 'error', 'none'].includes(settings.output)) {
        console.error(Translator.disp('errorOutputParameter'));
        return process.exit(1);
    }

    let lang = Translator.getLanguage();
    Logger.logMessage(Translator.disp('messageLanguageAuthor', [lang['language'], lang['author']]));

    if (!client.user.bot) {
        Logger.logError(Translator.disp('errorUserToken'));
        return process.exit(1);
    }
    Logger.logMessage(Translator.disp('messsageLogin', [client.user.tag]));

    let originalGuildId = settings.originalGuildId;
    let newGuildId = settings.newGuildId;
    let newGuildAdminRoleId = settings.newGuildAdminRoleId;
    let guildData = { step: 1 };

    try {
        // npm v5 check (included since node v8)
        if (!fs.existsSync('package-lock.json')) throw new Error(Translator.disp('errorNPM1'));

        // Check discord.js version
        if (settings.djsVersionCheck) {
            let djs = require('./package-lock.json').dependencies['discord.js'].version;
            let localVersion = djs.split('#')[1];
            let latestVersion = await VersionControl.checkLibraryVersion(Translator);
            if (localVersion !== latestVersion.sha) throw new Error(Translator.disp('errorNPM2'));
            Logger.logMessage(Translator.disp('messageDjsVersionCheckSuccess'));
        }

        // Check script version
        let { version } = require('./package.json');
        let result = await VersionControl.checkVersion(Translator).catch(err => {
            return { error: err || new Error(Translator.disp('errorUnspecified')) };
        });
        if (result.error) Logger.logMessage(Translator.disp('errorVersionCheckOther', [result.error]))
        else if (version !== result.version) throw new Error(Translator.disp('errorVersionCheckOutdated', [version, result.version]));
        if (!result.error) Logger.logMessage(Translator.disp('messageScriptVersionCheckSuccess'));

        // Settings Validation only on restore or clone
        let data = { changed: false };
        if (!isBackup) data = Validator.validateSettings(client, originalGuildId, newGuildId, newGuildAdminRoleId, Translator);
        if (data.changed) newGuildAdminRoleId = data.newGuildAdminRoleId;

        // Load/Create serialized guildData
        if (fs.existsSync(backupFile) && isRestore) {
            guildData = require(`./${backupFile}`);
            guildData.step = 1;
            Logger.logMessage(Translator.disp('messageSerialized', [guildData.step++]));
        } else if (isRestore) {
            throw new Error(Translator.disp('errorRestoreNotExistent', [backupFile]));
        } else {
            if (!client.guilds.has(originalGuildId)) {
                throw new Error(Translator.disp('errorSerializationOriginalNotExistent'));
            }
            let banCollection = new Discord.Collection();
            try {
                if (settings.copyBans) banCollection = await client.guilds.get(originalGuildId).fetchBans();
            } catch (banError) {
                throw new Error(Translator.disp('errorSerializationNoBanPermissions'));
            }
            guildData = Serializer.serializeOldGuild(client, originalGuildId, banCollection, guildData, backupFile, Translator);
        }

        // Stop on backup only
        if (isBackup) {
            Logger.logMessage(Translator.disp('messageBackupDone', [guildData.step]));
            await client.destroy();
            return process.exit(0);
        }

        // Cleanup new guild
        guildData = await Cleaner.cleanNewGuild(client, newGuildId, newGuildAdminRoleId, guildData, Translator);

        // Create new guild
        guildData = await Creator.setData(client, guildData, newGuildId, newGuildAdminRoleId, Translator);

        // Finalize
        await Creator.finalize(client, originalGuildId, newGuildId, newGuildAdminRoleId, guildData, Translator);
    } catch (err) {
        Logger.logError(err);
    }

    await client.destroy();
    return process.exit(0);
});

client.on('rateLimit', rateLimitObj => {
    if (settings.debug) {
        Logger.logError(`Rate limit reached! Method: ${rateLimitObj.method}, Path: ${rateLimitObj.path}`);
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
    const args = process.argv.slice(2);
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
    client.login(settings.token);
}

main();
