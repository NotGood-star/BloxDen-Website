require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ] 
});

// Database Schema (Must match index.js)
const Guild = mongoose.model('Guild', new mongoose.Schema({ 
    guildId: { type: String, unique: true }, 
    logChannel: String,
    welcomeMessage: { type: String, default: "Welcome {user} to the server!" },
    goodbyeMessage: { type: String, default: "{user} has left." },
    prefix: { type: String, default: "!" } // Added Prefix
}));

client.once('ready', () => {
    console.log(`✅ Bot is online as ${client.user.tag}`);
});

// Welcome Event
client.on('guildMemberAdd', async member => {
    const data = await Guild.findOne({ guildId: member.guild.id });
    if (data?.logChannel) {
        const channel = await member.guild.channels.fetch(data.logChannel).catch(() => null);
        if (channel) {
            const msg = data.welcomeMessage.replace('{user}', `<@${member.id}>`);
            channel.send(msg);
        }
    }
});

// Goodbye Event
client.on('guildMemberRemove', async member => {
    const data = await Guild.findOne({ guildId: member.guild.id });
    if (data?.logChannel) {
        const channel = await member.guild.channels.fetch(data.logChannel).catch(() => null);
        if (channel) {
            const msg = data.goodbyeMessage.replace('{user}', member.user.tag);
            channel.send(msg);
        }
    }
});

// Command Handling with Custom Prefix
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    const data = await Guild.findOne({ guildId: message.guild.id });
    const prefix = data?.prefix || "!";

    if (!message.content.startsWith(prefix)) return;

    // Example Command Logic
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    if (command === 'ping') message.reply('Pong!');
});

client.login(process.env.TOKEN);
