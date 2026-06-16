const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// Serve static files (your website) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Simple route to serve your main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Website is live on port ${PORT}`);
});

