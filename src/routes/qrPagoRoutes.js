const express = require("express");
const router = express.Router();

const { generarQR } = require("../controllers/qrPagoController");

router.post("/checkout-taypi", generarQR);

module.exports = router;