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

// --- Database ---
mongoose.connect(process.env.MONGO_URI);
const Guild = mongoose.model('Guild', new mongoose.Schema({ guildId: String, logChannel: String }));

// --- Session & Passport ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'super-secret-key',
    resave: true,
    saveUninitialized: false,
    cookie: { maxAge: 604800000 } // 1 week
}));
app.use(passport.initialize());
app.use(passport.session());

// Admin Middleware: Ensures only users with Administrator permission can access routes
const isAdmin = (req, res, next) => {
    if (!req.isAuthenticated()) return res.redirect('/login');
    const guild = req.user.guilds.find(g => g.id === req.params.guildId);
    if (guild && (guild.permissions & 0x8) === 0x8) next();
    else res.status(403).send('Access Denied: Admin permissions required.');
};

// --- Passport Strategy ---
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));
passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'https://bloxden-website.onrender.com/callback',
    scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => done(null, profile)));

// --- Routes ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/login', passport.authenticate('discord'));
app.get('/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => res.redirect('/dashboard'));

app.get('/api/servers', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    // Filter by Admin permission (0x8)
    res.json(req.user.guilds.filter(g => (g.permissions & 0x8) === 0x8));
});

app.get('/api/channels/:guildId', async (req, res) => {
    try {
        const response = await axios.get(`https://discord.com/api/v10/guilds/${req.params.guildId}/channels`, {
            headers: { Authorization: `Bot ${process.env.TOKEN}` }
        });
        res.json(response.data.filter(c => c.type === 0).map(c => ({ name: c.name, id: c.id })));
    } catch (e) { res.status(500).send(); }
});

app.post('/api/settings/:guildId', async (req, res) => {
    await Guild.findOneAndUpdate({ guildId: req.params.guildId }, { logChannel: req.body.logChannel }, { upsert: true });
    res.send({ success: true });
});

app.get('/manage/:guildId', isAdmin, (req, res) => res.sendFile(path.join(__dirname, 'public', 'manage.html')));
app.listen(PORT, () => console.log(`Running on ${PORT}`));
