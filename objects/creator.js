const { copy, debug, sleepTimeout } = require('../settings.json');
const { Permissions, Collection } = require('discord.js');
const { validateBitrate, validateUserLimit } = require('./functions');
const Logger = require('./logger');
const Discord = require('discord.js');

BigInt.prototype.toJSON = function() { return this.toString(); };

class Creator {
    /**
     * New Guild creation.
     * Emojis/Bans will be skipped if deactivated in the settings.
     * @param {Client} client Discord Client
     * @param {Object} guildData Serialized guild data
     * @param {string} newGuildId New guild id
     * @param {string} newGuildAdminRoleId New guild Administrator role id
     * @param {Object} translator Translator object
     * @returns {Object} Promise which resolves when finished
     */
    static setData(client, guildData, newGuildId, newGuildAdminRoleId, translator) {
        return new Promise(async (resolve, reject) => {
            try {
                let newGuild = client.guilds.cache.get(newGuildId);
                guildData.references = {};

                // General
                if (copy.General) {
                    Logger.logMessage(translator.disp('messageCreatorGeneralData', guildData.step++));
                    await this.setGeneralData(guildData, newGuild);
                }

                if (copy.RCC) {
                    // Roles
                    if (guildData.roles.length) {
                        Logger.logMessage(translator.disp('messageCreatorRoleData', guildData.step++));
                        guildData.references.roles = await this.createRoles(guildData, newGuild, translator);
                    }

                    // Categories
                    if (guildData.categories.length) {
                        Logger.logMessage(translator.disp('messageCreatorCategoryData', guildData.step++));
                        guildData.references.categories = await this.createCategories(guildData, newGuild, translator);
                    }

                    // Text channel
                    if (guildData.textChannel.length) {
                        Logger.logMessage(translator.disp('messageCreatorTextData', guildData.step++));
                        await this.createTextChannel(guildData, newGuild, translator);
                    }

                    // Voice channel
                    if (guildData.voiceChannel.length) {
                        Logger.logMessage(translator.disp('messageCreatorVoiceData', guildData.step++));
                        await this.createVoiceChannel(guildData, newGuild, translator);
                    }
                }

                // Emojis
                if (copy.Emojis && guildData.emojis.length) {
                    Logger.logMessage(translator.disp('messageCreatorEmojiData', guildData.step++));
                    await this.createEmojis(guildData, newGuild, translator);
                }

                // Bans
                if (copy.Bans && guildData.bans.length) {
                    Logger.logMessage(translator.disp('messageCreatorBanData', guildData.step++));
                    guildData = await this.createBans(guildData, newGuild, translator);
                }

                return resolve(guildData);
            } catch (err) {
                return reject(err);
            }
        });
    }

    /**
     * Setting of gerenal data.
     * Non valid regions (like vip ones) will be set to 'us-central'.
     * AFK Channel/Timeout: Will be set after voice channel creation
     * System channel: same as AFK Channel/Timeout
     * @param {Object} guildData Serialized guild data
     * @param {Guild} newGuild New guild
     * @param {Object} translator Translator object
     * @returns {Object} Promise which resolves when finished
     */
    static setGeneralData(guildData, newGuild) {
        return new Promise(async (resolve, reject) => {
            try {
                let general = guildData.general;

                await newGuild.setName(general.name);
                await newGuild.setIcon(general.icon);
                await newGuild.setVerificationLevel(general.verificationLevel);
                await newGuild.setExplicitContentFilter(general.explicitContentFilter);

                switch (newGuild.premiumTier) {
                    case 1:
                        if (guildData.splash) await newGuild.setSplash(guildData.splash);
                        break;
                    case 2:
                    case 3:
                        if (guildData.splash) await newGuild.setSplash(guildData.splash);
                        if (guildData.banner) await newGuild.setBanner(guildData.banner);
                        break;
                }

                return resolve();
            } catch (err) {
                return reject(err);
            }
        });
    }

