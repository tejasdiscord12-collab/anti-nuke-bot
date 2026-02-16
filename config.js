require('dotenv').config();

module.exports = {
    // Trusted IDs (Users and Bots) who are exempt from all protections
    OWNER_IDS: [
        "1354711532340252814",
        "1047888722558988350",
        "155149108183695360", // Dyno Bot ID
        "1178219142650798160",
        "1056526808994021407"
    ],
    SECURITY_LOG_CHANNEL_ID: process.env.SECURITY_LOG_CHANNEL_ID || "LOG_CHANNEL_ID",
    SECONDARY_LOG_CHANNEL_ID: "1468170798295679017",
    TOKEN: process.env.TOKEN,

    MASS_BAN_LIMIT: 3,
    MASS_BAN_TIME_WINDOW: 10000, // 10 seconds in ms

    MASS_CHANNEL_LIMIT: 5,
    MASS_CHANNEL_WINDOW: 60000, // 1 minute in ms

    PROTECTED_PERMISSIONS: [
        "Administrator",
        "BanMembers",
        "KickMembers",
        "ManageRoles",
        "ManageChannels"
    ]
};
