const request = require('request');

class VersionControl {
    /**
     * Online version check.
     * @param {Object} translator Translator object
     */
    static checkVersion(Translator) {
        return new Promise((resolve, reject) => {
            let link = 'http://guildcopy.jisagi.net/version';
            request(link, (err, res, body) => {
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
