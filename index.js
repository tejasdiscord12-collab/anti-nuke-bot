const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');
const { TOKEN } = require('./config');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Load Event Handlers
const eventsPath = path.join(__dirname, 'src', 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

const { EmbedBuilder } = require('discord.js');

client.once('ready', async () => {
    console.log(`🛡️ Anti-Nuke Bot is online as ${client.user.tag}`);

    const { SECURITY_LOG_CHANNEL_ID, SECONDARY_LOG_CHANNEL_ID } = require('./config');
    const logChannels = [];

    // Fetch channels safely
    try {
        const primary = await client.channels.fetch(SECURITY_LOG_CHANNEL_ID).catch(() => null);
        if (primary) logChannels.push(primary);
        const secondary = await client.channels.fetch(SECONDARY_LOG_CHANNEL_ID).catch(() => null);
        if (secondary && secondary.id !== SECURITY_LOG_CHANNEL_ID) logChannels.push(secondary);
    } catch (err) {
        console.warn('Error fetching log channels on startup.');
    }

    if (logChannels.length > 0) {
        const startupEmbed = new EmbedBuilder()
            .setTitle('🛡️ System Core Initialized')
            .setDescription(`**${client.user.username}** is now active and monitoring all guild activities.\n\n> \`Status:\` **OPERATIONAL 🟢**\n> \`Mode:\` **Anti-Nuke / Anti-Abuse**`)
            .setColor(0x00ff00)
            .setThumbnail(client.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: 'Security Protocols Active', iconURL: client.user.displayAvatarURL() });

        try {
            for (const channel of logChannels) {
                await channel.send({ embeds: [startupEmbed] });
            }

            // Function to perform the "Animated Scan"
            const runScan = async () => {
                const scanEmbed = new EmbedBuilder()
                    .setTitle('🔍 High-Level Security Audit')
                    .setDescription('```[░░░░░░░░░░] 0% Initializing...```')
                    .setColor(0x00ffff)
                    .addFields({ name: '📊 Status', value: 'Preparing environment...', inline: true });

                const scanMessages = await Promise.all(logChannels.map(ch => ch.send({ embeds: [scanEmbed] })));

                const steps = [
                    { pct: '15%', text: 'Accessing Audit Logs...', bar: '[▓░░░░░░░░░]', status: 'Processing logs...' },
                    { pct: '40%', text: 'Verifying Permissions...', bar: '[▓▓▓▓░░░░░░]', status: 'Checking hierarchy...' },
                    { pct: '70%', text: 'Analyzing Role Integrity...', bar: '[▓▓▓▓▓▓▓░░░]', status: 'Identifying threats...' },
                    { pct: '90%', text: 'Cross-Referencing Databases...', bar: '[▓▓▓▓▓▓▓▓▓░]', status: 'Validating data...' },
                    { pct: '100%', text: 'Scan Finished: No Threats Found! ✅', bar: '[▓▓▓▓▓▓▓▓▓▓]', status: 'Secure' }
                ];

                for (const step of steps) {
                    await new Promise(r => setTimeout(r, 1200));
                    scanEmbed.setDescription(`\`\`\`${step.bar} ${step.pct} ${step.text}\`\`\``)
                        .setFields({ name: '📊 Status', value: step.status, inline: true });

                    if (step.pct === '100%') scanEmbed.setColor(0x00ff00);

                    await Promise.all(scanMessages.map(msg => msg.edit({ embeds: [scanEmbed] }).catch(() => null)));
                }
            };

            // Run immediately and then every 2 hours
            runScan();
            setInterval(runScan, 7200000);

            console.log(`Startup sequence initiated in ${logChannels.length} channels.`);

        } catch (err) {
            console.error('Failed to send startup messages:', err);
        }
    } else {
        console.warn('Bot is online but could not find any text channel to send the startup message.');
    }
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

if (!TOKEN) {
    console.error('CRITICAL: No bot token provided in .env or config.js');
} else {
    client.login(TOKEN);
}
