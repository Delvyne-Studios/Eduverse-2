const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Enable CORS
app.use(cors());

// Serve static files (including PDFs)
app.use(express.static(__dirname));

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

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
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
║   📁 DB:      chem_db.json loaded                          ║
║                                                            ║
║   Press Ctrl+C to stop the server                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});
