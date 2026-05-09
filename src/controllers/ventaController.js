const pool = require("../db");

const registrarVenta = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { cliente, carrito } = req.body;

    if (!cliente || !Array.isArray(carrito) || carrito.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        ok: false,
        msg: "Datos incompletos: cliente y carrito son obligatorios"
      });
    }

    const camposCliente = [
      cliente.nombres,
      cliente.apellidos,
      cliente.direccion,
      cliente.telefono
    ];

    if (camposCliente.some((campo) => !campo || String(campo).trim() === "")) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        ok: false,
        msg: "Completa todos los datos del cliente"
      });
    }

    const clienteResult = await client.query(
      `INSERT INTO clientes
      (nombres, apellidos, direccion, telefono)
      VALUES ($1, $2, $3, $4)
      RETURNING id_cliente`,
      camposCliente.map((campo) => String(campo).trim())
    );

    const idCliente = clienteResult.rows[0].id_cliente;

    let totalCalculado = 0;
    const detalles = [];

    for (const item of carrito) {
      const cantidad = Number(item.cantidad);

      if (!item.id_producto || !Number.isInteger(cantidad) || cantidad <= 0) {
        throw new Error("El carrito contiene productos inválidos");
      }

      const productoResult = await client.query(
        `SELECT id_producto, descripcion, precio, stock
         FROM producto
         WHERE id_producto = $1
         FOR UPDATE`,
        [item.id_producto]
      );

      if (productoResult.rows.length === 0) {
        throw new Error("Producto no encontrado");
      }

      const producto = productoResult.rows[0];

      if (Number(producto.stock) < cantidad) {
        throw new Error(`Stock insuficiente para ${producto.descripcion}`);
      }

      const precioUnitario = Number(producto.precio);
      const subtotal = precioUnitario * cantidad;

      totalCalculado += subtotal;

      detalles.push({
        id_producto: producto.id_producto,
        cantidad,
        precio_unitario: precioUnitario,
        subtotal
      });
    }

    const ventaResult = await client.query(
      `INSERT INTO ventas
      (fecha, total, id_cliente)
      VALUES (NOW(), $1, $2)
      RETURNING id_venta`,
      [totalCalculado.toFixed(2), idCliente]
    );

    const idVenta = ventaResult.rows[0].id_venta;

    for (const detalle of detalles) {
      await client.query(
        `INSERT INTO detalle_venta
        (cantidad, precio_unitario, subtotal, id_producto, id_venta)
        VALUES ($1, $2, $3, $4, $5)`,
        [
          detalle.cantidad,
          detalle.precio_unitario.toFixed(2),
          detalle.subtotal.toFixed(2),
          detalle.id_producto,
          idVenta
        ]
      );

      await client.query(
        `UPDATE producto
         SET stock = stock - $1
         WHERE id_producto = $2`,
        [detalle.cantidad, detalle.id_producto]
      );
    }

    await client.query("COMMIT");

    res.json({
      ok: true,
      msg: "Venta registrada correctamente",
      idVenta,
      total: Number(totalCalculado.toFixed(2))
    });

  } catch (error) {
    await client.query("ROLLBACK");

    res.status(500).json({
      ok: false,
      msg: error.message || "Error al registrar venta"
    });

  } finally {
    client.release();
  }
};

module.exports = {
  registrarVenta
};
