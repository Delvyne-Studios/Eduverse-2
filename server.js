const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Enable CORS
app.use(cors());

// Serve static files with proper MIME types
app.use(express.static(__dirname, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
        if (filePath.endsWith('.mjs')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Serve NCERT PDFs with proper headers
app.use('/ncert-textbooks', express.static(path.join(__dirname, 'ncert-textbooks'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.pdf')) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Access-Control-Allow-Origin', '*');
        }
    }
}));

// Serve JSON files with proper content-type
app.get('/*.json', (req, res) => {
    res.type('application/json');
    res.sendFile(path.join(__dirname, req.path));
});

// Serve landing page for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing.html'));
});

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║              🎓 EduVerse Server Running! 🎓                ║
║                                                            ║
║   🌐 Local:   http://localhost:${PORT}                       ║
║   📚 Status:  Ready to serve                               ║
║   🔥 CORS:    Enabled                                      ║
║   🔐 Auth:    InsForge (Google, GitHub, Email/Password)    ║
║                                                            ║
║   Press Ctrl+C to stop the server                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});

