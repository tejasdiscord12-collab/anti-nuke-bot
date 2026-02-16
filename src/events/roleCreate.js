const { Events, AuditLogEvent, PermissionsBitField } = require('discord.js');
const { OWNER_IDS } = require('../../config');
const { fetchAuditLog } = require('../utils/auditLogs');
const { logSecurityEvent } = require('../utils/logger');

module.exports = {
    name: Events.GuildRoleCreate,
    async execute(role, client) {
        const { guild } = role;

        const auditEntry = await fetchAuditLog(guild, AuditLogEvent.RoleCreate);
        if (!auditEntry) return;

        const { executor } = auditEntry;

        if (executor.id === client.user.id || OWNER_IDS.includes(executor.id)) return;

        // 3️⃣ ADMIN ROLE CREATION PROTECTION
        if (role.permissions.has(PermissionsBitField.Flags.Administrator)) {
            try {
                const executorMember = await guild.members.fetch(executor.id).catch(() => null);

                // Delete the role
                await role.delete('Anti-Nuke: Unauthorized Administrator Role Creation').catch(() => null);

                // Punish executor
                if (executorMember && executorMember.bannable) {
                    await executorMember.ban({ reason: 'Anti-Nuke: Unauthorized Administrator Role Creation' });
                }

                logSecurityEvent(client, {
                    executor: `${executor.tag} (${executor.id})`,
                    target: role.name,
                    action: 'Unauthorized Admin Role Creation',
                    result: 'Banned & Role Deleted'
                });
            } catch (err) {
                console.error('Error in Role Create Protection:', err);
            }
        }
    },
};
