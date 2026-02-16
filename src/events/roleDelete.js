const { Events, AuditLogEvent, PermissionsBitField } = require('discord.js');
const { OWNER_IDS } = require('../../config');
const { fetchAuditLog } = require('../utils/auditLogs');
const { logSecurityEvent } = require('../utils/logger');
const { runDramaticBan } = require('../utils/punishment');

module.exports = {
    name: Events.RoleDelete,
    async execute(role, client) {
        const { guild } = role;

        console.log(`[DEBUG] roleDelete event triggered for @${role.name}`);

        // Fetch Audit logs to find executor
        const auditEntry = await fetchAuditLog(guild, AuditLogEvent.RoleDelete);
        if (!auditEntry) {
            console.log(`[DEBUG] No RoleDelete audit log found for @${role.name} after delay.`);
            return;
        }

        const { executor } = auditEntry;
        console.log(`[DEBUG] RoleDelete: Executor=${executor.tag} (${executor.id}), Role=@${role.name}`);

        // Ignore if executor is bot or authorized owner
        if (executor.id === client.user.id || OWNER_IDS.includes(executor.id)) {
            console.log(`[DEBUG] Authorized executor ${executor.tag} deleted role. Skipping.`);
            return;
        }

        // ROLE DELETE PROTECTION
        try {
            // RESTORE THE ROLE
            console.log(`[DEBUG] Attempting to restore role @${role.name}...`);

            // Log role info for debugging
            console.log(`[DEBUG] Role Data: Name=${role.name}, Color=${role.color}, Hoist=${role.hoist}, Permissions=${role.permissions.bitfield}`);

            const restoredRole = await guild.roles.create({
                name: role.name,
                color: role.color,
                hoist: role.hoist,
                permissions: role.permissions.bitfield, // Use bitfield directly
                mentionable: role.mentionable,
                reason: 'Anti-Nuke: Restoring unauthorized role deletion'
            }).catch(err => {
                console.error(`[ERROR] Failed to restore role @${role.name}:`, err);
                return null;
            });

            if (restoredRole) {
                console.log(`[DEBUG] Successfully restored role @${role.name}. New ID: ${restoredRole.id}`);

                // Try to set position as close as possible
                try {
                    const myHighest = guild.members.me.roles.highest.position;
                    if (role.position < myHighest) {
                        await restoredRole.setPosition(role.position).catch(e => console.error("[DEBUG] Could not set position:", e.message));
                    } else {
                        console.log(`[DEBUG] Cannot set position to ${role.position}, bot highest is ${myHighest}`);
                    }
                } catch (e) { /* ignore position errors */ }
            }

            const { SECURITY_LOG_CHANNEL_ID } = require('../../config');
            const channel = await client.channels.fetch(SECURITY_LOG_CHANNEL_ID).catch(() => null);
            const executorMember = await guild.members.fetch(executor.id).catch(() => null);

            if (channel && executorMember) {
                // Use the dramatic countdown for role deletion too!
                await runDramaticBan(client, channel, executorMember, `@${role.name}${restoredRole ? ' (Restored)' : ''}`, 'Unauthorized Role Deletion');
            } else if (executorMember && executorMember.bannable) {
                // Fallback: Just ban immediately if channel is missing
                await executorMember.ban({ reason: `Anti-Nuke: Unauthorized Role Deletion (@${role.name})` });
            }

            logSecurityEvent(client, {
                executor: `${executor.tag} (${executor.id})`,
                target: `@${role.name}`,
                action: 'Unauthorized Role Deletion',
                result: `Executor Banned & Role ${restoredRole ? 'Restored' : 'Not Restored'}`
            });

        } catch (err) {
            console.error('Error in Role Delete Protection:', err);
        }
    },
};
