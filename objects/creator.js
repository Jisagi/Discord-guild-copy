const copyEmojis = require('../settings.json').copyEmojis;
const debug = require('../settings.json').debug;

class Creator {
    /**
     * New Guild creation.
     * Emojis will be skipped if deactivated in the settings.
     * 
     * @param  {Client} client Discord Client
     * @param  {Object} guildData Serialized guild data
     * @param  {string} newGuildId New guild id
     */
    static setData(client, guildData, newGuildId) {
        return new Promise(async (resolve, reject) => {
            try {
                let newGuild = client.guilds.get(newGuildId);

                // general
                console.log(`${guildData.step++}. Setting general data`);
                await this.setGeneralData(guildData, newGuild);

                // roles
                if (guildData.roles !== null) {
                    console.log(`${guildData.step++}. Creating roles`);
                    guildData = await this.createRoles(guildData, newGuild);
                }

                // categories
                if (guildData.categories !== null) {
                    console.log(`${guildData.step++}. Creating categories`);
                    guildData = await this.createCategories(guildData, newGuild, client);
                }

                // text channel
                if (guildData.textChannel !== null) {
                    console.log(`${guildData.step++}. Creating text channels`);
                    await this.createTextChannel(guildData, newGuild, client);
                }

                // voice channel
                if (guildData.voiceChannel !== null) {
                    console.log(`${guildData.step++}. Creating voice channels`);
                    await this.createVoiceChannel(guildData, newGuild, client);
                }

                // emojis
                if (copyEmojis && guildData.emojis !== null) {
                    console.log(`${guildData.step++}. Creating emojis`);
                    await this.createEmojis(guildData, newGuild);
                }

                return resolve(guildData);
            } catch (ex) {
                return reject(ex);
            }
        });
    }
    /**
     * Setting of gerenal data.
     * Non valid regions (like vip ones) will be set to 'us-central'.
     * AFK Channel/Timeout: Will be set after creation
     * System channel: same as AFK Channel/Timeout
     * 
     * @param  {Object} guildData Serialized guild data
     * @param  {Guild} newGuild New guild
     */
    static setGeneralData(guildData, newGuild) {
        return new Promise(async (resolve, reject) => {
            try {
                let general = guildData.general;
                let allowedRegions = ['brazil', 'us-west', 'singapore', 'eu-central', 'hongkong', 'us-south', 'amsterdam', 'us-central', 'london', 'us-east', 'sydney', 'japan', 'eu-west', 'frankfurt', 'russia'];
                let region = allowedRegions.includes(general.region) ? general.region : 'us-central';

                await newGuild.setName(general.name);
                await newGuild.setRegion(region);
                await newGuild.setIcon(general.icon);
                await newGuild.setVerificationLevel(general.verificationLevel);
                await newGuild.setExplicitContentFilter(general.explicitContentFilter);

                return resolve();
            } catch (ex) {
                return reject(ex);
            }
        });
    }
    /**
     * Role creation.
     * @everyone role permissions will be overwritten.
     * Initial role position on creation needs to be 1, otherwise
     * the sorting will be off and the created roles will have a
     * higher position than the 'guildcopy' role and can therefore
     * not be modified anymore by the bot.
     * 
     * @param  {Object} guildData Serialized guild data
     * @param  {Guild} newGuild New guild
     */
    static createRoles(guildData, newGuild) {
        return new Promise(async (resolve, reject) => {
            try {
                let counter = 1;
                guildData.references = {};
                guildData.references.roles = {};

                for (let role in guildData.roles) {
                    let originalRole = guildData.roles[role];

                    if (!originalRole.defaultRole) {
                        // create new role
                        let newRole = {
                            data: {
                                name: originalRole.name,
                                color: originalRole.hexColor,
                                hoist: originalRole.hoist,
                                mentionable: originalRole.mentionable,
                                permissions: originalRole.permBitfield,
                                position: 1 // prevents wrong role sorting
                            }
                        };

                        if (debug) console.log(`${guildData.step - 1}.${counter++} Creating role \"${originalRole.name}\"`);
                        let createdRole = await newGuild.roles.create(newRole);
                        guildData.roles[role].idNew = createdRole.id;
                        guildData.references.roles[originalRole.idOld] = createdRole.id;
                    } else {
                        // change existing @everyone
                        let everyoneRole = newGuild.defaultRole;
                        await everyoneRole.setPermissions(originalRole.permBitfield);
                        guildData.references.roles[originalRole.idOld] = everyoneRole.id;
                    }
                }

                return resolve(guildData);
            } catch (ex) {
                return reject(ex);
            }
        });
    }
    /**
     * Category creation.
     * 
     * @param  {Object} guildData Serialized guild data
     * @param  {guild} newGuild New guild
     * @param  {Client} client Discord Client
     */
    static createCategories(guildData, newGuild, client) {
        return new Promise(async (resolve, reject) => {
            try {
                let counter = 1;
                guildData.references.categories = {};

                for (let category in guildData.categories) {
                    let originalCategory = guildData.categories[category];

                    let options = {
                        type: 'category'
                    };
                    options.overwrites = [];
                    originalCategory.permOverwrites.forEach(origPermOver => {
                        let overwrite = {
                            id: guildData.references.roles[origPermOver.id],
                            allowed: new client.objects.discord.Permissions(origPermOver.allowed),
                            denied: new client.objects.discord.Permissions(origPermOver.denied)
                        };
                        options.overwrites.push(overwrite);
                    });

                    if (debug) console.log(`${guildData.step - 1}.${counter++} Creating catergory \"${originalCategory.name}\"`);
                    let newCategoryChannel = await newGuild.channels.create(originalCategory.name, options);
                    guildData.categories[category].idNew = newCategoryChannel.id;
                    guildData.references.categories[originalCategory.idOld] = originalCategory.idNew;
                }

                return resolve(guildData);
            } catch (ex) {
                return reject(ex);
            }
        });
    }
    /**
     * Text channel creation.
     * Topic and System Channel are set after creation.
     * 
     * @param  {Object} guildData Serialized guild data
     * @param  {Guild} newGuild New guild
     * @param  {Client} client Discord Client
     */
    static createTextChannel(guildData, newGuild, client) {
        return new Promise(async (resolve, reject) => {
            try {
                let counter = 1;

                for (let textChannel in guildData.textChannel) {
                    let origTextCh = guildData.textChannel[textChannel];

                    let options = {
                        type: 'text',
                        nsfw: origTextCh.nsfw
                    };
                    if (origTextCh.parentCat) options.parent = guildData.references.categories[origTextCh.parentCat];

                    if (!origTextCh.permLocked) {
                        options.overwrites = [];
                        origTextCh.permOverwrites.forEach(origPermOver => {
                            let overwrite = {
                                id: guildData.references.roles[origPermOver.id],
                                allowed: new client.objects.discord.Permissions(origPermOver.allowed),
                                denied: new client.objects.discord.Permissions(origPermOver.denied)
                            };
                            options.overwrites.push(overwrite);
                        });
                    }

                    if (debug) console.log(`${guildData.step - 1}.${counter++} Creating ${origTextCh.nsfw ? 'nsfw ' : ''}text channel \"${origTextCh.name}\"${origTextCh.parentCat ? ` (category: ${newGuild.channels.get(guildData.references.categories[origTextCh.parentCat]).name})` : ''}`);
                    let newTextChannel = await newGuild.channels.create(origTextCh.name, options);
                    if (origTextCh.topic) await newTextChannel.setTopic(origTextCh.topic);
                    if (origTextCh.systemChannel) await newGuild.setSystemChannel(newTextChannel.id);
                }

                return resolve();
            } catch (ex) {
                return reject(ex);
            }
        });
    }
    /**
     * Voice Channel creation.
     * AFK Channel/Timeout are set after creation.
     * Bitrate is checked before creation because
     * some guilds have bitrates >96.
     * 
     * @param  {Object} guildData Serialized guild data
     * @param  {Guild} newGuild New guild
     * @param  {Client} client Discord Client
     */
    static createVoiceChannel(guildData, newGuild, client) {
        return new Promise(async (resolve, reject) => {
            try {
                let counter = 1;

                for (let voiceChannel in guildData.voiceChannel) {
                    let origVoiceCh = guildData.voiceChannel[voiceChannel];

                    let options = {
                        type: 'voice',
                        bitrate: (origVoiceCh.bitrate > 96 ? 96 : origVoiceCh.bitrate) * 1000,
                        userLimit: origVoiceCh.userLimit,
                    };
                    if (origVoiceCh.parentCat) options.parent = guildData.references.categories[origVoiceCh.parentCat];

                    if (!origVoiceCh.permLocked) {
                        options.overwrites = [];
                        origVoiceCh.permOverwrites.forEach(origPermOver => {
                            let overwrite = {
                                id: guildData.references.roles[origPermOver.id],
                                allowed: new client.objects.discord.Permissions(origPermOver.allowed),
                                denied: new client.objects.discord.Permissions(origPermOver.denied)
                            };
                            options.overwrites.push(overwrite);
                        });
                    }

                    if (debug) console.log(`${guildData.step - 1}.${counter++} Creating voice channel \"${origVoiceCh.name}\"${origVoiceCh.parentCat ? ` (category: ${newGuild.channels.get(guildData.references.categories[origVoiceCh.parentCat]).name})` : ''}`);
                    let newVoiceChannel = await newGuild.channels.create(origVoiceCh.name, options);
                    if (origVoiceCh.afkChannel) await newGuild.setAFKChannel(newVoiceChannel.id);
                }

                await newGuild.setAFKTimeout(guildData.general.afkTimeout);

                return resolve();
            } catch (ex) {
                return reject(ex);
            }
        });
    }
    /**
     * Emoji Creation.
     * Only executed if activated in the settings.
     * 
     * @param  {Object} guildData Serialized guild data
     * @param  {Guild} newGuild New guild
     */
    static createEmojis(guildData, newGuild) {
        return new Promise(async (resolve, reject) => {
            try {
                let counter = 1;

                for (let emoji in guildData.emojis) {
                    let origEmoji = guildData.emojis[emoji];
                    if (debug) console.log(`${guildData.step - 1}.${counter++} Creating emoji: ${origEmoji.name}`);
                    await newGuild.emojis.create(origEmoji.url, origEmoji.name);
                }

                return resolve();
            } catch (ex) {
                return reject(ex);
            }
        });
    }
}

module.exports = Creator;
