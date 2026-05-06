const express = require("express");
const router = express.Router();
const { registrarVenta } = require("../controllers/ventaController");

router.post("/ventas", registrarVenta);

module.exports = router;