    /**
     * Role creation.
     * @everyone role permissions will be overwritten.
     * @param {Object} guildData Serialized guild data
     * @param {Guild} newGuild New guild
     * @param {Object} translator Translator object
     * @returns {Object} Promise which resolves into roleReferences
     */
    static createRoles(guildData, newGuild, translator) {
        return new Promise(async (resolve, reject) => {
            try {
                let counter = 1;
                let roleReferences = new Collection();
                for (let i = 0; i < guildData.roles.length; i++) {
                    let role = guildData.roles[i];

                    if (role.defaultRole) {
                        // Edit existing @everyone
                        let everyoneRole = newGuild.roles.everyone;
                        await everyoneRole.setPermissions(BigInt(role.permBitfield));
                        roleReferences.set(role.idOld, { new: newGuild.roles.everyone, old: role });
                    } else {
                        // Create new role
                        let newRole = {
                                name: role.name,
                                color: role.hexColor,
                                hoist: role.hoist,
                                mentionable: role.mentionable,
                                permissions: BigInt(role.permBitfield),
                        };

                        let createdRole = await newGuild.roles.create(newRole);
                        if (debug) Logger.logMessage(translator.disp('messageCreatorRoleDataDebug', guildData.step - 1, counter++, createdRole.name));
                        roleReferences.set(role.idOld, { new: createdRole, old: role });
                    }

                    await this.sleep();
                }

                return resolve(roleReferences);
            } catch (err) {
                return reject(err);
            }
        });
    }

    /**
     * Category creation.
     * @param {Object} guildData Serialized guild data
     * @param {guild} newGuild New guild
     * @param {Object} translator Translator object
     * @returns {Object} Promise which resolves into categoryReferences
     */
    static createCategories(guildData, newGuild, translator) {
        return new Promise(async (resolve, reject) => {
            try {
                let counter = 1;
                let categoryReferences = new Collection();
                for (let i = 0; i < guildData.categories.length; i++) {
                    let category = guildData.categories[i];

                    let overwrites = category.permOverwrites.map(permOver => {
                        return {
                            id: guildData.references.roles.get(permOver.id).new.id,
                            allow: new Permissions(BigInt(permOver.allowed)),
                            deny: new Permissions(BigInt(permOver.denied)),
                        };
                    });
                    let options = {
                        type: 4,
                        permissionOverwrites: overwrites,
                    };

                    let createdCategory = await newGuild.channels.create(category.name, options);
                    if (debug) Logger.logMessage(translator.disp('messageCreatorCategoryDataDebug', guildData.step - 1, counter++, createdCategory.name));
                    categoryReferences.set(category.idOld, { new: createdCategory, old: category });

                    this.sleep();
                }

                return resolve(categoryReferences);
            } catch (err) {
                return reject(err);
            }
        });
    }

    /**
     * Text channel creation.
     * Topic and systemChannel are set after creation.
     * @param {Object} guildData Serialized guild data
     * @param {Guild} newGuild New guild
     * @param {Object} translator Translator object
     * @returns {Object} Promise which resolves when finished
     */
    static createTextChannel(guildData, newGuild, translator) {
        return new Promise(async (resolve, reject) => {
            try {
                let counter = 1;
                let newSystemChannel = null;
                for (let i = 0; i < guildData.textChannel.length; i++) {
                    let textChannel = guildData.textChannel[i];

                    let options = {
                        type: 0,
                        nsfw: textChannel.nsfw,
                        topic: textChannel.topic,
                    };
                    if (textChannel.parentCat) {
                        options.parent = guildData.references.categories.get(textChannel.parentCat).new.id;
                    }
                    if (!textChannel.permLocked) {
                        options.permissionOverwrites = textChannel.permOverwrites.map(permOver => {
                            return {
                                id: guildData.references.roles.get(permOver.id).new.id,
                                allow: new Permissions(BigInt(permOver.allowed)),
                                deny: new Permissions(BigInt(permOver.denied)),
                            };
                        });
                    }

                    let createdChannel = await newGuild.channels.create(textChannel.name, options);
                    if (textChannel.isSystemChannel) newSystemChannel = createdChannel.id;
                    if (debug) Logger.logMessage(translator.disp('messageCreatorTextDataDebug', guildData.step - 1, counter++, createdChannel.name));

                    await this.sleep();
                }

                if (newSystemChannel) {
                    await newGuild.setSystemChannel(newSystemChannel);
                    await newGuild.setSystemChannelFlags(guildData.general.systemChannelFlags);
                }

                return resolve();
            } catch (err) {
                return reject(err);
            }
        });
    }

