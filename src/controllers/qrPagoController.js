const { crearCheckoutSession } = require("../services/taypiService");

const generarQR = async (req, res) => {
  try {
    const { total } = req.body;

    const data = await crearCheckoutSession({ total });

    console.log("DATA TAYPI:", data);

    res.json({
      ok: true,
      checkoutToken: data.checkoutToken,
      publicKey: process.env.TAYPI_PUBLIC_KEY,
      reference: data.reference
    });

  } catch (error) {
    console.log("ERROR TAYPI:", error);

    res.status(500).json({
      ok: false,
      msg: "No se pudo crear sesión Taypi",
      error: error.message
    });
  }
};

module.exports = { generarQR };