const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let turnos = [];
let enEspera = 0;

app.post('/', (req, res) => {
  const { numero, telefono } = req.body;

  if (!numero) {
    return res.status(400).json({ error: 'Falta el número de turno' });
  }

  const turno = {
    numero,
    telefono: telefono || null,
    fecha: new Date().toISOString(),
    estado: 'pendiente',
    orden: turnos.length + 1,
  };

  turnos.push(turno);
  enEspera++;

  console.log(`Nuevo turno: ${numero} - WhatsApp: ${telefono}`);

  return res.status(200).json({
    mensaje: 'Turno registrado correctamente',
    enEspera: enEspera - 1,
    turno,
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en https://turnos-bisono-sembrador6.onrender.com/`);
});
