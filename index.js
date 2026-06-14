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

// --- Database Setup ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ DB Error:', err));

// Define the Model globally in this file
const GuildSchema = new mongoose.Schema({ 
    guildId: { type: String, unique: true }, 
    logChannel: String,
    welcomeMessage: { type: String, default: "Welcome {user} to the server!" },
    goodbyeMessage: { type: String, default: "{user} has left." },
    prefix: { type: String, default: "!" }
});
const Guild = mongoose.model('Guild', GuildSchema);

// --- Middleware & Auth ---
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

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));
passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'https://bloxden-website.onrender.com/callback',
    scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => done(null, profile)));

// --- API Routes ---
app.get('/api/settings/:guildId', async (req, res) => {
    const settings = await Guild.findOne({ guildId: req.params.guildId });
    res.json(settings || {});
});

app.post('/api/settings/:guildId', async (req, res) => {
    await Guild.findOneAndUpdate({ guildId: req.params.guildId }, req.body, { upsert: true, new: true });
    res.json({ success: true });
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Web Dashboard running on ${PORT}`));

// --- BOT INITIALIZATION ---
// We pass the model to the bot to avoid 'OverwriteModelError'
require('./bot.js')(Guild);
