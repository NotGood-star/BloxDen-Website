const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');
const app = express();

const port = process.env.PORT || 10000;

app.use(session({
    secret: process.env.SESSION_SECRET || 'a-very-secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, 'public')));

// Login Route
app.get('/login', (req, res) => {
    const clientId = '1507972003481784421';
    const redirectUri = 'https://bloxden-website.onrender.com/api/auth/callback/discord';
    const scope = 'identify guilds';
    
    const authUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
    
    res.redirect(authUrl);
});

// Callback Route
app.get('/api/auth/callback/discord', async (req, res) => {
    const { code } = req.query;

    if (!code) return res.status(400).send('No code provided.');

    try {
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: '1507972003481784421',
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: 'https://bloxden-website.onrender.com/api/auth/callback/discord'
        }).toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        req.session.token = tokenResponse.data.access_token;
        res.redirect('/dashboard');
    } catch (error) {
        console.error('OAuth2 Error:', error.response ? error.response.data : error.message);
        res.status(500).send('Authentication failed. Check logs.');
    }
});

app.get('/dashboard', (req, res) => {
    if (!req.session.token) return res.redirect('/login');
    res.send('<h1>Dashboard</h1><p>Login successful!</p><a href="/logout">Logout</a>');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(port, () => console.log(`Server running on port ${port}`));
