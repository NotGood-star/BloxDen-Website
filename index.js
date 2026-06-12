const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const { Strategy: DiscordStrategy } = require('passport-discord');

const app = express();
const PORT = process.env.PORT || 10000;

// 1. Session Setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'super-secret-key',
    resave: false,
    saveUninitialized: false
}));

// 2. Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// 3. Define Strategy (MUST be before routes)
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

// 4. Static Files
app.use(express.static(path.join(__dirname, 'public')));

// 5. Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/terms', (req, res) => res.sendFile(path.join(__dirname, 'public', 'terms.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'privacy.html')));

// 6. Auth Routes
app.get('/login', passport.authenticate('discord'));
app.get('/callback', passport.authenticate('discord', { 
    failureRedirect: '/' 
}), (req, res) => res.redirect('/dashboard'));

app.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
