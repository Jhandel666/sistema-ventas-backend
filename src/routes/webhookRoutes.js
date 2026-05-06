const express = require("express");
const router = express.Router();

const { webhookQrPago } = require("../controllers/webhookController");

router.post("/webhook/qr-pago", webhookQrPago);

module.exports = router;