const Producto = require("../models/productoModel");

const getProductos = async (req, res) => {

  try {

    const productos = await Producto.listarProductos();

    res.json(productos);

  } catch (error) {

    res.status(500).json({
      msg: error.message
    });

  }
};

const getProductoById = async (req, res) => {

  try {

    const producto = await Producto.obtenerProducto(
      req.params.id
    );

    res.json(producto);

  } catch (error) {

    res.status(500).json({
      msg: error.message
    });

  }
};

module.exports = {
  getProductos,
  getProductoById
};