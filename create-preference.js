// Función serverless (Vercel) que crea una preferencia de pago en Mercado Pago.
// El Access Token NUNCA se expone al navegador: vive solo en la variable de
// entorno MP_ACCESS_TOKEN configurada en el panel de Vercel.

const { MercadoPagoConfig, Preference } = require("mercadopago");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    res.status(500).json({ error: "MP_ACCESS_TOKEN no está configurado en Vercel." });
    return;
  }

  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "El carrito está vacío." });
      return;
    }

    const siteUrl = process.env.SITE_URL || `https://${req.headers.host}`;

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: items.map((i) => ({
          title: String(i.title).slice(0, 250),
          quantity: Number(i.qty) || 1,
          unit_price: Number(i.price),
          currency_id: "PEN",
        })),
        back_urls: {
          success: `${siteUrl}/gracias.html`,
          failure: `${siteUrl}/carrito.html`,
          pending: `${siteUrl}/carrito.html`,
        },
        auto_return: "approved",
      },
    });

    res.status(200).json({ init_point: result.init_point });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Error al crear la preferencia de pago." });
  }
};
