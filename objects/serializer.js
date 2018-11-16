const { debug } = require('../settings.json');
const fs = require('fs');
const Logger = require('./logger');

class Serializer {
    /**
     * Guild data serialization.
     * @param {Client} client Discord Client
     * @param {string} originalGuildId The id of the original guild
     * @param {Collection} banCollection Banned users
     * @param {Object} guildData Serialized guild data
     * @param {string} backupFile Backup JSON file name
     * @param {Object} translator Translator object
     * @returns {Object} guildData
     */
    static serializeOldGuild(client, originalGuildId, banCollection, guildData, backupFile, translator) {
        // Check
        let guildToCopy = client.guilds.get(originalGuildId);
        if (!guildToCopy.available) throw new Error(translator.disp('errorSerializerGuildUnavailable'));

        // General
        Logger.logMessage(translator.disp('messageSerializerGeneralData', [guildData.step++]));
        guildData.general = this.getGeneralData(guildToCopy);

        // Roles
        Logger.logMessage(translator.disp('messageSerializerRoleData', [guildData.step++]));
        guildData.roles = guildData.roles = this.serializeRoles(guildToCopy);
        if (debug) Logger.logMessage(translator.disp('messageSerializerRoleDataDebug', [guildData.step - 1, guildData.roles.length]));

        // Categories
        Logger.logMessage(translator.disp('messageSerializerCategoryData', [guildData.step++]));
        guildData.categories = this.serializeCategories(guildToCopy);
        if (debug) Logger.logMessage(translator.disp('messageSerializerCategoryDataDebug', [guildData.step - 1, guildData.categories.length]));

        // Text channel
        Logger.logMessage(translator.disp('messageSerializerTextData', [guildData.step++]));
        guildData.textChannel = this.serializeTextChannels(guildToCopy);
        if (debug) Logger.logMessage(translator.disp('messageSerializerTextDataDebug', [guildData.step - 1, guildData.textChannel.length]));

        // Voice channel
        Logger.logMessage(translator.disp('messageSerializerVoiceData', [guildData.step++]));
        guildData.voiceChannel = this.serializeVoiceChannels(guildToCopy);
        if (debug) Logger.logMessage(translator.disp('messageSerializerVoiceDataDebug', [guildData.step - 1, guildData.voiceChannel.length]));

        // Emojis
        Logger.logMessage(translator.disp('messageSerializerEmojiData', [guildData.step++]));
        guildData.emojis = this.serializeEmojis(guildToCopy);
        if (debug) Logger.logMessage(translator.disp('messageSerializerEmojiDataDebug', [guildData.step - 1, guildData.emojis.length]));

        // Bans
        Logger.logMessage(translator.disp('messageSerializerBanData', [guildData.step++]));
        guildData.bans = this.serializeBans(banCollection);
        if (debug) Logger.logMessage(translator.disp('messageSerializerBanDataDebug', [guildData.step - 1, guildData.bans.length]));

        // Save data to file
        Logger.logMessage(translator.disp('messageSerializerSave', [guildData.step++]));
        fs.writeFileSync(backupFile, JSON.stringify(guildData));
        Logger.logMessage(translator.disp('messageSerializerSaveFinished', [guildData.step++]));

        return guildData;
    }

    /**
     * Serialization of all general data.
     * @param {Guild} guild Original guild object
     * @returns {Object} General guild data
     */
    static getGeneralData(guild) {
        return {
            name: guild.name,
            region: guild.region,
            icon: guild.iconURL({ format: 'png', size: 2048 }),
            verificationLevel: guild.verificationLevel,
            afkTimeout: guild.afkTimeout,
            explicitContentFilter: guild.explicitContentFilter,
        };
    }

    /**
     * Role serialization.
     * Managed roles will also be saved.
     * The role collection is sorted by their position
     * to ensure correct order afterwards.
     * @param {Guild} guildToCopy Original guild object
     * @returns {Object[]} Serialized guild roles
     */
    static serializeRoles(guildToCopy) {
        let roleCol = guildToCopy.roles.sort((a, b) => b.position - a.position);
        let roles = roleCol.map(role => {
            return {
                idOld: role.id,
                name: role.name,
                hexColor: role.hexColor,
                hoist: role.hoist,
                mentionable: role.mentionable,
                position: role.position,
                rawPosition: role.rawPosition,
                defaultRole: guildToCopy.defaultRole.id === role.id,
                permBitfield: role.permissions.bitfield,
            };
        });

        return roles;
    }

