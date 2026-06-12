const express = require('express');
const session = require('express-session');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 10000;

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Route: Login
app.get('/login', (req, res) => {
    const authUrl = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;
    res.redirect(authUrl);
});

// Route: Callback (Discord sends user here)
app.get('/api/auth/callback/discord', async (req, res) => {
    const { code } = req.query;
    try {
        const response = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.DISCORD_REDIRECT_URI,
        }).toString());

        req.session.token = response.data.access_token;
        res.redirect('/dashboard');
    } catch (error) {
        res.send('Login Failed: ' + error.message);
    }
});

// Route: Dashboard
app.get('/dashboard', (req, res) => {
    if (!req.session.token) return res.redirect('/login');
    res.send('<h1>Welcome to your BloxDen Dashboard!</h1><a href="/logout">Logout</a>');
});

app.listen(port, () => console.log(`Server running on port ${port}`));
