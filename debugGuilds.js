const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
    console.log('--- BOT GUILDS ---');
    const guilds = await client.guilds.fetch();
    console.log(`Total Guilds: ${guilds.size}`);
    guilds.forEach(guild => {
        console.log(`Guild: ${guild.name} (${guild.id})`);
    });
    process.exit(0);
});

client.login(process.env.TOKEN);
