require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

const Guild = mongoose.model('Guild'); // Uses the model defined in index.js

client.once('ready', () => console.log(`✅ Bot is online as ${client.user.tag}`));

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    const data = await Guild.findOne({ guildId: message.guild.id });
    const prefix = data?.prefix || "!";

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    if (command === 'ping') message.reply('Pong!');
    if (command === 'help') message.reply(`My prefix is ${prefix}. Commands: ping, help.`);
});

client.login(process.env.TOKEN);
