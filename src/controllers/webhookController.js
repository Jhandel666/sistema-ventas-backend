const pool = require("../db");

const webhookQrPago = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const evento = req.body;

    const paymentId = evento.payment_id || evento.id;
    const estado = evento.status || evento.estado;

    if (!paymentId) {
      return res.status(400).json({
        ok: false,
        msg: "payment_id faltante"
      });
    }

    if (estado !== "PAID" && estado !== "PAGADO") {
      await pool.query(
        "UPDATE pagos_qr SET estado = ? WHERE payment_id = ?",
        [estado || "PENDIENTE", paymentId]
      );

      return res.json({
        ok: true,
        msg: "Evento recibido, pago no confirmado"
      });
    }

    const [pagos] = await connection.query(
      "SELECT * FROM pagos_qr WHERE payment_id = ?",
      [paymentId]
    );

    if (pagos.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Pago no encontrado"
      });
    }

    const pago = pagos[0];

    if (pago.estado === "PAGADO") {
      return res.json({
        ok: true,
        msg: "Pago ya procesado"
      });
    }

    const cliente = JSON.parse(evento.metadata.cliente);
    const carrito = JSON.parse(evento.metadata.carrito);
    const total = Number(pago.total);

    await connection.beginTransaction();

    const [clienteResult] = await connection.query(
      `INSERT INTO clientes 
      (nombres, apellidos, direccion, telefono) 
      VALUES (?, ?, ?, ?)`,
      [
        cliente.nombres,
        cliente.apellidos,
        cliente.direccion,
        cliente.telefono
      ]
    );

    const idCliente = clienteResult.insertId;

    const [ventaResult] = await connection.query(
      `INSERT INTO ventas 
      (fecha, total, metodo_pago, estado_pago, id_cliente) 
      VALUES (NOW(), ?, 'QR_YAPE_PLIN', 'PAGADO', ?)`,
      [total, idCliente]
    );

    const idVenta = ventaResult.insertId;

    for (const item of carrito) {
      const [productoRows] = await connection.query(
        "SELECT stock FROM producto WHERE id_producto = ? FOR UPDATE",
        [item.id_producto]
      );

      if (productoRows.length === 0) {
        throw new Error("Producto no encontrado");
      }

      if (productoRows[0].stock < item.cantidad) {
        throw new Error(`Stock insuficiente para ${item.descripcion}`);
      }

      const subtotal = Number(item.precio) * Number(item.cantidad);

      await connection.query(
        `INSERT INTO detalle_venta 
        (cantidad, precio_unitario, subtotal, id_producto, id_venta) 
        VALUES (?, ?, ?, ?, ?)`,
        [
          item.cantidad,
          item.precio,
          subtotal,
          item.id_producto,
          idVenta
        ]
      );

      await connection.query(
        "UPDATE producto SET stock = stock - ? WHERE id_producto = ?",
        [item.cantidad, item.id_producto]
      );
    }

    await connection.query(
      `UPDATE pagos_qr 
       SET estado = 'PAGADO', fecha_pago = NOW() 
       WHERE payment_id = ?`,
      [paymentId]
    );

    await connection.commit();

    res.json({
      ok: true,
      msg: "Pago confirmado y venta registrada",
      idVenta
    });

  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      ok: false,
      msg: "Error procesando webhook",
      error: error.message
    });

  } finally {
    connection.release();
  }
};

module.exports = {
  webhookQrPago
};