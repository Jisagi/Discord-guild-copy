const { copyEmojis, copyBans, output, debug } = require('../settings.json');
const { Permissions, Collection } = require('discord.js');
const { validateBitrate, validateUserLimit } = require('./functions');
const Logger = require('./logger');
const Discord = require('discord.js');

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
                let newGuild = client.guilds.get(newGuildId);
                guildData.references = {};

                // General
                Logger.logMessage(translator.disp('messageCreatorGeneralData', [guildData.step++]));
                await this.setGeneralData(guildData, newGuild);

                // Roles
                if (guildData.roles.length) {
                    Logger.logMessage(translator.disp('messageCreatorRoleData', [guildData.step++]));
                    guildData.references.roles = await this.createRoles(guildData, newGuild, translator);
                }

                // Categories
                if (guildData.categories.length) {
                    Logger.logMessage(translator.disp('messageCreatorCategoryData', [guildData.step++]));
                    guildData.references.categories = await this.createCategories(guildData, newGuild, translator);
                }

                // Text channel
                if (guildData.textChannel.length) {
                    Logger.logMessage(translator.disp('messageCreatorTextData', [guildData.step++]));
                    await this.createTextChannel(guildData, newGuild, translator);
                }

                // Voice channel
                if (guildData.voiceChannel.length) {
                    Logger.logMessage(translator.disp('messageCreatorVoiceData', [guildData.step++]));
                    await this.createVoiceChannel(guildData, newGuild, translator);
                }

                // Emojis
                if (copyEmojis && guildData.emojis.length) {
                    Logger.logMessage(translator.disp('messageCreatorEmojiData', [guildData.step++]));
                    await this.createEmojis(guildData, newGuild, translator);
                }

                // Bans
                if (copyBans && guildData.bans.length) {
                    Logger.logMessage(translator.disp('messageCreatorBanData', [guildData.step++]));
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
                let allowedRegions = ['brazil', 'us-west', 'singapore', 'eu-central', 'hongkong',
                    'us-south', 'amsterdam', 'us-central', 'london', 'us-east', 'sydney', 'japan',
                    'eu-west', 'frankfurt', 'russia'];
                let region = allowedRegions.includes(general.region) ? general.region : 'us-central';

                await newGuild.setName(general.name);
                await newGuild.setRegion(region);
                await newGuild.setIcon(general.icon);
                await newGuild.setVerificationLevel(general.verificationLevel);
                await newGuild.setExplicitContentFilter(general.explicitContentFilter);

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
                let promises = [];
                let roleReferences = new Collection();
                guildData.roles.forEach(role => {
                    if (role.defaultRole) {
                        // Edit existing @everyone
                        let everyoneRole = newGuild.defaultRole;
                        promises.push(everyoneRole.setPermissions(role.permBitfield));
                        roleReferences.set(role.idOld, { new: newGuild.defaultRole, old: role });
                    } else {
                        // Create new role
                        let newRole = {
                            data: {
                                name: role.name,
                                color: role.hexColor,
                                hoist: role.hoist,
                                mentionable: role.mentionable,
                                permissions: role.permBitfield,
                            },
                        };

                        let promise = newGuild.roles.create(newRole).then(createdRole => {
                            if (debug) Logger.logMessage(translator.disp('messageCreatorRoleDataDebug', [guildData.step - 1, counter++, createdRole.name]));
                            roleReferences.set(role.idOld, { new: createdRole, old: role });
                        });
                        promises.push(promise);
                    }
                });

                await Promise.all(promises);

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
                let promises = [];
                let categoryReferences = new Collection();
                guildData.categories.forEach(category => {
                    let overwrites = category.permOverwrites.map(permOver => {
                        return {
                            id: guildData.references.roles.get(permOver.id).new.id,
                            allow: new Permissions(permOver.allowed),
                            deny: new Permissions(permOver.denied),
                        };
                    });
                    let options = {
                        type: 'category',
                        permissionOverwrites: overwrites,
                    };

                    let promise = newGuild.channels.create(category.name, options).then(createdCategory => {
                        if (debug) Logger.logMessage(translator.disp('messageCreatorCategoryDataDebug', [guildData.step - 1, counter++, createdCategory.name]));
                        categoryReferences.set(category.idOld, { new: createdCategory, old: category });
                    });
                    promises.push(promise);
                });

                await Promise.all(promises);

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
                let promises = [];
                let newSystemChannel = null;
                let channelWithTopics = new Collection();
                guildData.textChannel.forEach(textChannel => {
                    let options = {
                        type: 'text',
                        nsfw: textChannel.nsfw,
                    };
                    if (textChannel.parentCat) {
                        options.parent = guildData.references.categories.get(textChannel.parentCat).new.id;
                    }
                    if (!textChannel.permLocked) {
                        options.permissionOverwrites = textChannel.permOverwrites.map(permOver => {
                            return {
                                id: guildData.references.roles.get(permOver.id).new.id,
                                allow: new Permissions(permOver.allowed),
                                deny: new Permissions(permOver.denied),
                            };
                        });
                    }

                    let promise = newGuild.channels.create(textChannel.name, options).then(createdChannel => {
                        if (textChannel.isSystemChannel) newSystemChannel = createdChannel.id;
                        if (textChannel.topic) channelWithTopics.set(createdChannel.id, { newCh: createdChannel, topic: textChannel.topic });
                        if (debug) Logger.logMessage(translator.disp('messageCreatorTextDataDebug', [guildData.step - 1, counter++, createdChannel.name]));
                    });
                    promises.push(promise);
                });

                await Promise.all(promises);
                if (newSystemChannel) await newGuild.setSystemChannel(newSystemChannel);
                promises = [];
                channelWithTopics.forEach(ch => promises.push(ch.newCh.setTopic(ch.topic)));
                await Promise.all(promises);

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
                let promises = [];
                let newAfkChannel = null;
                guildData.voiceChannel.forEach(voiceChannel => {
                    let options = {
                        type: 'voice',
                        bitrate: validateBitrate(voiceChannel.bitrate),
                        userLimit: validateUserLimit(voiceChannel.userLimit),
                    };
                    if (voiceChannel.parentCat) {
                        options.parent = guildData.references.categories.get(voiceChannel.parentCat).new.id;
                    }
                    if (!voiceChannel.permLocked) {
                        options.permissionOverwrites = voiceChannel.permOverwrites.map(permOver => {
                            return {
                                id: guildData.references.roles.get(permOver.id).new.id,
                                allow: new Permissions(permOver.allowed),
                                deny: new Permissions(permOver.denied),
                            };
                        });
                    }

                    let promise = newGuild.channels.create(voiceChannel.name, options).then(createdChannel => {
                        if (voiceChannel.isAfkChannel) newAfkChannel = createdChannel.id;
                        if (debug) Logger.logMessage(translator.disp('messageCreatorVoiceDataDebug', [guildData.step - 1, counter++, createdChannel.name]));
                    });
                    promises.push(promise);
                });

                await Promise.all(promises);
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
                let promises = [];
                guildData.emojis.forEach(emoji => {
                    let promise = newGuild.emojis.create(emoji.url, emoji.name).then(createdEmoji => {
                        if (debug) Logger.logMessage(translator.disp('messageCreatorEmojiDataDebug', [guildData.step - 1, counter++, createdEmoji.name]));
                    });
                    promises.push(promise);
                });

                await Promise.all(promises);

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
                let promises = [];
                guildData.bans.forEach(ban => {
                    let promise = newGuild.members.ban(ban.userId, { reason: ban.reason }).then(newBan => {
                        let username = newBan.user ? newBan.user.tag : newBan.tag || newBan;
                        if (debug) Logger.logMessage(translator.disp('messageCreatorBanDataDebug', [guildData.step - 1, counter++, username]));
                    });
                    promises.push(promise);
                });

                await Promise.all(promises);

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
                let newGuild = client.guilds.get(newGuildId);
                let deleteableAdminRole = newGuild.roles.get(newGuildAdminRoleId);
                let textChs = newGuild.channels.filter(c => c.type === 'text');
                let outText = translator.disp('messageGuildCopyFinished', [deleteableAdminRole.name]);

                let invites = [];
                let members = new Discord.Collection();
                if (client.guilds.has(originalGuildId)) {
                    let origGuild = client.guilds.get(originalGuildId);
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
}

module.exports = Creator;
