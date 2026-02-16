const { Events, PermissionsBitField } = require('discord.js');
const { OWNER_IDS, SECURITY_LOG_CHANNEL_ID } = require('../../config');
const { runDramaticBan } = require('../utils/punishment');
const { addToWhitelist, removeFromWhitelist, getWhitelist } = require('../utils/whitelistManager');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot) return;
        const prefix = '!';
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // Authorities who can use management commands
        if (!OWNER_IDS.includes(message.author.id)) {
            if (['testkick', 'antinuke', 'give', 'kick'].includes(command)) {
                console.log(`[DEBUG] Blocked unauthorized command '${command}' from user ${message.author.tag} (${message.author.id})`);
                // Optional: Reply to user so they know (can be noisy if abused)
                // return message.reply("❌ You are not authorized to use this command.");
            }
            return;
        }

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

        // !antinuke whitelist <add/remove/list> <user>
        if (command === 'antinuke') {
            const sub = args[0] ? args[0].toLowerCase() : null;
            if (sub === 'whitelist') {
                const action = args[1] ? args[1].toLowerCase() : null;

                if (action === 'list') {
                    const list = getWhitelist();
                    return message.reply(`🛡️ **Whitelisted Users:**\n${list.length > 0 ? list.map(id => `<@${id}>`).join(', ') : 'None'}`);
                }

                const targetUser = message.mentions.users.first() || (args[2] ? await client.users.fetch(args[2]).catch(() => null) : null);
                if (!targetUser) return message.reply("📝 `!antinuke whitelist <add/remove> <@user/ID>`");

                if (action === 'add') {
                    if (addToWhitelist(targetUser.id)) {
                        return message.reply(`✅ Added **${targetUser.tag}** (<@${targetUser.id}>) to whitelist.`);
                    } else {
                        return message.reply(`⚠️ **${targetUser.tag}** is already whitelisted.`);
                    }
                } else if (action === 'remove') {
                    if (removeFromWhitelist(targetUser.id)) {
                        return message.reply(`🗑️ Removed **${targetUser.tag}** from whitelist.`);
                    } else {
                        return message.reply(`⚠️ **${targetUser.tag}** is not in the whitelist.`);
                    }
                } else {
                    return message.reply("📝 `!antinuke whitelist <add/remove/list> [user]`");
                }
            } else {
                return message.reply("📝 `!antinuke whitelist <add/remove/list>`");
            }
        }
    },
};
