const { Events, AuditLogEvent, PermissionsBitField } = require('discord.js');
const { OWNER_IDS } = require('../../config');
const { fetchAuditLog } = require('../utils/auditLogs');
const { logSecurityEvent } = require('../utils/logger');

module.exports = {
    name: Events.GuildRoleUpdate,
    async execute(oldRole, newRole, client) {
        const { guild } = newRole;

        const auditEntry = await fetchAuditLog(guild, AuditLogEvent.RoleUpdate);
        if (!auditEntry) return;

        const { executor } = auditEntry;

        if (executor.id === client.user.id || OWNER_IDS.includes(executor.id)) return;

        // 3️⃣ ADMIN ROLE UPDATE PROTECTION
        const gainedAdmin = !oldRole.permissions.has(PermissionsBitField.Flags.Administrator) &&
            newRole.permissions.has(PermissionsBitField.Flags.Administrator);

        if (gainedAdmin) {
            try {
                const executorMember = await guild.members.fetch(executor.id).catch(() => null);

                // Revert permissions
                await newRole.setPermissions(oldRole.permissions, 'Anti-Nuke: Unauthorized Administrator Permission Update').catch(() => null);

                // Punish executor
                if (executorMember && executorMember.bannable) {
                    await executorMember.ban({ reason: 'Anti-Nuke: Unauthorized Admin Permission Grant' });
                }

                logSecurityEvent(client, {
                    executor: `${executor.tag} (${executor.id})`,
                    target: newRole.name,
                    action: 'Unauthorized Admin Permission Grant',
                    result: 'Banned & Reverted'
                });
            } catch (err) {
                console.error('Error in Role Update Protection (Admin):', err);
            }
            return; // Stop further checks if already punished
        }

        // 7️⃣ PROTECTED ADMIN ROLES
        // If a role already had Administrator and a non-owner tries to modify it (e.g. remove Admin or delete it - delete handled elsewhere)
        // We revert any changes to sensitive permissions
        const protectedPerms = [
            PermissionsBitField.Flags.Administrator,
            PermissionsBitField.Flags.BanMembers,
            PermissionsBitField.Flags.KickMembers,
            PermissionsBitField.Flags.ManageRoles,
            PermissionsBitField.Flags.ManageChannels
        ];

        let needsRevert = false;
        for (const perm of protectedPerms) {
            if (oldRole.permissions.has(perm) && !newRole.permissions.has(perm)) {
                needsRevert = true;
                break;
            }
        }

        if (needsRevert) {
            try {
                const executorMember = await guild.members.fetch(executor.id).catch(() => null);

                await newRole.setPermissions(oldRole.permissions, 'Anti-Nuke: Reverting Protected Role Modification').catch(() => null);

                if (executorMember && executorMember.bannable) {
                    await executorMember.ban({ reason: 'Anti-Nuke: Modification of Protected Role Permissions' });
                }

                logSecurityEvent(client, {
                    executor: `${executor.tag} (${executor.id})`,
                    target: newRole.name,
                    action: 'Modification of Protected Role Permissions',
                    result: 'Banned & Reverted'
                });
            } catch (err) {
                console.error('Error in Role Protection Utility:', err);
            }
        }
    },
};
