const pool = require("../db");

const listarProductos = async () => {

  const [rows] = await pool.query(`
    SELECT 
      p.id_producto,
      p.descripcion,
      p.img,
      p.precio,
      p.stock,
      c.descripcion AS categoria
    FROM producto p
    LEFT JOIN categoria c
    ON p.id_categoria = c.id_categoria
  `);

  return rows;
};

const obtenerProducto = async (id) => {

  const [rows] = await pool.query(
    "SELECT * FROM producto WHERE id_producto = ?",
    [id]
  );

  return rows[0];
};

module.exports = {
  listarProductos,
  obtenerProducto
};