const { logSecurityEvent } = require('./logger');
const { OWNER_IDS, SECURITY_LOG_CHANNEL_ID, SECONDARY_LOG_CHANNEL_ID } = require('../../config');
const { isWhitelisted } = require('./whitelistManager');
const { EmbedBuilder } = require('discord.js');

/**
 * Runs a dramatic 15-second warning sequence and then bans the executor.
 * @param {import('discord.js').Client} client 
 * @param {import('discord.js').TextChannel} primaryChannel 
 * @param {import('discord.js').GuildMember} executorMember 
 * @param {string} targetLabel - Label for what was targeted (e.g., 'Bot', 'Owner')
 * @param {string} actionLabel - Label for the action (e.g., 'Attempted Kick')
 */
async function runDramaticBan(client, primaryChannel, executorMember, targetLabel, actionLabel) {
    if (!executorMember) return;

    // Resolve Channels
    const channels = [];
    if (primaryChannel) channels.push(primaryChannel);

    try {
        const secondary = await client.channels.fetch(SECONDARY_LOG_CHANNEL_ID).catch(() => null);
        if (secondary && (!primaryChannel || secondary.id !== primaryChannel.id)) {
            channels.push(secondary);
        }
    } catch (err) { /* ignore */ }

    if (channels.length === 0) return;

    try {
        const alertEmbed = new EmbedBuilder()
            .setTitle('🚨 CRITICAL SECURITY BREACH 🚨')
            .setDescription(`**Unauthorized action detected by <@${executorMember.id}>!**\n\n> \`Action:\` ${actionLabel}\n> \`Target:\` ${targetLabel}`)
            .setColor(0xff0000)
            .addFields(
                { name: '⛓️ Status', value: 'Preparing Lockdown...', inline: true },
                { name: '⏳ Timer', value: '15 seconds remains', inline: true }
            )
            .setTimestamp();

        const warnMessages = await Promise.all(channels.map(ch => ch.send({
            content: `🛑 <@${executorMember.id}> **TERMINATION SEQUENCE INITIATED**`,
            embeds: [alertEmbed]
        }).catch(() => null)));

        // 15 Second Countdown
        for (let i = 15; i > 0; i--) {
            const progress = i > 10 ? '░░░░░░░░░░' : i > 5 ? '▓▓▓▓▓░░░░░' : '▓▓▓▓▓▓▓▓▓▓';
            alertEmbed.setFields(
                { name: '⛓️ Status', value: `\`Banning user ${progress}\``, inline: true },
                { name: '⏳ Timer', value: `**${i} seconds** remains`, inline: true }
            );

            if (i <= 5) alertEmbed.setTitle('💣 FINAL WARNING 💣');

            await Promise.all(warnMessages.map(msg => msg ? msg.edit({ embeds: [alertEmbed] }).catch(() => null) : null));
            await new Promise(r => setTimeout(r, 1000));
        }

        // Final Safety Check: Don't ban owners or whitelisted users!
        if (OWNER_IDS.includes(executorMember.id) || isWhitelisted(executorMember.id)) {
            alertEmbed.setTitle('🛡️ SECURITY BYPASS DETECTED 🛡️')
                .setDescription(`**System recognized <@${executorMember.id}> as a trusted operator.**\n\n> \`Result:\` **BAN ABORTER**\n> \`Message:\` Welcome back, Commander.`)
                .setColor(0x00ff00)
                .setFields({ name: '🔐 Access', value: '`OWNER PERMISSIONS GRANTED`', inline: false });

            await Promise.all(warnMessages.map(msg => msg ? msg.edit({
                content: '✅ **LOCKDOWN ABORTED: AUTHORIZED USER**',
                embeds: [alertEmbed]
            }).catch(() => null) : null));
            console.log(`[DEBUG] Skipped ban for owner ${executorMember.user.tag} (Simulation/Safety).`);
            return;
        }

        alertEmbed.setTitle('💥 TERMINATION COMPLETE 💥')
            .setDescription(`**Executor <@${executorMember.id}> has been permanently removed from the server.**`)
            .setColor(0x313338) // Dark grey for "dead" status
            .setFields({ name: '🛰️ Logs', value: '`Incident recorded in central database.`', inline: false });

        await Promise.all(warnMessages.map(msg => msg ? msg.edit({
            content: '💀 **NUKER ELIMINATED**',
            embeds: [alertEmbed]
        }).catch(() => null) : null));

        // Perform the ban
        if (executorMember.bannable) {
            await executorMember.ban({ reason: `Anti-Nuke: ${actionLabel} on ${targetLabel}` });
        }

        logSecurityEvent(client, {
            executor: `${executorMember.user.tag} (${executorMember.id})`,
            target: targetLabel,
            action: actionLabel,
            result: 'Executor Banned after 15s Warning'
        });

    } catch (err) {
        console.error('Error in Dramatic Ban Sequence:', err);
    }
}

module.exports = { runDramaticBan };
