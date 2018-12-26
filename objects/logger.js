const fs = require('fs');
const { output, debug } = require('../settings.json');
const { getDateString } = require('./functions');
const logFolder = 'logs/';

class Logger {
    static logMessage(message) {
        try {
            if (output === 'all') console.log(message);
            if (!fs.existsSync(logFolder)) fs.mkdirSync(logFolder);
            fs.appendFileSync(`${logFolder}/log.log`, `[${getDateString()}] ${message}\n`);
        } catch (err) {
            console.error(`Logging Error: ${err.stack || err.message}`);
        }
    }

    static logError(error) {
        try {
            if (output === 'all' || output === 'error') console.error(debug ? error.stack || error : error.message || error);
            if (!fs.existsSync(logFolder)) fs.mkdirSync(logFolder);
            fs.appendFileSync(`${logFolder}/errors.log`, `[${getDateString()}] ${error.stack || error.message || error}\n`);
        } catch (err) {
            console.error(`Logging Error: ${err.stack || err.message}`);
        }
    }
}

module.exports = Logger;
