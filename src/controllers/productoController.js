const pool = require("../db");

const listarProductos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id_producto,
        p.descripcion,
        p.img,
        p.precio,
        p.stock,
        p.id_categoria,
        p.id_proveedor,
        c.descripcion AS categoria,
        pr.razonsocial AS proveedor
      FROM producto p
      LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
      LEFT JOIN proveedor pr ON p.id_proveedor = pr.id_proveedor
      ORDER BY p.id_producto ASC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const obtenerProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM producto WHERE id_producto = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "Producto no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const crearProducto = async (req, res) => {
  try {
    const { descripcion, img, precio, stock, id_categoria, id_proveedor } = req.body;

    const result = await pool.query(
      `INSERT INTO producto 
       (descripcion, img, precio, stock, id_categoria, id_proveedor)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [descripcion, img, precio, stock, id_categoria, id_proveedor]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, img, precio, stock, id_categoria, id_proveedor } = req.body;

    const result = await pool.query(
      `UPDATE producto 
       SET descripcion = $1,
           img = $2,
           precio = $3,
           stock = $4,
           id_categoria = $5,
           id_proveedor = $6
       WHERE id_producto = $7
       RETURNING *`,
      [descripcion, img, precio, stock, id_categoria, id_proveedor, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "Producto no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM producto WHERE id_producto = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "Producto no encontrado" });
    }

    res.json({ msg: "Producto eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports = {
  listarProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
};