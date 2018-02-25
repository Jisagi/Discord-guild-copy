const fs = require('fs');
const Discord = require('discord.js');
const Validator = require('./objects/validator');
const Serializer = require('./objects/serializer');
const Cleaner = require('./objects/cleaner');
const Creator = require('./objects/creator');
const Logger = require('./objects/logger');
const settings = require('./settings.json');
const client = new Discord.Client();

client.on('ready', async () => {
    Logger.logMessage(`Successfully logged in as ${client.user.tag}. Starting script.`);

    let originalGuildId = settings.originalGuildId;
    let newGuildId = settings.newGuildId;
    let newGuildAdminRoleId = settings.newGuildAdminRoleId;
    let guildData = {
        step: 1,
    };

    try {
        // Settings Validation
        let data = { changed: false };
        if (client.user.bot) data = Validator.validateSettings(client, originalGuildId, newGuildId, newGuildAdminRoleId);
        if (data.changed) newGuildAdminRoleId = data.newGuildAdminRoleId;

        // Load/Create serialized guildData
        if (fs.existsSync('guildData.json')) {
            guildData = require('./guildData.json');
            guildData.step = 1;
            Logger.logMessage(`${guildData.step++}. Serialized data was found and will be used.`);
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
            guildData = Serializer.serializeOldGuild(client, originalGuildId, banCollection, guildData);
        }

        // Stop on user account
        if (!client.user.bot) {
            Logger.logMessage(`${guildData.step}. Program execution stopped because the provided token ` +
                `is a user account. Please use a bot account with the serialized data.`);
            return process.exit();
        }

        // Cleanup new guild
        guildData = await Cleaner.cleanNewGuild(client, newGuildId, newGuildAdminRoleId, guildData);

        // Create new guild
        await Creator.setData(client, guildData, newGuildId, newGuildAdminRoleId);
    } catch (err) {
        Logger.logError(err);
    }

    if (client.user.bot) await client.destroy();
    return process.exit();
});

client.on('rateLimit', rateLimitObj => {
    if (settings.debug) {
        Logger.logMessage(`Rate limit reached!\nTimeout: ${rateLimitObj.timeout}\nLimit: ${rateLimitObj.limit}\n` +
            `TimeDiff: ${rateLimitObj.timeDifference}\nMethod: ${rateLimitObj.method}\nPath: ${rateLimitObj.path}\n` +
            `Route: ${rateLimitObj.route}`);
    }
});

client.login(settings.token);
