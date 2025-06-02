// backend_turnos_bisono/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let turnos = [];

// Ruta para recibir nuevo turno
app.post('/', (req, res) => {
  const { numero, telefono } = req.body;
  if (!numero) return res.status(400).json({ error: 'Falta el número de turno' });

  turnos.push({ numero, telefono, estado: 'Pendiente' });
  res.json({ mensaje: 'Turno recibido' });
});

// Ruta para listar todos los turnos
app.get('/turnos', (req, res) => {
  res.json(turnos);
});

// Ruta para actualizar estado de un turno
app.post('/actualizar', (req, res) => {
  const { numero, estado } = req.body;
  const turno = turnos.find(t => t.numero === numero);
  if (!turno) return res.status(404).json({ error: 'Turno no encontrado' });

  turno.estado = estado;
  res.json({ mensaje: 'Estado actualizado' });
});

// Ruta para notificar al siguiente turno pendiente
app.post('/notificar', async (req, res) => {
  const siguiente = turnos.find(t => t.estado === 'Pendiente');

  if (siguiente && siguiente.telefono) {
    try {
      await axios.post(
        'https://graph.facebook.com/v18.0/508852171945366/messages',
        {
          messaging_product: 'whatsapp',
          to: siguiente.telefono.replace(/[^0-9]/g, ''),
          type: 'text',
          text: {
            body: '¡Hola! es tu Turno, por favor acercate a nuestro Oficial de Ventas Bisonó.'
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer sk_33ed3140aca24e4c98cd75b52b5c7722'
          }
        }
      );
      res.json({ mensaje: 'Mensaje enviado al siguiente turno' });
    } catch (err) {
      console.error(err.response?.data || err);
      res.status(500).json({ error: 'Error al enviar el mensaje' });
    }
  } else {
    res.json({ mensaje: 'No hay turnos pendientes o teléfono no disponible' });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});
