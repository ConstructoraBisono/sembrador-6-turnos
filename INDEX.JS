const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;
const TURNOS_FILE = "./turnos.json";

app.use(cors());
app.use(express.json());

// Leer turnos desde archivo
function getTurnos() {
  if (!fs.existsSync(TURNOS_FILE)) return [];
  const data = fs.readFileSync(TURNOS_FILE);
  return JSON.parse(data);
}

// Guardar turnos en archivo
function saveTurnos(turnos) {
  fs.writeFileSync(TURNOS_FILE, JSON.stringify(turnos, null, 2));
}

// Enviar mensaje WhatsApp usando la API
async function enviarWhatsApp(telefono) {
  try {
    const mensaje = "¡Hola! es tu Turno, por favor acercate a nuestro Oficial de Ventas Bisono.";
    await axios.post("https://waba.360dialog.io/v1/messages", {
      to: `1${telefono}`,
      type: "text",
      text: { body: mensaje }
    }, {
      headers: {
        "D360-API-KEY": "sk_33ed3140aca24e4c98cd75b52b5c7722",
        "Content-Type": "application/json"
      }
    });
    console.log("Mensaje enviado a", telefono);
  } catch (error) {
    console.error("Error al enviar WhatsApp:", error.response?.data || error.message);
  }
}

// Ruta para recibir un nuevo turno
app.post("/", (req, res) => {
  const { numero, telefono } = req.body;
  if (!numero || !telefono) return res.status(400).json({ error: "Faltan datos" });

  const turnos = getTurnos();
  const nuevoTurno = {
    id: uuidv4(),
    numero,
    telefono,
    estado: "Pendiente",
    fecha: new Date().toISOString()
  };
  turnos.push(nuevoTurno);
  saveTurnos(turnos);

  res.json({ mensaje: "Turno registrado", turno: nuevoTurno });
});

// Ruta para listar turnos
app.get("/turnos", (req, res) => {
  const turnos = getTurnos();
  res.json(turnos);
});

// Cambiar estado del turno y notificar siguiente
app.put("/turnos/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const turnos = getTurnos();
  const index = turnos.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: "Turno no encontrado" });

  turnos[index].estado = estado;
  saveTurnos(turnos);

  if (estado === "En proceso" || estado === "Finalizado") {
    // Buscar siguiente pendiente
    const siguiente = turnos.find(t => t.estado === "Pendiente" && t.id !== id);
    if (siguiente) {
      await enviarWhatsApp(siguiente.telefono);
    }
  }

  res.json({ mensaje: "Estado actualizado", turno: turnos[index] });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