    /**
     * Category serialization.
     * Only role permission overwrites will be saved.
     * The category collection is sorted by their position
     * to ensure correct order afterwards.
     * @param {Guild} guildToCopy Original guild object
     * @returns {Object[]} Serialized category channels
     */
    static serializeCategories(guildToCopy) {
        let categoryCollection = guildToCopy.channels.filter(c => c.type === 'category');
        categoryCollection = categoryCollection.sort((a, b) => a.position - b.position);
        let categories = categoryCollection.map(category => {
            let permOverwritesCollection = category.permissionOverwrites.filter(pOver => pOver.type === 'role');
            permOverwritesCollection = permOverwritesCollection.filter(pOver => guildToCopy.roles.has(pOver.id));
            let permOverwrites = permOverwritesCollection.map(pOver => {
                return {
                    id: pOver.id,
                    allowed: pOver.allow.bitfield,
                    denied: pOver.deny.bitfield,
                };
            });

            return {
                idOld: category.id,
                name: category.name,
                position: category.position,
                rawPosition: category.rawPosition,
                permOverwrites: permOverwrites,
            };
        });

        return categories;
    }

    /**
     * Text channel serialization.
     * Only role permission overwrites will be saved.
     * The text channel collection is sorted by their
     * rawPosition to ensure correct order afterwards.
     * @param {Guild} guildToCopy Original guild object
     * @returns {Object[]} Serialized text channels
     */
    static serializeTextChannels(guildToCopy) {
        let textChannelCollection = guildToCopy.channels.filter(c => c.type === 'text');
        textChannelCollection = textChannelCollection.sort((a, b) => a.rawPosition - b.rawPosition);
        let textChannel = textChannelCollection.map(tCh => {
            let permOverwritesCollection = tCh.permissionOverwrites.filter(pOver => pOver.type === 'role');
            permOverwritesCollection = permOverwritesCollection.filter(pOver => guildToCopy.roles.has(pOver.id));
            let permOverwrites = permOverwritesCollection.map(pOver => {
                return {
                    id: pOver.id,
                    allowed: pOver.allow.bitfield,
                    denied: pOver.deny.bitfield,
                };
            });

            return {
                id: tCh.id,
                name: tCh.name,
                topic: tCh.topic,
                nsfw: tCh.nsfw,
                isSystemChannel: guildToCopy.systemChannelID === tCh.id,
                position: tCh.position,
                rawPosition: tCh.rawPosition,
                parentCat: tCh.parentID,
                permLocked: tCh.permissionsLocked ? tCh.permissionsLocked : false,
                permOverwrites: tCh.permissionsLocked ? null : permOverwrites,
            };
        });

        return textChannel;
    }

    /**
     * Voice channel serialization.
     * Only role permission overwrites will be saved.
     * The voice channel collection is sorted by their
     * rawPosition to ensure correct order afterwards.
     * @param {Guild} guildToCopy Original guild object
     * @returns {Object[]} Serialized voice channels
     */
    static serializeVoiceChannels(guildToCopy) {
        let voiceChannelCollection = guildToCopy.channels.filter(c => c.type === 'voice');
        voiceChannelCollection = voiceChannelCollection.sort((a, b) => a.rawPosition - b.rawPosition);
        let voiceChannel = voiceChannelCollection.map(vCh => {
            let permOverwritesCollection = vCh.permissionOverwrites.filter(pOver => pOver.type === 'role');
            permOverwritesCollection = permOverwritesCollection.filter(pOver => guildToCopy.roles.has(pOver.id));
            let permOverwrites = permOverwritesCollection.map(pOver => {
                return {
                    id: pOver.id,
                    allowed: pOver.allow.bitfield,
                    denied: pOver.deny.bitfield,
                };
            });

            return {
                id: vCh.id,
                name: vCh.name,
                position: vCh.position,
                rawPosition: vCh.rawPosition,
                parentCat: vCh.parentID,
                bitrate: vCh.bitrate,
                userLimit: vCh.userLimit,
                isAfkChannel: guildToCopy.afkChannelID === vCh.id,
                permLocked: vCh.permissionsLocked ? vCh.permissionsLocked : false,
                permOverwrites: vCh.permissionsLocked ? null : permOverwrites,
            };
        });

        return voiceChannel;
    }

    /**
     * Emoji serialization.
     * @param {Guild} guildToCopy Original guild object
     * @returns {Object[]} Serialized emojis
     */
    static serializeEmojis(guildToCopy) {
        return guildToCopy.emojis.map(emoji => {
            return {
                name: emoji.name,
                url: emoji.url,
            };
        });
    }

    /**
     * Banned user serialization.
     * Original ban reasons will be copied over if available.
     * @param {Collection} banCollection Banned users Collection
     * @returns {Object[]} Serialized banned users
     */
    static serializeBans(banCollection) {
        return banCollection.map(ban => {
            return {
                userId: ban.user.id,
                reason: ban.reason || null,
            };
        });
    }
}

module.exports = Serializer;
