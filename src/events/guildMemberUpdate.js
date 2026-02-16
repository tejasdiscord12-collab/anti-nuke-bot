const { Events, AuditLogEvent, PermissionsBitField } = require('discord.js');
const { OWNER_IDS } = require('../../config');
const { fetchAuditLog } = require('../utils/auditLogs');
const { logSecurityEvent } = require('../utils/logger');
const { runDramaticBan } = require('../utils/punishment');

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember, client) {
        const { guild } = newMember;

        const auditEntry = await fetchAuditLog(guild, AuditLogEvent.MemberRoleUpdate, (entry) => entry.target.id === newMember.id);
        if (!auditEntry) return;

        const { executor } = auditEntry;

        // 🛡️ TRUSTED EXECUTOR CHECK
        if (executor.id === client.user.id || OWNER_IDS.includes(executor.id)) {
            return;
        }

        // 5️⃣ ROLE REMOVAL PROTECTION (Protect Bot and Owners)
        const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
        if (removedRoles.size > 0 && (newMember.id === client.user.id || OWNER_IDS.includes(newMember.id))) {
            try {
                // Instantly restore roles
                await newMember.roles.add(removedRoles, 'Anti-Nuke: Restoring protected roles').catch(() => null);

                // Start Dramatic Ban
                const { SECURITY_LOG_CHANNEL_ID } = require('../../config');
                const channel = await client.channels.fetch(SECURITY_LOG_CHANNEL_ID).catch(() => null);
                const executorMember = await guild.members.fetch(executor.id).catch(() => null);

                if (channel && executorMember) {
                    await runDramaticBan(client, channel, executorMember, newMember.id === client.user.id ? 'Bot' : 'Owner', 'Unauthorized Role Removal');
                }
            } catch (err) {
                console.error('Error in Role Removal Protection:', err);
            }
            return;
        }

        // 5️⃣ ROLE ADDITION PROTECTION
        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        if (addedRoles.size > 0) {
            try {
                const executorMember = await guild.members.fetch(executor.id).catch(() => null);
                await newMember.roles.remove(addedRoles, 'Anti-Nuke: Unauthorized Role assignment').catch(() => null);
                if (executorMember && executorMember.bannable) {
                    await executorMember.ban({ reason: 'Anti-Nuke: Unauthorized Role Assignment' });
                }
                logSecurityEvent(client, {
                    executor: `${executor.tag} (${executor.id})`,
                    target: `${newMember.user.tag} (${newMember.id})`,
                    action: 'Unauthorized Role Assignment',
                    result: 'Executor Banned & Roles Removed'
                });
            } catch (err) { console.error(err); }
            return;
        }

        // 1️⃣ ADMINISTRATOR PERMISSION PROTECTION
        if (!OWNER_IDS.includes(newMember.id)) {
            const nowAdmin = newMember.permissions.has(PermissionsBitField.Flags.Administrator);
            const wasAdmin = oldMember.permissions.has(PermissionsBitField.Flags.Administrator);
            if (nowAdmin && !wasAdmin) {
                try {
                    const adminRoles = newMember.roles.cache.filter(role => role.permissions.has(PermissionsBitField.Flags.Administrator));
                    await newMember.roles.remove(adminRoles, 'Anti-Nuke: Unauthorized Administrator Permission').catch(() => null);
                    if (newMember.bannable) {
                        await newMember.ban({ reason: 'Anti-Nuke: Gained Unauthorized Administrator Permission' });
                    }
                    logSecurityEvent(client, {
                        executor: `${executor.tag} (${executor.id})`,
                        target: `${newMember.user.tag} (${newMember.id})`,
                        action: 'Unauthorized Admin Gain',
                        result: 'Banned & Roles Removed'
                    });
                } catch (err) { console.error(err); }
            }
        }
    },
};
