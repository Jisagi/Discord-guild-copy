const request = require('request');

class VersionControl {
    /**
     * Online version check.
     */
    static checkVersion() {
        return new Promise((resolve, reject) => {
            let link = 'http://guildcopy.jisagi.net/version';
            request(link, (err, res, body) => {
                if (err) return reject(err);
                if (res.statusCode !== 200) return reject(`Version check failed: ${res.statusCode}`);
                try {
                    resolve(JSON.parse(body));
                } catch (error) {
                    reject('Version check failed: Failed to parse request');
                }
            });
        });
    }
}

module.exports = VersionControl;
