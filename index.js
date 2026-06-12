const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');
const app = express();

const port = process.env.PORT || 10000;

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Login route
app.get('/login', (req, res) => {
    // Hardcoded to avoid environment variable issues
    const clientId = '1507972003481784421';
    const redirectUri = 'https://bloxden-website.onrender.com/api/auth/callback/discord';
    const authUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20guilds`;
    
    console.log("Redirecting to Discord with URL:", authUrl);
    res.redirect(authUrl);
});

// Callback route
app.get('/api/auth/callback/discord', async (req, res) => {
    const { code } = req.query;
    console.log("Received code from Discord:", code);

    if (!code) return res.send('No code provided by Discord!');

    try {
        const response = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: '1507972003481784421',
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: 'https://bloxden-website.onrender.com/api/auth/callback/discord',
        }).toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        req.session.token = response.data.access_token;
        console.log("Successfully obtained access token.");
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error during token exchange:', error.response?.data || error.message);
        res.send('Authentication failed. Check your Render logs for details.');
    }
});

// Dashboard
app.get('/dashboard', (req, res) => {
    if (!req.session.token) return res.redirect('/login');
    res.send('<h1>Login Successful!</h1><p>You have successfully connected your account.</p><a href="/logout">Logout</a>');
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
