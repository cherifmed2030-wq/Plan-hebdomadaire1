require('dotenv').config();
const path = require('path');

// Polyfill et Imports
if (!globalThis.fetch) {
    const fetch = require('node-fetch');
    globalThis.fetch = fetch;
}

const { PrismaClient } = require('@prisma/client');
const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const XLSX = require('xlsx');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialisation
const prisma = new PrismaClient();
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(fileUpload());

// CORRECTION CRITIQUE: Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Variables et constantes
const WORD_TEMPLATE_URL = process.env.WORD_TEMPLATE_URL;

let geminiModel;
if (process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
}

const validUsers = {
    "Zine": "Zine", "Abas": "Abas", "Tonga": "Tonga", "Ilyas": "Ilyas",
    "Morched": "Morched", "عبد الرحمان": "عبد الرحمان", "Youssif": "Youssif",
    "عبد العزيز": "عبد العزيز", "Med Ali": "Med Ali", "Sami": "Sami",
    "جابر": "جابر", "محمد الزبيدي": "محمد الزبيدي", "فارس": "فارس",
    "AutreProf": "AutreProf", "Mohamed": "Mohamed"
};

// CORRECTION CRITIQUE: Route racine pour résoudre l'erreur 404
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route de test
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'API is running' });
});

// Vos routes existantes (login, plans, save-plan, etc.)
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
        const planDocument = await prisma.plan.findUnique({
            where: { week: weekNumber }
        });
        if (!planDocument) {
            return res.status(200).json({ planData: [], classNotes: {} });
        }
        res.status(200).json({
            planData: planDocument.data || [],
            classNotes: planDocument.classNotes || {}
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur interne.' });
    }
});

app.post('/save-plan', async (req, res) => {
    try {
        const { week, data } = req.body;
        const weekNumber = Number(week);
        const cleanedData = Array.isArray(data) ? data.map(item => {
            const newItem = { ...item };
            delete newItem.id;
            delete newItem._id;
            return newItem;
        }) : [];
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

// CORRECTION CRITIQUE: Route de fallback (À LA FIN)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;
