class Validator {

    /**
     * Settings validation. Filters out most common errors.
     * If a role named 'guildcopy' exists on the new guild
     * it will be used in the further process.
     * 
     * @param  {Client} client Discord Client
     * @param  {string} originalGuildId Original guild id
     * @param  {string} newGuildId New guild id
     * @param  {string} newGuildAdminRoleId New guild Administrator role id
     */
    static validateSettings(client, originalGuildId, newGuildId, newGuildAdminRoleId) {
        return new Promise((resolve, reject) => {
            try {
                let data = {
                    changed: false
                };

                if (originalGuildId === newGuildId) return reject(new Error('New and old guild cannot be the same.'));

                let newGuild = client.guilds.get(newGuildId);
                if (!newGuild) return reject(new Error('New Guild does not exist. Please check if the id in the settings is correct.'));
                if (!newGuild.available) return reject(new Error('New guild not available. Please try again later.'));

                let newGuildAdminRole = newGuild.roles.get(newGuildAdminRoleId);
                if (!newGuildAdminRole) {
                    let guildcopyRoles = newGuild.roles.findAll('name', 'guildcopy');
                    if (guildcopyRoles.length === 1) {
                        newGuildAdminRole = guildcopyRoles[0];
                        data.changed = true;
                        data.newGuildAdminRoleId = newGuildAdminRole.id;
                    }
                }

                if (!newGuildAdminRole) return reject(new Error('New guild admin role id doesn\'t exist.'));
                if (!newGuildAdminRole.permissions.has('ADMINISTRATOR')) return reject(new Error('New guild admin role doesn\'t have administrator permissions.'));

                let ownRoles = newGuild.me.roles.filter(r => r.id === newGuildAdminRole.id);
                if (client.user.bot && ownRoles.size < 1) return reject(new Error('Please assign the guildcopy role to the bot.'));

                return resolve(data);
            } catch (ex) {
                return reject(ex);
            }
        });
    }
}

module.exports = Validator;
