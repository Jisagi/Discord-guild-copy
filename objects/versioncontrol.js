const http = require('http');

class VersionControl {
    /**
     * Online version check.
     * Only outdated versions will stop script execution.
     * @param {String} localVersion local script version
     */
    static checkVersion(localVersion) {
        return new Promise((resolve, reject) => {
            let link = 'http://guildcopy.jisagi.net/version';
            http.get(link, res => {
                if (res.statusCode !== 200) return reject(`Version check failed: ${res.statusCode}`);

                let raw = '';
                res.on('data', ch => { raw += ch; });
                res.on('end', () => {
                    try {
                        let parsed = JSON.parse(raw);
                        resolve(parsed);
                    } catch (e) {
                        reject('Version check failed: Failed to parse request');
                    }
                });
            }).on('error', err => {
                reject(`Version check failed: ${err.message}`);
            });
        });
    }
}

module.exports = VersionControl;
