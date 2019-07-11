exports.validateBitrate = (origBitrate = 64000, premiumTier = 0) => {
    switch (premiumTier) {
        case 0:
            return origBitrate > 96000 ? 96000 : origBitrate < 8000 ? 8000 : origBitrate;
        case 1:
            return origBitrate > 128000 ? 128000 : origBitrate < 8000 ? 8000 : origBitrate;
        case 2:
            return origBitrate > 256000 ? 256000 : origBitrate < 8000 ? 8000 : origBitrate;
        case 3:
            return origBitrate > 384000 ? 384000 : origBitrate < 8000 ? 8000 : origBitrate;
    }
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
