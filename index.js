const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const { Strategy: DiscordStrategy } = require('passport-discord');

const app = express();
const PORT = process.env.PORT || 10000;

// --- Session & Passport Setup ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'a-very-random-secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// --- Strategy Configuration ---
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'https://bloxden-website.onrender.com/callback',
    scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

// --- Middleware & Static Files ---
app.use(express.static(path.join(__dirname, 'public')));

// --- Routes ---
// Public Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/terms', (req, res) => res.sendFile(path.join(__dirname, 'public', 'terms.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'privacy.html')));

// Auth Routes
app.get('/login', passport.authenticate('discord'));
app.get('/callback', passport.authenticate('discord', { 
    failureRedirect: '/' 
}), (req, res) => res.redirect('/dashboard'));

app.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
});

// Dashboard & API
app.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/api/servers', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
    
    // Filter servers where user has 'MANAGE_GUILD' (bit 0x20)
    const manageable = req.user.guilds.filter(g => (g.permissions & 0x20) === 0x20);
    res.json(manageable);
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
