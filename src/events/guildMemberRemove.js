const { Events, AuditLogEvent } = require('discord.js');
const { OWNER_IDS } = require('../../config');
const { fetchAuditLog } = require('../utils/auditLogs');
const { runDramaticBan } = require('../utils/punishment');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member, client) {
        const { guild } = member;

        const auditEntry = await fetchAuditLog(guild, AuditLogEvent.MemberKick);
        if (!auditEntry) return;

        const { executor, target } = auditEntry;
        if (target.id !== member.id) return;

        if (executor.id === client.user.id) return;

        // Trigger Dramatic Ban
        try {
            const { SECURITY_LOG_CHANNEL_ID } = require('../../config');
            const channel = await client.channels.fetch(SECURITY_LOG_CHANNEL_ID).catch(() => null);
            const executorMember = await guild.members.fetch(executor.id).catch(() => null);

            if (channel && executorMember) {
                await runDramaticBan(client, channel, executorMember, target.id === client.user.id ? 'Bot' : target.tag, 'Unauthorized Kick');
            }
        } catch (err) {
            console.error('Error in Kick Protection:', err);
        }
    },
};
