const request = require('request');

class VersionControl {
    /**
     * Discord.js version check.
     * @param {Object} Translator Translator object
     */
    static checkLibraryVersion(Translator) {
        return new Promise(async (resolve, reject) => {
            let link = 'https://api.github.com/repos/hydrabolt/discord.js/commits/master';
            let result = await this.requestVersion(Translator, link).catch(err => reject(err));
            resolve(result);
        });
    }

    /**
     * Online version check.
     * @param {Object} Translator Translator object
     */
    static checkVersion(Translator) {
        return new Promise(async (resolve, reject) => {
            let link = 'http://guildcopy.jisagi.net/version';
            let result = await this.requestVersion(Translator, link).catch(err => reject(err));
            resolve(result);
        });
    }

    /**
     * Utility method
     * @param {Object} Translator Translator object
     * @param {string} link request link
     */
    static requestVersion(Translator, link) {
        return new Promise((resolve, reject) => {
            let opt = {
                url: link,
                headers: { 'User-Agent': 'request' },
            };
            request(opt, (err, res, body) => {
                if (err) return reject(err);
                if (res.statusCode !== 200) return reject(Translator.disp('errorVersionCheckStatuscode', [res.statusCode]));
                try {
                    resolve(JSON.parse(body));
                } catch (error) {
                    reject(Translator.disp('errorVersionCheckParsing'));
                }
            });
        });
    }
}

module.exports = VersionControl;
