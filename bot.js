require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { Guild } = require('./index.js'); // Import from index.js

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ] 
});

client.once('ready', () => console.log(`✅ Bot is online as ${client.user.tag}`));

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    const data = await Guild.findOne({ guildId: message.guild.id });
    const prefix = data?.prefix || "!";

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    if (command === 'ping') message.reply(`Pong! My prefix is ${prefix}`);
});

client.login(process.env.TOKEN);
