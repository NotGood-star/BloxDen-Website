require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
mongoose.connect(process.env.MONGO_URI);

const Guild = mongoose.model('Guild', new mongoose.Schema({ guildId: String, logChannel: String }));

client.on('guildMemberAdd', async member => {
    const data = await Guild.findOne({ guildId: member.guild.id });
    if (data?.logChannel) {
        const channel = member.guild.channels.cache.get(data.logChannel);
        channel?.send(`Welcome to the server, ${member.user.tag}!`);
    }
});

client.login(process.env.TOKEN);
