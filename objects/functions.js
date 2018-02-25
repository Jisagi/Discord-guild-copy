exports.validateBitrate = origBitrate => {
    if (origBitrate > 96000) return 96000;
    else if (origBitrate < 8000) return 8000;
    else return origBitrate;
};

exports.validateUserLimit = userLimit => {
    if (userLimit < 0) return 0;
    else if (userLimit > 99) return 99;
    else return userLimit;
};

exports.getDateString = () => {
    let date = new Date();
    return `${date.getDate().toString().padStart(2, '0')}.` +
        `${(date.getMonth() + 1).toString().padStart(2, '0')}.` +
        `${date.getFullYear()} ` +
        `${date.getHours().toString().padStart(2, '0')}:` +
        `${date.getMinutes().toString().padStart(2, '0')}:` +
        `${date.getSeconds().toString().padStart(2, '0')}`;
};
