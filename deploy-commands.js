const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { TOKEN } = require('./config');

const CLIENT_ID = "1468247330733166841";
const GUILD_ID = "1468248053474398228";

const commands = [
    new SlashCommandBuilder()
        .setName('antinuke')
        .setDescription('Manage Anti-Nuke settings')
        .addSubcommandGroup(group =>
            group
                .setName('whitelist')
                .setDescription('Manage whitelisted users')
                .addSubcommand(sub =>
                    sub
                        .setName('add')
                        .setDescription('Add a user or bot to the whitelist')
                        .addUserOption(option => option.setName('target').setDescription('The user or bot to whitelist').setRequired(true)))
                .addSubcommand(sub =>
                    sub
                        .setName('remove')
                        .setDescription('Remove a user or bot from the whitelist')
                        .addUserOption(option => option.setName('target').setDescription('The user or bot to remove').setRequired(true)))
                .addSubcommand(sub =>
                    sub
                        .setName('list')
                        .setDescription('List all whitelisted users'))
        )
]
    .map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // Deploy to specific guild for instant update
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
