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
     * @param {Object} translator Translator object
     * @returns {Object} Settings data
     */
    static validateSettings(client, originalGuildId, newGuildId, newGuildAdminRoleId, translator) {
        let data = { changed: false };

        if (originalGuildId === newGuildId) throw new Error(translator.disp('errorValidationIdenticalGuilds'));
        if (!client.guilds.has(newGuildId)) throw new Error(translator.disp('errorValidationNotMember'));
        let newGuild = client.guilds.get(newGuildId);
        if (!newGuild.available) throw new Error(translator.disp('errorValidationAvailability'));

        let newGuildAdminRole;
        if (newGuild.roles.has(newGuildAdminRoleId)) {
            newGuildAdminRole = newGuild.roles.get(newGuildAdminRoleId);
        } else {
            newGuildAdminRole = newGuild.roles.find(elem => elem.name.toLowerCase() === 'guildcopy');
            if (newGuildAdminRole) {
                data.changed = true;
                data.newGuildAdminRoleId = newGuildAdminRole.id;
            }
        }

        if (!newGuildAdminRole) throw new Error(translator.disp('errorValidationAdminRoleExists'));
        if (!newGuildAdminRole.permissions.has('ADMINISTRATOR')) throw new Error(translator.disp('errorValidationAdminRolePersmissions'));
        let highestRole = newGuild.roles.reduce((prev, role) => role.comparePositionTo(prev) > 0 ? role : prev, newGuild.roles.first());
        if (newGuildAdminRole.id !== highestRole.id) throw new Error(translator.disp('errorValidationAdminRolePosition'));
        if (!newGuild.me.roles.has(newGuildAdminRole.id)) throw new Error(translator.disp('errorValidationAdminRoleNotAssigned'));

        return data;
    }
}

module.exports = Validator;
