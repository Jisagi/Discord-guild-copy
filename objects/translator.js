const fs = require('fs');
const path = require('path');
const languages = {};
const { language } = require('../settings.json');

exports.loadTranslations = () => {
    return new Promise((resolve, reject) => {
        let files = fs.readdirSync('translations/');
        if (!files.includes('en.json')) return reject(new Error('English translation not found. Please never delete it from the translation folder!'));
        languages['en'] = loadTranslationFile('en.json');
        if (files.indexOf('en.json') > -1) files.splice(files.indexOf('en.json'), 1);

        files = files.filter(file => {
            if (path.extname(file) !== '.json') return false;
            let translationData = loadTranslationFile(file);
            if (!translationData) return false;
            if (!validateTranslation(translationData)) return false;
            languages[translationData.langcode] = translationData;
            return true;
        });

        if (languages.hasOwnProperty(language)) resolve();
        else reject(new Error('Selected language does not exist or is not valid!'));
    });
};

function loadTranslationFile(filename) {
    try {
        let data = fs.readFileSync(path.join('translations/', filename));
        return JSON.parse(data);
    } catch (err) {
        return null;
    }
};

function validateTranslation(translationData) {
    if (!translationData.langcode || !translationData.language || !translationData.author) return false;
    if (translationData.langcode === 'en') return false;
    if (!translationData.text || typeof (translationData.text) !== 'object') return false;

    for (let key in languages['en'].text) {
        if (!translationData.text.hasOwnProperty(key)) return false;
    }

    return true;
};

exports.disp = (textIdentifier, additionalText = []) => {
    return this.displayTranslationText(textIdentifier, additionalText);
}

exports.displayTranslationText = (textIdentifier, additionalText = []) => {
    let text;
    if (!languages[language]) text = languages['en'].text[textIdentifier];
    else text = languages[language].text[textIdentifier];
    for (let i = 1; i <= additionalText.length; i++) {
        text = text.replace(`[@@${i}@@]`, additionalText[i - 1]);
    }
    return text || `translation text not found for ${textIdentifier}`;
};

exports.getLanguage = () => {
    return languages[language];
}
