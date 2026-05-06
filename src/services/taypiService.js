const crearCheckoutSession = async ({ total }) => {
  const { Taypi } = await import("taypi.pe");

  console.log("PUBLIC KEY:", process.env.TAYPI_PUBLIC_KEY);
  console.log("SECRET EXISTS:", process.env.TAYPI_SECRET_KEY ? "SI" : "NO");

  const taypi = new Taypi(
    process.env.TAYPI_PUBLIC_KEY,
    process.env.TAYPI_SECRET_KEY,
    { baseUrl: "https://sandbox.taypi.pe" }
  );

  const reference = `NOVA-${Date.now()}`;

  const session = await taypi.createCheckoutSession(
    {
      amount: Number(total).toFixed(2),
      reference,
      description: "Compra Nova Salud"
    },
    reference
  );

  console.log("SESSION:", session);

  return {
    checkoutToken:
      session.checkout_token ||
      session.checkoutToken ||
      session.sessionToken ||
      session.token,
    reference
  };
};

module.exports = { crearCheckoutSession };