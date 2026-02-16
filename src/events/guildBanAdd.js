const { Events, AuditLogEvent, PermissionsBitField } = require('discord.js');
const { OWNER_IDS, MASS_BAN_LIMIT, MASS_BAN_TIME_WINDOW } = require('../../config');
const { fetchAuditLog } = require('../utils/auditLogs');
const { logSecurityEvent } = require('../utils/logger');

// Store ban counts: { executorId: [timestamp1, timestamp2, ...] }
const banTracker = new Map();

module.exports = {
    name: Events.GuildBanAdd,
    async execute(ban, client) {
        const { guild } = ban;

        // Fetch audit logs to find executor
        const auditEntry = await fetchAuditLog(guild, AuditLogEvent.MemberBanAdd);
        if (!auditEntry) return;

        const { executor, target } = auditEntry;

        // Ignore if executor is bot itself or an owner
        if (executor.id === client.user.id || OWNER_IDS.includes(executor.id)) return;

        // 6️⃣ ANTI-BAN PROTECTION: Only owners can ban
        // If they reach here, they aren't owners. Immediately ban the executor and notify.
        try {
            const executorMember = await guild.members.fetch(executor.id).catch(() => null);

            // Revert action (unban the target if possible)
            await guild.members.unban(target.id, 'Anti-Nuke: Unauthorized Ban Reversion').catch(() => null);

            // Punish executor
            if (executorMember && executorMember.bannable) {
                await executorMember.ban({ reason: 'Anti-Nuke: Unauthorized Ban Attempt' });
            }

            logSecurityEvent(client, {
                executor: `${executor.tag} (${executor.id})`,
                target: `${target.tag} (${target.id})`,
                action: 'Unauthorized Ban Attempt',
                result: 'Banned & Reverted'
            });

        } catch (err) {
            console.error('Error in Anti-Ban Protection:', err);
        }

        // 5️⃣ MASS BAN PROTECTION
        const now = Date.now();
        if (!banTracker.has(executor.id)) {
            banTracker.set(executor.id, []);
        }

        const timestamps = banTracker.get(executor.id);
        // Filter out timestamps outside the window
        const recentBans = timestamps.filter(time => now - time < MASS_BAN_TIME_WINDOW);
        recentBans.push(now);
        banTracker.set(executor.id, recentBans);

        if (recentBans.length > MASS_BAN_LIMIT) {
            try {
                const executorMember = await guild.members.fetch(executor.id).catch(() => null);
                if (executorMember && executorMember.bannable) {
                    await executorMember.ban({ reason: 'Anti-Nuke: Mass Ban Attempt' });
                }

                logSecurityEvent(client, {
                    executor: `${executor.tag} (${executor.id})`,
                    target: 'Multiple Members',
                    action: 'Mass Ban Attempt Detected',
                    result: 'Banned'
                });
            } catch (err) {
                console.error('Error in Mass Ban Protection:', err);
            }
        }
    },
};
