const copyEmojis = require('../settings.json');

class Cleaner {
    /**
     * Cleaning new guild.
     * Channels: All text/voice channels and categories
     * Roles: All roles except the 'guildcopy' role
     * Emojis: All emojis (only if activated in the settings)
     * 
     * @param  {Client} client Discord Client
     * @param  {string} newGuildId New guild id
     * @param  {string} newGuildAdminRoleId New guild Administrator role id
     * @param  {Object} guildData Serialized guild data
     */
    static cleanNewGuild(client, newGuildId, newGuildAdminRoleId, guildData) {
        return new Promise(async (resolve, reject) => {
            try {
                let newGuild = client.guilds.get(newGuildId);

                // del channel
                console.log(`${guildData.step++}. Deleting channels`);
                await Promise.all(newGuild.channels.deleteAll());

                // del roles
                let col = newGuild.roles.filter(role => (role.id !== newGuildAdminRoleId && role.id !== newGuild.defaultRole.id));
                console.log(`${guildData.step++}. Deleting roles`);
                await Promise.all(col.deleteAll());

                // del emojis
                if (copyEmojis) {
                    console.log(`${guildData.step++}. Deleting emojis`);
                    await Promise.all(newGuild.emojis.deleteAll());
                }

                console.log(`${guildData.step++}. New guild cleanup finished`);
                return resolve(guildData);
            } catch (ex) {
                return reject(ex);
            }
        });
    }
    /**
     * Final message when done.
     * If at least one text channel exists, the message will be posted in the first one,
     * otherwise in the console.
     * 
     * @param  {Client} client Discord Client
     * @param  {string} newGuildId New guild id
     * @param  {string} newGuildAdminRoleId New guild Administrator role id
     * @param  {Object} guildData Serialized guild data
     */
    static finalize(client, newGuildId, newGuildAdminRoleId, guildData) {
        return new Promise(async (resolve, reject) => {
            try {
                let newGuild = client.guilds.get(newGuildId);
                let deleteableAdminRole = newGuild.roles.get(newGuildAdminRoleId);
                let textChs = newGuild.channels.filter(c => c.type === 'text');

                let outText = `Guild copy finished! The last thing to do is to delete the role \`${deleteableAdminRole.name}\`.`;
                if (textChs.size > 0) await textChs.first().send(`@everyone ${outText}`);
                else console.log(`${guildData.step++}. ${outText}`);

                return resolve(guildData);
            } catch (ex) {
                return reject(ex);
            }
        });
    }
}

module.exports = Cleaner;
