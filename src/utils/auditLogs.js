const { AuditLogEvent } = require('discord.js');

/**
 * Fetches the latest audit log entry for a specific action with a retry mechanism.
 * @param {import('discord.js').Guild} guild 
 * @param {import('discord.js').AuditLogEvent} type 
 * @param {Function} filter - Optional filter for the entry
 * @returns {Promise<import('discord.js').GuildAuditLogsEntry|null>}
 */
async function fetchAuditLog(guild, type, filter = () => true) {
    // Audit logs can take a moment to populate
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        const auditLogs = await guild.fetchAuditLogs({
            limit: 5,
            type: type
        });

        const entry = auditLogs.entries.find(filter) || auditLogs.entries.first();

        // Ensure the entry is recent (within the last 10 seconds)
        if (entry && (Date.now() - entry.createdTimestamp < 10000)) {
            return entry;
        }

        return null;
    } catch (err) {
        console.error('Error fetching audit logs:', err);
        return null;
    }
}

module.exports = { fetchAuditLog };
