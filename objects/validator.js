class Validator {
    /**
     * Settings validation. Filters out the most common errors.
     * If a role named 'guildcopy' exists on the new guild
     * it will be used in the further process.
     * This method will only be executed with a bot token, because
     * when dumping with a user token all this validated data
     * won't be used anyway.
     * @param {Client} client Discord Client
     * @param {string} originalGuildId Original guild id
     * @param {string} newGuildId New guild id
     * @param {string} newGuildAdminRoleId New guild Administrator role id
     * @returns {Object} Settings data
     */
    static validateSettings(client, originalGuildId, newGuildId, newGuildAdminRoleId) {
        let data = { changed: false };

        if (originalGuildId === newGuildId) throw new Error('New and old guild cannot be the same.');
        let newGuild = client.guilds.get(newGuildId);
        if (!newGuild) throw new Error('Please check if the new guild id in the settings is valid.');
        if (!newGuild.available) throw new Error('New guild not available. Please try again later.');

        let newGuildAdminRole;
        if (newGuild.roles.has(newGuildAdminRoleId)) {
            newGuildAdminRole = newGuild.roles.get(newGuildAdminRoleId);
        } else {
            newGuildAdminRole = newGuild.roles.find('name', 'guildcopy');
            if (newGuildAdminRole) {
                data.changed = true;
                data.newGuildAdminRoleId = newGuildAdminRole.id;
            }
        }

        if (!newGuildAdminRole) throw new Error('New guild admin role id doesn\'t exist.');
        if (!newGuildAdminRole.permissions.has('ADMINISTRATOR')) throw new Error('New guild admin role doesn\'t have administrator permissions.');
        let highestRole = newGuild.roles.reduce((prev, role) => role.comparePositionTo(prev) > 0 ? role : prev, newGuild.roles.first());
        if (newGuildAdminRole.id !== highestRole.id) throw new Error('The guildcopy role has to be the highest role on the target guild.');
        if (!newGuild.me.roles.has(newGuildAdminRole.id)) throw new Error('Please assign the guildcopy role to the bot.');

        return data;
    }
}

module.exports = Validator;
