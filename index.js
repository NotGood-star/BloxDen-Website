const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');
const app = express();

// Use the PORT provided by Render, or default to 10000
const port = process.env.PORT || 10000;

// Middleware for sessions
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Serve your index.html from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Login route: Sends user to Discord
app.get('/login', (req, res) => {
    const authUrl = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;
    res.redirect(authUrl);
});

// Callback route: Discord sends user here after login
app.get('/api/auth/callback/discord', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.send('No code provided!');

    try {
        const response = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.DISCORD_REDIRECT_URI,
        }).toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        req.session.token = response.data.access_token;
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error during auth:', error.response?.data || error.message);
        res.send('Authentication failed.');
    }
});

// Dashboard route: Protected page
app.get('/dashboard', (req, res) => {
    if (!req.session.token) return res.redirect('/login');
    res.send('<h1>Login Successful!</h1><p>Welcome to your Dashboard.</p><a href="/logout">Logout</a>');
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
