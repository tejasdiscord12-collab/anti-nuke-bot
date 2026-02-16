const { Events, AuditLogEvent } = require('discord.js');
const { OWNER_IDS, MASS_CHANNEL_LIMIT, MASS_CHANNEL_WINDOW, SECURITY_LOG_CHANNEL_ID } = require('../../config');
const { fetchAuditLog } = require('../utils/auditLogs');
const { logSecurityEvent } = require('../utils/logger');
const { runDramaticBan } = require('../utils/punishment');

// Store channel creation counts: { executorId: [timestamp1, timestamp2, ...] }
const creationTracker = new Map();

module.exports = {
    name: Events.ChannelCreate,
    async execute(channel, client) {
        const { guild } = channel;

        // Fetch audit logs to find executor
        const auditEntry = await fetchAuditLog(guild, AuditLogEvent.ChannelCreate);
        if (!auditEntry) return;

        const { executor } = auditEntry;

        // Ignore if executor is bot itself or an owner
        if (executor.id === client.user.id || OWNER_IDS.includes(executor.id)) return;

        // MASS CHANNEL CREATION PROTECTION
        const now = Date.now();
        if (!creationTracker.has(executor.id)) {
            creationTracker.set(executor.id, []);
        }

        const timestamps = creationTracker.get(executor.id);
        // Filter out timestamps outside the window
        const recentCreations = timestamps.filter(time => now - time < MASS_CHANNEL_WINDOW);
        recentCreations.push(now);
        creationTracker.set(executor.id, recentCreations);

        if (recentCreations.length > MASS_CHANNEL_LIMIT) {
            try {
                const logChannel = await client.channels.fetch(SECURITY_LOG_CHANNEL_ID).catch(() => null);
                const executorMember = await guild.members.fetch(executor.id).catch(() => null);

                if (logChannel && executorMember) {
                    // Trigger Dramatic Ban for spamming channels
                    await runDramaticBan(client, logChannel, executorMember, 'Multiple Channels', 'Mass Channel Creation Spam');
                } else if (executorMember && executorMember.bannable) {
                    await executorMember.ban({ reason: 'Anti-Nuke: Mass Channel Creation Spam' });
                }

                logSecurityEvent(client, {
                    executor: `${executor.tag} (${executor.id})`,
                    target: 'Multiple Channels',
                    action: 'Mass Channel Creation (Spam)',
                    result: 'Executor Banned'
                });

            } catch (err) {
                console.error('Error in Mass Channel Protection:', err);
            }
        }
    },
};
