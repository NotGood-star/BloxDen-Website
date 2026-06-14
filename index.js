require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const { Strategy: DiscordStrategy } = require('passport-discord');
const axios = require('axios');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');

const app = express();
const PORT = process.env.PORT || 10000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ DB Error:', err));

// Define Schema and Model
const guildSchema = new mongoose.Schema({ 
    guildId: { type: String, unique: true }, 
    logChannel: String,
    welcomeMessage: { type: String, default: "Welcome {user} to the server!" },
    goodbyeMessage: { type: String, default: "{user} has left." },
    prefix: { type: String, default: "!" }
});

const Guild = mongoose.model('Guild', guildSchema);
module.exports = { Guild }; // Exporting the model

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/login', passport.authenticate('discord'));
app.get('/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => res.redirect('/dashboard'));
app.get('/api/channels/:guildId', async (req, res) => {
    try {
        const response = await axios.get(`https://discord.com/api/v10/guilds/${req.params.guildId}/channels`, { headers: { Authorization: `Bot ${process.env.TOKEN}` } });
        res.json(response.data.filter(c => c.type === 0).map(c => ({ name: c.name, id: c.id })));
    } catch (e) { res.status(500).send(); }
});

app.get('/api/settings/:guildId', async (req, res) => {
    const settings = await Guild.findOne({ guildId: req.params.guildId });
    res.json(settings || {});
});

app.post('/api/settings/:guildId', async (req, res) => {
    await Guild.findOneAndUpdate({ guildId: req.params.guildId }, req.body, { upsert: true, new: true });
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`🚀 Web Dashboard running on ${PORT}`));

// Start Bot
require('./bot.js');
