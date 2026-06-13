require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const { Strategy: DiscordStrategy } = require('passport-discord');
const axios = require('axios');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 10000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);
const Guild = mongoose.model('Guild', new mongoose.Schema({ guildId: String, logChannel: String }));

// Session Setup
app.use(session({ secret: 'super-secret-key', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Passport Config
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));
passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'https://bloxden-website.onrender.com/callback',
    scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => done(null, profile)));

// Routes
app.get('/login', passport.authenticate('discord'));
app.get('/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => res.redirect('/dashboard'));
app.get('/dashboard', (req, res) => req.isAuthenticated() ? res.sendFile(path.join(__dirname, 'public', 'dashboard.html')) : res.redirect('/login'));

// API: Fetch Channels
app.get('/api/channels/:guildId', async (req, res) => {
    try {
        const response = await axios.get(`https://discord.com/api/v10/guilds/${req.params.guildId}/channels`, {
            headers: { Authorization: `Bot ${process.env.TOKEN}` }
        });
        res.json(response.data.filter(c => c.type === 0).map(c => ({ name: c.name, id: c.id })));
    } catch (e) { res.status(500).send(); }
});

// API: Save Settings
app.post('/api/settings/:guildId', async (req, res) => {
    await Guild.findOneAndUpdate({ guildId: req.params.guildId }, { logChannel: req.body.logChannel }, { upsert: true });
    res.send({ success: true });
});

app.get('/manage/:guildId', (req, res) => req.isAuthenticated() ? res.sendFile(path.join(__dirname, 'public', 'manage.html')) : res.redirect('/login'));
app.listen(PORT, () => console.log(`🚀 Web Dashboard running on ${PORT}`));
