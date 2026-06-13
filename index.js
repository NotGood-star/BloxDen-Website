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

// --- 1. Database & Session ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ DB Error:', err));

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

// --- 2. Passport Config ---
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));
passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'https://bloxden-website.onrender.com/callback',
    scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => done(null, profile)));

// --- 3. Authentication Routes ---
app.get('/login', passport.authenticate('discord'));
app.get('/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => res.redirect('/dashboard'));
app.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
});

// --- 4. API Routes ---
app.get('/api/user', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    res.json(req.user);
});

app.get('/api/servers', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    // Filter by Administrator permission (0x8)
    res.json(req.user.guilds.filter(g => (g.permissions & 0x8) === 0x8));
});

// --- 5. Page Routes ---
app.get('/dashboard', (req, res) => req.isAuthenticated() ? res.sendFile(path.join(__dirname, 'public', 'dashboard.html')) : res.redirect('/login'));

app.listen(PORT, () => console.log(`🚀 Web Dashboard running on ${PORT}`));
