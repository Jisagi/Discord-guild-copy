const discord = require('discord.js');
const validator = require('./objects/validator.js');
const cleaner = require('./objects/cleaner.js');
const fileHandler = require('./objects/fileHandler.js');
const creator = require('./objects/creator.js');
const settings = require('./settings.json');

const debug = settings.debug;
const client = new discord.Client();
client.objects = {};
client.objects.discord = discord;

/**
 * @param  {Event} 'ready'
 * @param  {callback} async(
 */
client.on('ready', async () => {
    console.log(`Successfully logged in as ${client.user.tag}. Starting script.`);

    let originalGuildId = settings.originalGuildId;
    let newGuildId = settings.newGuildId;
    let newGuildAdminRoleId = settings.newGuildAdminRoleId;
    let guildData = {
        step: 1
    };

    try {
        let data = await validator.validateSettings(client, originalGuildId, newGuildId, newGuildAdminRoleId);
        if (data.changed) newGuildAdminRoleId = data.newGuildAdminRoleId;

        guildData = await fileHandler.checkIfDataExists(client, originalGuildId, newGuildId, newGuildAdminRoleId, guildData);
        if (!client.user.bot) {
            console.log(`${guildData.step}. Program execution stopped because the provided token is a user account. Please use a bot account with the serialized data.`);
            await client.destroy();
            return process.exit();
        }

        guildData = await cleaner.cleanNewGuild(client, newGuildId, newGuildAdminRoleId, guildData);
        guildData = await creator.setData(client, guildData, newGuildId);
        guildData = await cleaner.finalize(client, newGuildId, newGuildAdminRoleId, guildData);
        console.log(`${guildData.step++}. Done!`);
    } catch (ex) {
        console.error(debug ? `Error: ${ex.stack}` : `Error: ${ex.message}`);
    }

    await client.destroy();
    return process.exit();
});

/**
 * @param  {Event} 'rateLimit'
 * @param  {callback} (rateLimitObj
 */
client.on('rateLimit', (rateLimitObj) => {
    if (debug) console.log(`Rate limit reached!\nTimeout: ${rateLimitObj.timeout}\nLimit: ${rateLimitObj.limit}\nTimeDiff: ${rateLimitObj.timeDifference}\nMethod: ${rateLimitObj.method}\nPath: ${rateLimitObj.path}\nRoute: ${rateLimitObj.route}`);
});

client.login(settings.token);
