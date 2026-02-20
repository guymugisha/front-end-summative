const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve your front-end files

// API to save records to seed.json
app.post('/api/save', (req, res) => {
    const records = req.body;
    const filePath = path.join(__dirname, 'seed.json');

    fs.writeFile(filePath, JSON.stringify(records, null, 4), (err) => {
        if (err) {
            console.error('Error writing to seed.json:', err);
            return res.status(500).json({ error: 'Failed to save data' });
        }
        console.log('Successfully saved to seed.json');
        res.json({ message: 'Saved successfully' });
    });
});

// API to load records from seed.json
app.get('/api/load', (req, res) => {
    const filePath = path.join(__dirname, 'seed.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading seed.json:', err);
            return res.status(500).json({ error: 'Failed to load data' });
        }
        res.json(JSON.parse(data));
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Open your browser to http://localhost:${PORT} to use the app with auto-save!`);
});
