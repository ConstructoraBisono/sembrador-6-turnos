const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let turnos = [];

app.get('/', (req, res) => {
  res.send('Servidor de Turnos Constructora Bisonó funcionando');
});

// 📌 Recibir turno nuevo
app.post('/turnos', (req, res) => {
  const { numero, telefono } = req.body;
  const nuevoTurno = { numero, telefono, estado: 'Pendiente' };
  turnos.push(nuevoTurno);
  res.status(201).json({ mensaje: 'Turno registrado', turno: nuevoTurno });
});

// 📋 Ver todos los turnos
app.get('/turnos', (req, res) => {
  res.json(turnos);
});

// 🔁 Cambiar estado y notificar al siguiente
app.post('/turnos/estado', async (req, res) => {
  const { numero, nuevoEstado } = req.body;
  const index = turnos.findIndex(t => t.numero === numero);

  if (index === -1) {
    return res.status(404).json({ mensaje: 'Turno no encontrado' });
  }

  turnos[index].estado = nuevoEstado;

  // Si se marcó como Finalizado o En proceso, notificar al siguiente
  if (nuevoEstado === 'Finalizado' || nuevoEstado === 'En proceso') {
    const siguiente = turnos.find((t, i) => i > index && t.estado === 'Pendiente');
    if (siguiente && siguiente.telefono) {
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
        console.log(`Mensaje enviado a ${siguiente.telefono}`);
      } catch (error) {
        console.error('Error enviando WhatsApp:', error.response?.data || error.message);
      }
    }
  }

  res.json({ mensaje: 'Estado actualizado', turno: turnos[index] });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
