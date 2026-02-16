const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
    console.log('--- AVAILABLE GUILDS AND CHANNELS ---');
    const guilds = await client.guilds.fetch();
    for (const [guildId, guildBase] of guilds) {
        const guild = await guildBase.fetch();
        console.log(`Guild: ${guild.name} (${guild.id})`);
        const channels = await guild.channels.fetch();
        channels.forEach(channel => {
            if (channel.type === 0) { // Text channels
                console.log(`  # ${channel.name} - ID: ${channel.id}`);
            }
        });
    }
    process.exit(0);
});

client.login(process.env.TOKEN);
