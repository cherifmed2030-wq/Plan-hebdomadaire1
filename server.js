require('dotenv').config();

// Imports nécessaires
if (!globalThis.fetch) {
  const fetch = require('node-fetch');
  globalThis.fetch = fetch;
}
const express = require('express');
const path = require('path');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
// ... autres imports que vous utilisez
const XLSX = require('xlsx');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialisation
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- CORRECTION FINALE ---
// Cette ligne sert les fichiers statiques (index.html, style.css)
app.use(express.static(path.join(__dirname, '../public')));

// Le reste de votre code (API, fonctions, etc.)
const WORD_TEMPLATE_URL = process.env.WORD_TEMPLATE_URL;

let geminiModel;
if (process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
}

const validUsers = {
    "Zine": "Zine", "Abas": "Abas", "Tonga": "Tonga", "Ilyas": "Ilyas", "Morched": "Morched",
    "عبد الرحمان": "عبد الرحمان", "Youssif": "Youssif", "عبد العزيز": "عبد العزيز",
    "Med Ali": "Med Ali", "Sami": "Sami", "جابر": "جابر", "محمد الزبيدي": "محمد الزبيدي",
    "فارس": "فارس", "AutreProf": "AutreProf", "Mohamed": "Mohamed"
};

// --- ROUTES API ---
// Les requêtes vers votre API commencent ici
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

app.post('/save-plan', async (req, res) => {
    try {
        const { week, data } = req.body;
        const weekNumber = Number(week);
        const cleanedData = Array.isArray(data) ? data.map(item => ({ ...item, id: undefined, _id: undefined })) : [];
        await prisma.plan.upsert({
            where: { week: weekNumber },
            update: { data: cleanedData },
            create: { week: weekNumber, data: cleanedData, classNotes: {} },
        });
        res.status(200).json({ message: `Tableau S${weekNumber} enregistré.` });
    } catch (error) {
        res.status(500).json({ message: `Erreur: ${error.message}` });
    }
});

// Ajoutez ici toutes vos autres routes API (/save-notes, /generate-word, etc.)
// ...
// ...

// Export pour Vercel
module.exports = app;
