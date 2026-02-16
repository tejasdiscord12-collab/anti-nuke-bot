const { Events, PermissionsBitField } = require('discord.js');
const { OWNER_IDS, SECURITY_LOG_CHANNEL_ID } = require('../../config');
const { runDramaticBan } = require('../utils/punishment');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot) return;
        const prefix = '!';
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // Authorities who can use management commands
        if (!OWNER_IDS.includes(message.author.id)) return;

        if (command === 'give') {
            const targetUser = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
            const targetRole = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
            if (!targetUser || !targetRole) return message.reply("📝 `!give <@user> <@role>`");

            try {
                if (targetRole.position >= message.guild.members.me.roles.highest.position) return message.reply("❌ Move my role higher!");
                await targetUser.roles.add(targetRole, `Authorized by ${message.author.tag}`);
                return message.reply(`✅ Gave **${targetRole.name}** to **${targetUser.user.tag}**.`);
            } catch (err) { return message.reply("❌ Failed."); }
        }

        if (command === 'kick') {
            const targetUser = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
            if (!targetUser) return message.reply("📝 `!kick <@user>`");
            if (!targetUser.kickable) return message.reply("❌ I cannot kick them.");
            try {
                await targetUser.kick(`Authorized by ${message.author.tag}`);
                return message.reply(`✅ Kicked **${targetUser.user.tag}**.`);
            } catch (err) { return message.reply("❌ Failed."); }
        }

        // !testkick <@user> - Simulates a nuke attempt and triggers the dramatic ban sequence
        if (command === 'testkick') {
            const targetMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
            if (!targetMember) return message.reply("📝 `!testkick <@user>` (This will ban the user after a 15s warning!)");

            if (!targetMember.bannable) {
                return message.reply("❌ I cannot ban this person (Role hierarchy). I cannot test the sequence on them.");
            }

            const logChannel = await client.channels.fetch(SECURITY_LOG_CHANNEL_ID).catch(() => null);
            if (!logChannel) return message.reply("❌ Security log channel not found.");

            message.reply(`🚀 **Starting Simulation...** Triggering 15s countdown ban for **${targetMember.user.tag}**.`);

            // Run the dramatic ban sequence on the target member
            await runDramaticBan(client, logChannel, targetMember, 'Test Simulation', 'Manual Test Kick');
        }
    },
};
