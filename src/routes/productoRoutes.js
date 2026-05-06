const express = require("express");

const router = express.Router();

const {
  getProductos,
  getProductoById
} = require("../controllers/productoController");

router.get("/productos", getProductos);

router.get("/productos/:id", getProductoById);

module.exports = router;