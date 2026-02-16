const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildModeration]
});

client.once('ready', async () => {
    const guilds = await client.guilds.fetch();
    for (const [id, g] of guilds) {
        const guild = await g.fetch();
        const bans = await guild.bans.fetch();
        const dynoBan = bans.find(b => b.user.username.toLowerCase().includes('dyno'));
        if (dynoBan) {
            console.log(`Dyno BAN found in ${guild.name}: ID ${dynoBan.user.id}, Reason: ${dynoBan.reason}`);
        } else {
            console.log(`Dyno BAN not found in ${guild.name}`);
        }
    }
    process.exit(0);
});

client.login(process.env.TOKEN);
