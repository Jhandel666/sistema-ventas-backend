const pool = require("../db");

const registrarVenta = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { cliente, carrito, metodo_pago } = req.body;

    if (!cliente || !Array.isArray(carrito) || carrito.length === 0) {
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
      return res.status(400).json({
        ok: false,
        msg: "Completa todos los datos del cliente"
      });
    }

    const [clienteResult] = await connection.query(
      `INSERT INTO clientes
      (nombres, apellidos, direccion, telefono)
      VALUES (?, ?, ?, ?)`,
      camposCliente.map((campo) => String(campo).trim())
    );

    const idCliente = clienteResult.insertId;
    let totalCalculado = 0;
    const detalles = [];

    for (const item of carrito) {
      const cantidad = Number(item.cantidad);

      if (!item.id_producto || !Number.isInteger(cantidad) || cantidad <= 0) {
        throw new Error("El carrito contiene productos inválidos");
      }

      const [productoRows] = await connection.query(
        "SELECT id_producto, descripcion, precio, stock FROM producto WHERE id_producto = ? FOR UPDATE",
        [item.id_producto]
      );

      if (productoRows.length === 0) {
        throw new Error("Producto no encontrado");
      }

      const producto = productoRows[0];

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

    const [ventaResult] = await connection.query(
      `INSERT INTO ventas
      (fecha, total, metodo_pago, estado_pago, id_cliente)
      VALUES (NOW(), ?, ?, ?, ?)`,
      [
        totalCalculado.toFixed(2),
        metodo_pago || "EFECTIVO",
        "PAGADO",
        idCliente
      ]
    );

    const idVenta = ventaResult.insertId;

    for (const detalle of detalles) {
      await connection.query(
        `INSERT INTO detalle_venta
        (cantidad, precio_unitario, subtotal, id_producto, id_venta)
        VALUES (?, ?, ?, ?, ?)`,
        [
          detalle.cantidad,
          detalle.precio_unitario.toFixed(2),
          detalle.subtotal.toFixed(2),
          detalle.id_producto,
          idVenta
        ]
      );

      await connection.query(
        "UPDATE producto SET stock = stock - ? WHERE id_producto = ?",
        [detalle.cantidad, detalle.id_producto]
      );
    }

    await connection.commit();

    res.json({
      ok: true,
      msg: "Venta registrada correctamente",
      idVenta,
      total: Number(totalCalculado.toFixed(2))
    });
  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      ok: false,
      msg: error.message || "Error al registrar venta"
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  registrarVenta
};
