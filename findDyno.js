const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once('ready', async () => {
    const guilds = await client.guilds.fetch();
    for (const [id, g] of guilds) {
        const guild = await g.fetch();
        const members = await guild.members.fetch();
        const dyno = members.find(m => m.user.username.toLowerCase().includes('dyno'));
        if (dyno) {
            console.log(`Dyno found in ${guild.name}: ID ${dyno.id}`);
        } else {
            console.log(`Dyno not found in ${guild.name}`);
        }
    }
    process.exit(0);
});

client.login(process.env.TOKEN);
