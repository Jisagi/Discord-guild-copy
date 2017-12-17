const fs = require('fs');
const ser = require('./serializer.js');

class FileHandler {
    /**
     * Checks if serialized data exists and either loads it or starts the guild serialization.
     * Returns the serialized guild data.
     * 
     * @param  {Client} client Discord Client
     * @param  {string} originalGuildId Original guild id
     * @param  {string} newGuildId New guild id
     * @param  {string} newGuildAdminRoleId New guild Administrator role id
     * @param  {Object} data Serialized guild data
     */
    static checkIfDataExists(client, originalGuildId, newGuildId, newGuildAdminRoleId, data) {
        return new Promise((resolve, reject) => {
            try {
                fs.access('guildData.json', fs.constants.R_OK, (err) => {
                    if (err) {
                        // guildData not found
                        ser.serializeOldGuild(client, originalGuildId, data).then((guildData) => {
                            return resolve(guildData);
                        }).catch((ex) => {
                            return reject(ex);
                        });
                    } else {
                        // serialized data found
                        let guildData = require('../guildData.json');
                        guildData.step = data.step;
                        console.log(`${guildData.step++}. Serialized data was found and will be used.`);
                        return resolve(guildData);
                    }
                });
            } catch (ex) {
                return reject(ex);
            }
        });
    }
}

module.exports = FileHandler;
