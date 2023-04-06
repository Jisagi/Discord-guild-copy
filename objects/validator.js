class Validator {

    /**
     * Ensure node version is >= 16.0.0
     * @param {Object} Translator Translator object
     */
    static validateNodeVersion(Translator) {
        const rgx = /(\d+)\.(\d+)\.(\d+)/g;
        let res = process.version.match(rgx);
        if (res.length < 1) throw new Error(Translator.disp('errorNode'));
        let major = res[0].split('.')[0];
        if (!Number.isInteger(parseInt(major)) || new Number(major) < 16) throw new Error(Translator.disp('errorNode'));
    }

    /**
     * Backup only settings validation.
     * @param {Client} client Discord Client
     * @param {string} originalGuildId Original guild id
     * @param {Object} Translator Translator object
     */
    static validateSettingsBackup(client, originalGuildId, copyBans, Translator) {
        if (!client.guilds.cache.has(originalGuildId)) throw new Error(Translator.disp('errorSerializationOriginalNotExistent'));
        if (!copyBans) return;
        let member = client.guilds.cache.get(originalGuildId).me;
        if (!member.permissions.has('BAN_MEMBERS') && !member.permissions.has('ADMINISTRATOR')) throw new Error(Translator.disp('errorSerializationNoBanPermissions'));
    }

    /**
     * Settings validation for restore. Filters out the most common errors.
     * If a role named 'guildcopy' exists on the new guild
     * it will be used in the further process.
     * @param {Client} client Discord Client
     * @param {string} originalGuildId Original guild id
     * @param {string} newGuildId New guild id
     * @param {string} newGuildAdminRoleId New guild Administrator role id
     * @param {Object} translator Translator object
     * @returns {Object} Settings data
     */
    static validateSettingsRestore(client, originalGuildId, newGuildId, newGuildAdminRoleId, translator) {
        let data = { changed: false };

        if (originalGuildId === newGuildId) throw new Error(translator.disp('errorValidationIdenticalGuilds'));
        if (!client.guilds.cache.has(newGuildId)) throw new Error(translator.disp('errorValidationNotMember'));
        let newGuild = client.guilds.cache.get(newGuildId);
        if (!newGuild.available) throw new Error(translator.disp('errorValidationAvailability'));

        let newGuildAdminRole;
        if (newGuild.roles.cache.has(newGuildAdminRoleId)) {
            newGuildAdminRole = newGuild.roles.cache.get(newGuildAdminRoleId);
        } else {
            newGuildAdminRole = newGuild.roles.cache.find(elem => elem.name.toLowerCase() === 'guildcopy');
            if (newGuildAdminRole) {
                data.changed = true;
                data.newGuildAdminRoleId = newGuildAdminRole.id;
            }
        }

        if (!newGuildAdminRole) throw new Error(translator.disp('errorValidationAdminRoleExists'));
        if (!newGuildAdminRole.permissions.has('ADMINISTRATOR')) throw new Error(translator.disp('errorValidationAdminRolePersmissions'));
        let highestRole = newGuild.roles.cache.reduce((prev, role) => role.comparePositionTo(prev) > 0 ? role : prev, newGuild.roles.cache.first());
        if (newGuildAdminRole.id !== highestRole.id) throw new Error(translator.disp('errorValidationAdminRolePosition'));
        if (!newGuild.members.me.roles.cache.has(newGuildAdminRole.id)) throw new Error(translator.disp('errorValidationAdminRoleNotAssigned'));

        return data;
    }
}

module.exports = Validator;
