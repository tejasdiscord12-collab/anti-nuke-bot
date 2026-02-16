const fs = require('fs');
const path = require('path');

const whitelistPath = path.join(__dirname, '../../whitelist.json');

// Ensure file exists
if (!fs.existsSync(whitelistPath)) {
    fs.writeFileSync(whitelistPath, JSON.stringify([], null, 4));
}

function getWhitelist() {
    try {
        const data = fs.readFileSync(whitelistPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading whitelist:", err);
        return [];
    }
}

function addToWhitelist(id) {
    const list = getWhitelist();
    if (!list.includes(id)) {
        list.push(id);
        saveWhitelist(list);
        return true;
    }
    return false;
}

function removeFromWhitelist(id) {
    const list = getWhitelist();
    const filtered = list.filter(item => item !== id);
    if (filtered.length !== list.length) {
        saveWhitelist(filtered);
        return true;
    }
    return false;
}

function saveWhitelist(list) {
    fs.writeFileSync(whitelistPath, JSON.stringify(list, null, 4));
}

function isWhitelisted(id) {
    return getWhitelist().includes(id);
}

module.exports = {
    getWhitelist,
    addToWhitelist,
    removeFromWhitelist,
    isWhitelisted
};
