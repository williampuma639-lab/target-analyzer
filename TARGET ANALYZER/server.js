const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'audits_history.json');

// Middlewares necesarios
app.use(cors()); // Permite la conexión segura con el frontend
app.use(express.json()); // Habilita la lectura de formatos JSON en las peticiones

/**
 * Endpoint de Utilidad: Inicializa el archivo JSON si no existe
 */
const initDatabase = () => {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
    }
};
initDatabase();

/**
 * RUTA 1: GET /api/audits
 * Descripción: Recupera el historial completo de análisis realizados.
 */
app.get('/api/audits', (req, res) => {
    try {
        const fileData = fs.readFileSync(DATA_FILE, 'utf8');
        const audits = JSON.parse(fileData);
        res.status(200).json(audits);
    } catch (error) {
        res.status(500).json({ error: "Error al leer el historial de auditorías." });
    }
});

/**
 * RUTA 2: POST /api/analyze
 * Descripción: Recibe los datos de un elemento frontend, dictamina su estado 
 * y guarda la auditoría con una marca de tiempo en el servidor.
 */
app.post('/api/analyze', (req, res) => {
    const { elementName, width, height } = req.body;

    // Validación básica de los datos de entrada
    if (!elementName || width === undefined || height === undefined) {
        return res.status(400).json({ error: "Faltan datos obligatorios (elementName, width, height)." });
    }

    // Lógica del negocio en el Backend (Evaluación de cumplimiento de WCAG)
    const MIN_TARGET_SIZE = 24; 
    const passed = (width >= MIN_TARGET_SIZE && height >= MIN_TARGET_SIZE);
    
    // Crear el nuevo registro de auditoría
    const newAudit = {
        id: Date.now().toString(),
        elementName,
        dimensions: `${width}x${height}px`,
        status: passed ? "PASÓ" : "FALLÓ",
        timestamp: new Date().toISOString()
    };

    try {
        // Leer base de datos local, agregar registro y volver a escribir
        const fileData = fs.readFileSync(DATA_FILE, 'utf8');
        const audits = JSON.parse(fileData);
        audits.unshift(newAudit); // Los más recientes primero
        
        fs.writeFileSync(DATA_FILE, JSON.stringify(audits, null, 2));

        // Responder al frontend con el resultado final del análisis
        res.status(201).json({
            message: "Análisis procesado y guardado con éxito.",
            audit: newAudit
        });
    } catch (error) {
        res.status(500).json({ error: "Error al guardar el análisis en el servidor." });
    }
});

// Levantar el servidor en el puerto configurado
app.listen(PORT, () => {
    console.log(`🚀 Servidor de Target Analyzer ejecutándose en: http://localhost:${PORT}`);
});
