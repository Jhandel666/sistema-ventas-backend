const pool = require("../db");

const listarProductos = async () => {
  const result = await pool.query(`
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
    ORDER BY p.id_producto ASC
  `);

  return result.rows;
};

const obtenerProducto = async (id) => {
  const result = await pool.query(
    "SELECT * FROM producto WHERE id_producto = $1",
    [id]
  );

  return result.rows[0];
};

module.exports = {
  listarProductos,
  obtenerProducto
};