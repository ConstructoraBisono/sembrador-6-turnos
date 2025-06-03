// index.js
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Base de datos temporal en memoria
let turnos = [];

// Crear un nuevo turno con estado "Pendiente"
app.post('/turnos', (req, res) => {
  const nuevoTurno = {
    id: turnos.length + 1,
    nombre: req.body.nombre || 'Usuario',
    estado: 'Pendiente',
    telefono: req.body.telefono
  };
  turnos.push(nuevoTurno);
  res.status(201).json(nuevoTurno);
});

// Cambiar estado de un turno
app.patch('/turnos/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const nuevoEstado = req.body.estado;

  const turno = turnos.find(t => t.id === id);
  if (!turno) {
    return res.status(404).json({ error: 'Turno no encontrado' });
  }

  turno.estado = nuevoEstado;

  // Si cambia a Finalizado o En proceso, notificar al siguiente turno
  if (nuevoEstado === 'Finalizado' || nuevoEstado === 'En proceso') {
    const siguienteTurno = turnos.find(t => t.estado === 'Pendiente');
    if (siguienteTurno) {
      await enviarWhatsApp(siguienteTurno.telefono);
    }
  }

  res.json(turno);
});

// Ver todos los turnos
app.get('/turnos', (req, res) => {
  res.json(turnos);
});

// Función para enviar WhatsApp (simulada)
async function enviarWhatsApp(numero) {
  console.log(`📲 Enviando WhatsApp al ${numero}...`);
  // Aquí va tu integración real con la API de WhatsApp
  // Por ahora solo simulamos
}

app.get('/', (req, res) => {
  res.send('🚀 Turnos Bisonó funcionando correctamente');
});

app.listen(port, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${port}`);
});