    /**
     * Voice Channel creation.
     * AFK Channel/Timeout are set after creation.
     * @param {Object} guildData Serialized guild data
     * @param {Guild} newGuild New guild
     * @param {Object} translator Translator object
     * @returns {Object} Promise which resolves when finished
     */
    static createVoiceChannel(guildData, newGuild, translator) {
        return new Promise(async (resolve, reject) => {
            try {
                let counter = 1;
                let newAfkChannel = null;
                for (let i = 0; i < guildData.voiceChannel.length; i++) {
                    let voiceChannel = guildData.voiceChannel[i];

                    let options = {
                        type: 2,
                        bitrate: validateBitrate(voiceChannel.bitrate, newGuild.premiumTier),
                        userLimit: validateUserLimit(voiceChannel.userLimit),
                    };
                    if (voiceChannel.parentCat) {
                        options.parent = guildData.references.categories.get(voiceChannel.parentCat).new.id;
                    }
                    if (!voiceChannel.permLocked) {
                        options.permissionOverwrites = voiceChannel.permOverwrites.map(permOver => {
                            return {
                                id: guildData.references.roles.get(permOver.id).new.id,
                                allow: new Permissions(BigInt(permOver.allowed)),
                                deny: new Permissions(BigInt(permOver.denied)),
                            };
                        });
                    }

                    let createdChannel = await newGuild.channels.create(voiceChannel.name, options);
                    if (voiceChannel.region) await createdChannel.setRTCRegion(voiceChannel.region);
                    if (voiceChannel.isAfkChannel) newAfkChannel = createdChannel.id;
                    if (debug) Logger.logMessage(translator.disp('messageCreatorVoiceDataDebug', guildData.step - 1, counter++, createdChannel.name));

                    await this.sleep();
                }

                if (newAfkChannel) await newGuild.setAFKChannel(newAfkChannel);
                await newGuild.setAFKTimeout(guildData.general.afkTimeout);

                return resolve();
            } catch (err) {
                return reject(err);
            }
        });
    }

    /**
     * Emoji Creation.
     * Only executed if enabled in the settings.
     * @param {Object} guildData Serialized guild data
     * @param {Guild} newGuild New guild
     * @param {Object} translator Translator object
     * @returns {Object} Promise which resolves when finished
     */
    static createEmojis(guildData, newGuild, translator) {
        return new Promise(async (resolve, reject) => {
            try {
                let counter = 1;

                let emojisNormal = guildData.emojis.filter(e => !e.animated);
                let emojisAnimated = guildData.emojis.filter(e => e.animated);
                switch (newGuild.premiumTier) {
                    case 0:
                        emojisNormal = emojisNormal.filter((e, i) => i < 50);
                        emojisAnimated = emojisAnimated.filter((e, i) => i < 50);
                        break;
                    case 1:
                        emojisNormal = emojisNormal.filter((e, i) => i < 100);
                        emojisAnimated = emojisAnimated.filter((e, i) => i < 100);
                        break;
                    case 2:
                        emojisNormal = emojisNormal.filter((e, i) => i < 150);
                        emojisAnimated = emojisAnimated.filter((e, i) => i < 150);
                        break;
                    case 3:
                        emojisNormal = emojisNormal.filter((e, i) => i < 250);
                        emojisAnimated = emojisAnimated.filter((e, i) => i < 250);
                }

                for (let i = 0; i < emojisNormal.length; i++) {
                    let emoji = emojisNormal[i];
                    let createdEmoji = await newGuild.emojis.create(emoji.url, emoji.name);
                    if (debug) Logger.logMessage(translator.disp('messageCreatorEmojiDataDebug', guildData.step - 1, counter++, createdEmoji.name));

                    await this.sleep();
                }

                for (let i = 0; i < emojisAnimated.length; i++) {
                    let emoji = emojisAnimated[i];
                    let createdEmoji = await newGuild.emojis.create(emoji.url, emoji.name)
                    if (debug) Logger.logMessage(translator.disp('messageCreatorEmojiDataDebug', guildData.step - 1, counter++, createdEmoji.name));

                    await this.sleep();
                }

                return resolve();
            } catch (err) {
                return reject(err);
            }
        });
    }

