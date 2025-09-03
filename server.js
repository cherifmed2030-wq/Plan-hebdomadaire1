require('dotenv').config();

if (!globalThis.fetch) {
  const fetch = require('node-fetch');
  globalThis.fetch = fetch;
}

const express = require('express');
const path = require('path');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
// ... autres imports ...

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public')); // Cette ligne sert les fichiers comme style.css

// --- API ROUTES ---
// Toutes vos routes API viennent ici (ex: /login, /plans/:week)

const validUsers = {
    "Zine": "Zine", "Abas": "Abas", "Tonga": "Tonga", "Ilyas": "Ilyas", "Morched": "Morched",
    "عبد الرحمان": "عبد الرحمان", "Youssif": "Youssif", "عبد العزيز": "عبد العزيز",
    "Med Ali": "Med Ali", "Sami": "Sami", "جابر": "جابر", "محمد الزبيدي": "محمد الزبيدي",
    "فارس": "فارس", "AutreProf": "AutreProf", "Mohamed": "Mohamed"
};

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (validUsers[username] && validUsers[username] === password) {
        res.status(200).json({ success: true, username: username });
    } else {
        res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }
});

app.get('/plans/:week', async (req, res) => {
    try {
        const weekNumber = parseInt(req.params.week, 10);
        const planDocument = await prisma.plan.findUnique({ where: { week: weekNumber } });
        if (!planDocument) {
            return res.status(200).json({ planData: [], classNotes: {} });
        }
        res.status(200).json({
            planData: planDocument.data || [],
            classNotes: planDocument.classNotes || {},
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur interne.' });
    }
});

// Ajoutez vos autres routes API ici...

// --- ROUTE FINALE ---
// Cette route sert votre page principale (index.html) pour toutes les autres requêtes.
// Elle doit être à la TOUTE FIN.
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Export pour Vercel
module.exports = app;
