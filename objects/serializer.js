const debug = require('../settings.json').debug;
const fs = require('fs');

class Serializer {
    /**
     * Guild data serialization.
     * 
     * @param  {Client} client Discord Client
     * @param  {string} originalGuildId The id of the original guild
     * @param  {Object} guildData Serialized guild data
     */
    static serializeOldGuild(client, originalGuildId, guildData) {
        return new Promise(async (resolve, reject) => {
            try {
                // check
                let guildToCopy = client.guilds.get(originalGuildId);
                if (!guildToCopy) return reject(new Error('Original guild to copy does not exist. Please check if the id in the settings is correct.'));
                if (!guildToCopy.available) return reject(new Error('Original guild not available. Please try again later.'));

                // general
                console.log(`${guildData.step++}. Serializing general data`);
                guildData.general = await this.getGeneralData(guildToCopy);

                // roles
                console.log(`${guildData.step++}. Serializing role data`);
                guildData.roles = null;
                if (guildToCopy.roles.size > 0) {
                    guildData.roles = await this.serializeRoles(guildToCopy.roles, guildToCopy);
                    if (debug) console.log(`${guildData.step - 1}.1 Serialized ${guildToCopy.roles.size} role${guildToCopy.roles.size > 1 ? 's' : ''}`);
                }

                // categories
                console.log(`${guildData.step++}. Serializing category data`);
                guildData.categories = null;
                let categories = guildToCopy.channels.filter(c => c.type === 'category');
                if (categories.size > 0) {
                    guildData.categories = await this.serializeCategories(categories, guildToCopy);
                    if (debug) console.log(`${guildData.step - 1}.1 Serialized ${categories.size} categor${categories.size > 1 ? 'ies' : 'y'}`);
                }

                // text channel
                console.log(`${guildData.step++}. Serializing text channel data`);
                guildData.textChannel = null;
                let textChannel = guildToCopy.channels.filter(c => c.type === 'text');
                if (textChannel.size > 0) {
                    guildData.textChannel = await this.serializeTextChannels(textChannel, guildToCopy);
                    if (debug) console.log(`${guildData.step - 1}.1 Serialized ${textChannel.size} text channel${textChannel.size > 1 ? 's' : ''}`);
                }

                // voice channel
                console.log(`${guildData.step++}. Serializing voice channel data`);
                guildData.voiceChannel = null;
                let voiceChannel = guildToCopy.channels.filter(c => c.type === 'voice');
                if (voiceChannel.size > 0) {
                    guildData.voiceChannel = await this.serializeVoiceChannels(voiceChannel, guildToCopy);
                    if (debug) console.log(`${guildData.step - 1}.1 Serialized ${voiceChannel.size} voice channel${voiceChannel.size > 1 ? 's' : ''}`);
                }

                // emojis
                console.log(`${guildData.step++}. Serializing emojis`);
                guildData.emojis = null;
                if (guildToCopy.emojis.size > 0) {
                    guildData.emojis = await this.serializeEmojis(guildToCopy.emojis);
                    if (debug) console.log(`${guildData.step - 1}.1 Serialized ${guildToCopy.emojis.size} emoji${guildToCopy.emojis.size > 1 ? 's' : ''}`);
                }

                // save data to file
                console.log(`${guildData.step++}. Saving guild data to file`);
                fs.writeFile('guildData.json', JSON.stringify(guildData), (err) => {
                    if (err) return reject(err);
                    console.log(`${guildData.step++}. Serialization finished and data saved`);
                    return resolve(guildData);
                });
            } catch (ex) {
                return reject(ex);
            }
        });
    }
    /**
     * Serialization of all general data.
     * 
     * @param  {Guild} guild Original guild object
     */
    static getGeneralData(guild) {
        return new Promise((resolve, reject) => {
            try {
                if (!guild.available) return reject(new Error('Guild not available'));
                let general = {
                    name: guild.name,
                    region: guild.region,
                    icon: guild.iconURL({ format: 'png', size: 2048 }),
                    verificationLevel: guild.verificationLevel,
                    defaultRole: {
                        old: guild.defaultRole.id,
                        new: null
                    },
                    afkTimeout: guild.afkTimeout,
                    explicitContentFilter: guild.explicitContentFilter,
                    systemChannel: guild.systemChannelID,
                    afkChannel: guild.afkChannelID
                };
                return resolve(general);
            } catch (ex) {
                return reject(ex);
            }
        });
    }
    /**
     * Role serialization.
     * Managed roles will also be saved.
     * Role collection is first sorted by their position to ensure correct positioning afterwards.
     * 
     * @param  {Collection} roleCollection Collection with roles
     * @param  {Guild} guildToCopy Original guild object
     */
    static serializeRoles(roleCollection, guildToCopy) {
        return new Promise((resolve, reject) => {
            try {
                roleCollection = roleCollection.sort((a, b) => b.position - a.position);

                let roles = {};
                let counter = 0;
                roleCollection.map((role) => {
                    let singleRole = {
                        idOld: role.id,
                        idNew: null,
                        name: role.name,
                        hexColor: role.hexColor,
                        hoist: role.hoist,
                        mentionable: role.mentionable,
                        position: role.position,
                        rawPosition: role.rawPosition,
                        defaultRole: guildToCopy.defaultRole.id === role.id,
                        permBitfield: role.permissions.bitfield
                    };

                    roles[counter++] = singleRole;
                });

                return resolve(roles);
            } catch (ex) {
                return reject(ex);
            }
        });
    }
    /**
     * Category serialization.
     * Only role permission overwrites will be saved.
     * 
     * @param  {Collection} categoryCollection Collection with categories
     * @param  {Guild} guildToCopy Original guild object
     */
    static serializeCategories(categoryCollection, guildToCopy) {
        return new Promise((resolve, reject) => {
            try {
                let categories = {};
                categoryCollection.map((cat) => {
                    let singleCat = {
                        idOld: cat.id,
                        idNew: null,
                        name: cat.name,
                        position: cat.position,
                        rawPosition: cat.rawPosition
                    };

                    singleCat.permOverwrites = [];
                    cat.permissionOverwrites.map((permOver) => {
                        if (permOver.type !== 'role') return;

                        let overwrite = {
                            id: permOver.id,
                            allowed: permOver.allowed.bitfield,
                            denied: permOver.denied.bitfield
                        };
                        singleCat.permOverwrites.push(overwrite);
                    });

                    categories[cat.position] = singleCat;
                });

                return resolve(categories);
            } catch (ex) {
                return reject(ex);
            }
        });
    }
    /**
     * Text channel serialization.
     * Only role permission overwrites will be saved.
     * 
     * @param  {Collection} textChannelCollection Collection with text channels
     * @param  {Guild} guildToCopy Original guild object
     */
    static serializeTextChannels(textChannelCollection, guildToCopy) {
        return new Promise((resolve, reject) => {
            try {
                let textChannel = {};
                textChannelCollection.map((tCh) => {
                    let singleCh = {
                        name: tCh.name,
                        topic: tCh.topic,
                        nsfw: tCh.nsfw,
                        systemChannel: guildToCopy.systemChannelID === tCh.id,
                        position: tCh.position,
                        rawPosition: tCh.rawPosition,
                        parentCat: tCh.parentID,
                        permLocked: tCh.permissionsLocked ? tCh.permissionsLocked : false
                    };

                    if (tCh.permissionsLocked) {
                        textChannel[tCh.rawPosition] = singleCh;
                        return;
                    }

                    singleCh.permOverwrites = [];
                    tCh.permissionOverwrites.map((permOver) => {
                        if (permOver.type !== 'role') return;

                        let overwrite = {
                            id: permOver.id,
                            allowed: permOver.allowed.bitfield,
                            denied: permOver.denied.bitfield
                        };
                        singleCh.permOverwrites.push(overwrite);
                    });

                    textChannel[tCh.rawPosition] = singleCh;
                });

                return resolve(textChannel);
            } catch (ex) {
                return reject(ex);
            }
        });
    }
    /**
     * Voice channel serialization.
     * Only role permission overwrites will be saved.
     * 
     * @param  {Collection} voiceChannelCollection Collection with voice channels
     * @param  {Guild} guildToCopy Original guild object
     */
    static serializeVoiceChannels(voiceChannelCollection, guildToCopy) {
        return new Promise((resolve, reject) => {
            try {
                let voiceChannel = {};
                voiceChannelCollection.map((vCh) => {
                    let singleCh = {
                        name: vCh.name,
                        position: vCh.position,
                        rawPosition: vCh.rawPosition,
                        parentCat: vCh.parentID,
                        bitrate: vCh.bitrate,
                        userLimit: vCh.userLimit,
                        afkChannel: guildToCopy.afkChannelID === vCh.id,
                        permLocked: vCh.permissionsLocked ? vCh.permissionsLocked : false
                    };

                    if (vCh.permissionsLocked) {
                        voiceChannel[vCh.rawPosition] = singleCh;
                        return;
                    }

                    singleCh.permOverwrites = [];
                    vCh.permissionOverwrites.map((permOver) => {
                        if (permOver.type !== 'role') return;

                        let overwrite = {
                            id: permOver.id,
                            allowed: permOver.allowed.bitfield,
                            denied: permOver.denied.bitfield
                        };
                        singleCh.permOverwrites.push(overwrite);
                    });

                    voiceChannel[vCh.rawPosition] = singleCh;
                });

                return resolve(voiceChannel);
            } catch (ex) {
                return reject(ex);
            }
        });
    }
    /**
     * Emoji serialization.
     * 
     * @param  {Collection} emojiCollection Collection with emojis
     */
    static serializeEmojis(emojiCollection) {
        return new Promise((resolve, reject) => {
            try {
                let emojis = {};
                let step = 0;
                emojiCollection.map((emoji) => {
                    let singleEmoji = {
                        name: emoji.name,
                        url: emoji.url
                    };

                    emojis[step++] = singleEmoji;
                });

                return resolve(emojis);
            } catch (ex) {
                return reject(ex);
            }
        });
    }
}

module.exports = Serializer;
