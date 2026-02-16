const { EmbedBuilder } = require('discord.js');
const { SECURITY_LOG_CHANNEL_ID } = require('../../config');

/**
 * Logs a security event to the specified channel.
 * @param {import('discord.js').Client} client 
 * @param {Object} data
 * @param {string} data.executor - Username + ID of the person who took the action
 * @param {string} [data.target] - Target of the action
 * @param {string} data.action - Description of what was attempted
 * @param {string} data.result - "Banned", "Reverted", "Blocked"
 * @param {number} [data.color] - Embed color
 */
async function logSecurityEvent(client, { executor, target, action, result, color = 0xff0000 }) {
    const channel = client.channels.cache.get(SECURITY_LOG_CHANNEL_ID);
    if (!channel) return console.error(`Security log channel (${SECURITY_LOG_CHANNEL_ID}) not found.`);

    const embed = new EmbedBuilder()
        .setTitle('🛡️ Security Incident Detected')
        .setColor(color)
        .addFields(
            { name: '👤 Executor', value: executor, inline: true },
            { name: '🎯 Target', value: target || 'N/A', inline: true },
            { name: '🛠️ Action Attempted', value: action },
            { name: '📜 Result', value: result, inline: true },
            { name: '⏰ Time (UTC)', value: new Date().toUTCString(), inline: true }
        )
        .setTimestamp();

    try {
        await channel.send({ embeds: [embed] });
    } catch (err) {
        console.error('Failed to send security log:', err);
    }
}

module.exports = { logSecurityEvent };
