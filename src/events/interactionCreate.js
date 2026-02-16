const { Events, EmbedBuilder } = require('discord.js');
const { addToWhitelist, removeFromWhitelist, getWhitelist } = require('../utils/whitelistManager');
const { OWNER_IDS } = require('../../config');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        if (interaction.commandName === 'antinuke') {
            if (!OWNER_IDS.includes(interaction.user.id)) {
                return interaction.reply({ content: '❌ **Access Denied:** Only Bot Owners can manage the whitelist.', ephemeral: true });
            }

            const subcommand = interaction.options.getSubcommand();
            const group = interaction.options.getSubcommandGroup();

            if (group === 'whitelist') {
                if (subcommand === 'list') {
                    const list = getWhitelist();
                    const embed = new EmbedBuilder()
                        .setTitle('🛡️ Whitelisted Operators')
                        .setDescription(list.length > 0 ? list.map(id => `• <@${id}> \`[${id}]\``).join('\n') : 'No users whitelisted.')
                        .setColor(0x00ff00)
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                const target = interaction.options.getUser('target');
                if (!target) return interaction.reply({ content: '❌ Invalid target.', ephemeral: true });

                if (subcommand === 'add') {
                    if (addToWhitelist(target.id)) {
                        return interaction.reply({ content: `✅ **<@${target.id}>** has been added to the whitelist.`, ephemeral: true });
                    } else {
                        return interaction.reply({ content: `⚠️ **<@${target.id}>** is already whitelisted.`, ephemeral: true });
                    }
                } else if (subcommand === 'remove') {
                    if (removeFromWhitelist(target.id)) {
                        return interaction.reply({ content: `🗑️ **<@${target.id}>** has been removed from the whitelist.`, ephemeral: true });
                    } else {
                        return interaction.reply({ content: `⚠️ **<@${target.id}>** was not in the whitelist.`, ephemeral: true });
                    }
                }
            }
        }
    }
};
