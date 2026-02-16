const { Events, AuditLogEvent, ChannelType } = require('discord.js');
const { OWNER_IDS } = require('../../config');
const { fetchAuditLog } = require('../utils/auditLogs');
const { logSecurityEvent } = require('../utils/logger');

module.exports = {
    name: Events.ChannelDelete,
    async execute(channel, client) {
        const { guild } = channel;

        const auditEntry = await fetchAuditLog(guild, AuditLogEvent.ChannelDelete);
        if (!auditEntry) {
            console.log(`[DEBUG] No ChannelDelete audit log found for #${channel.name}`);
            return;
        }

        const { executor } = auditEntry;
        console.log(`[DEBUG] ChannelDelete: Executor=${executor.tag}, Channel=#${channel.name}`);

        if (executor.id === client.user.id || OWNER_IDS.includes(executor.id)) return;

        try {
            const executorMember = await guild.members.fetch(executor.id).catch(() => null);
            if (executorMember && executorMember.bannable) {
                await executorMember.ban({ reason: 'Anti-Nuke: Unauthorized Channel Deletion' });
            } else {
                console.warn(`[WARNING] Bot cannot ban ${executor.tag}. Is the bot's role high enough?`);
            }

            await guild.channels.create({
                name: channel.name,
                type: channel.type,
                topic: channel.topic,
                nsfw: channel.nsfw,
                bitrate: channel.bitrate,
                userLimit: channel.userLimit,
                parent: channel.parentId,
                permissionOverwrites: channel.permissionOverwrites.cache.map(po => ({
                    id: po.id,
                    allow: po.allow.toArray(),
                    deny: po.deny.toArray(),
                    type: po.type
                })),
                rateLimitPerUser: channel.rateLimitPerUser,
                reason: 'Anti-Nuke: Recreating unauthorized deleted channel'
            });

            logSecurityEvent(client, {
                executor: `${executor.tag} (${executor.id})`,
                target: `#${channel.name}`,
                action: 'Unauthorized Channel Deletion',
                result: 'Banned & Recreated'
            });

        } catch (err) {
            console.error('Error in Channel Delete Protection:', err);
        }
    },
};