    /**
     * Banning users.
     * Only executed if enabled in the settings.
     * @param {Object} guildData Serialized guild data
     * @param {Guild} newGuild New guild
     * @param {Object} translator Translator object
     * @returns {Object} Promise which resolves when finished
     */
    static createBans(guildData, newGuild, translator) {
        return new Promise(async (resolve, reject) => {
            try {
                let counter = 1;

                for (let i = 0; i < guildData.bans.length; i++) {
                    let ban = guildData.bans[i];
                    let newBan = await newGuild.members.ban(ban.userId, { reason: ban.reason })
                    let username = newBan.user ? newBan.user.tag : newBan.tag || newBan;
                    if (debug) Logger.logMessage(translator.disp('messageCreatorBanDataDebug', guildData.step - 1, counter++, username));

                    await this.sleep();
                }

                return resolve(guildData);
            } catch (err) {
                return reject(err);
            }
        });
    }

    /**
     * Final message after all data has been created.
     * If at least one text channel exists, the message
     * will be posted in the first one, otherwise in the console.
     * @param {Client} client Discord Client
     * @param {string} originalGuildId Original guild id
     * @param {string} newGuildId New guild id
     * @param {string} newGuildAdminRoleId New guild Administrator role id
     * @param {Object} guildData Serialized guild data
     * @param {Object} translator Translator object
     * @returns {Object} Promise
     */
    static finalize(client, originalGuildId, newGuildId, newGuildAdminRoleId, guildData, translator) {
        return new Promise(async (resolve, reject) => {
            try {
                let newGuild = client.guilds.cache.get(newGuildId);
                let deleteableAdminRole = newGuild.roles.cache.get(newGuildAdminRoleId);
                let textChs = newGuild.channels.cache.filter(c => c.type === 'text');
                let outText = translator.disp('messageGuildCopyFinished', deleteableAdminRole.name);

                let invites = [];
                let members = new Discord.Collection();
                if (client.guilds.cache.has(originalGuildId)) {
                    let origGuild = client.guilds.cache.get(originalGuildId);
                    members = await origGuild.members.fetch();
                }

                if (members.size > 0) {
                    let bots = members.filter(m => m.user.bot);
                    invites = bots.map(b => `<https://discordapp.com/oauth2/authorize?&client_id=${b.user.id}&scope=bot>`);
                }

                Logger.logMessage(`${guildData.step++}. ${outText}`);
                if (textChs.size > 0) {
                    if (invites.length > 0) outText += `\n${translator.disp('messageGuildCopyFinishedInvites')}:\n${invites.join('\n')}`;
                    await textChs.first().send(`@everyone ${outText}`, { split: true });
                }

                return resolve();
            } catch (err) {
                return reject(err);
            }
        });
    }

    static sleep(time = sleepTimeout) {
        return new Promise(resolve => {
            setTimeout(() => { resolve() }, time);
        });
    }
}

module.exports = Creator;
