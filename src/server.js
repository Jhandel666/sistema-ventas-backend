require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend sistema ventas funcionando");
});

app.use("/api", require("./routes/productoRoutes"));
app.use("/api", require("./routes/ventaRoutes"));

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});