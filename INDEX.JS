cconst express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let turnos = [];

function enviarMensajeWhatsApp(telefono) {
  return axios.post(
    'https://graph.facebook.com/v18.0/508852171945366/messages',
    {
      messaging_product: 'whatsapp',
      to: telefono,
      type: 'text',
      text: {
        body: '¡Hola! es tu Turno, por favor acercate a nuestro Oficial de Ventas Bisonó.'
      }
    },
    {
      headers: {
        Authorization: 'Bearer sk_33ed3140aca24e4c98cd75b52b5c7722',
        'Content-Type': 'application/json'
      }
    }
  );
}

// Recibe turnos nuevos
app.post('/api/turnos', (req, res) => {
  const { numero, telefono } = req.body;
  if (!numero) return res.status(400).send({ error: 'Falta número de turno' });

  const nuevoTurno = {
    numero,
    telefono,
    estado: 'Pendiente',
    timestamp: new Date()
  };

  turnos.push(nuevoTurno);
  console.log('Turno recibido:', nuevoTurno);
  res.status(201).send({ mensaje: 'Turno registrado', turno: nuevoTurno });
});

// Ver todos los turnos
app.get('/api/turnos', (req, res) => {
  res.json(turnos);
});

// Cambiar estado del turno
app.post('/api/turnos/:numero/estado', async (req, res) => {
  const { numero } = req.params;
  const { nuevoEstado } = req.body;

  const turno = turnos.find(t => t.numero === numero);
  if (!turno) return res.status(404).send({ error: 'Turno no encontrado' });

  turno.estado = nuevoEstado;

  // Si se marca como finalizado o en proceso, se notifica al siguiente pendiente
  if (['Finalizado', 'En proceso'].includes(nuevoEstado)) {
    const siguiente = turnos.find(t => t.estado === 'Pendiente');
    if (siguiente && siguiente.telefono) {
      try {
        await enviarMensajeWhatsApp(siguiente.telefono);
        console.log('Mensaje enviado a:', siguiente.telefono);
      } catch (error) {
        console.error('Error enviando mensaje:', error.response?.data || error.message);
      }
    }
  }

  res.send({ mensaje: 'Estado actualizado', turno });
});

app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
