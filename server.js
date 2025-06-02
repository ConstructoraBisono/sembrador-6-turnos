const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

let turnos = [];
let contador = 0;

// Ruta para registrar turno
app.post('/', (req, res) => {
  const { numero, telefono } = req.body;

  const nuevoTurno = {
    id: contador++,
    numero,
    telefono,
    estado: 'Pendiente'
  };

  turnos.push(nuevoTurno);
  res.json({ success: true, turno: nuevoTurno });
});

// Ruta para cambiar estado de un turno
app.post('/cambiar-estado', async (req, res) => {
  const { id, estado } = req.body;
  const turnoActual = turnos.find(t => t.id === id);

  if (!turnoActual) {
    return res.status(404).json({ error: 'Turno no encontrado' });
  }

  turnoActual.estado = estado;

  // Buscar siguiente turno pendiente
  const siguiente = turnos.find(t => t.estado === 'Pendiente');

  if (siguiente) {
    try {
      await axios.post(
        'https://graph.facebook.com/v19.0/508852171945366/messages',
        {
          messaging_product: 'whatsapp',
          to: siguiente.telefono,
          type: 'text',
          text: {
            body: '¡Hola! es tu Turno, por favor acercate a nuestro Oficial de Ventas Bisono.'
          }
        },
        {
          headers: {
            Authorization: 'Bearer sk_33ed3140aca24e4c98cd75b52b5c7722',
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error al enviar WhatsApp:', error.response?.data || error.message);
    }
  }

  res.json({ success: true, actualizado: turnoActual });
});

app.get('/turnos', (req, res) => {
  res.json(turnos);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
