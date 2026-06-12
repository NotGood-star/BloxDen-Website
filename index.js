const express = require('express');
const path = require('path');
const app = express();

// Set the port to 10000 (Render's default)
const PORT = process.env.PORT || 10000;

// Serve static files from the 'public' directory
// This is essential for the browser to see your HTML, CSS, and JS files
app.use(express.static(path.join(__dirname, 'public')));

// Routes to serve your styled HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'terms.html'));
});

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
