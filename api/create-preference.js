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
    const { items, cliente_nombre, cliente_telefono } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "El carrito está vacío." });
      return;
    }

    const siteUrl = process.env.SITE_URL || `https://${req.headers.host}`;

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    // metadata viaja de la preferencia al pago — el webhook lo usa para
    // reconstruir el pedido completo (nombre, teléfono, ítems) sin tener
    // que consultar nada más. Mercado Pago solo devuelve datos del pagador
    // (email, nombre de la tarjeta), no el teléfono de contacto ni el
    // detalle exacto del pedido que necesita el panel.
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
        metadata: {
          cliente_nombre: String(cliente_nombre || "").slice(0, 200),
          cliente_telefono: String(cliente_telefono || "").slice(0, 20),
          items: JSON.stringify(items.map((i) => ({ nombre: i.title, qty: i.qty }))).slice(0, 1000),
        },
      },
    });

    res.status(200).json({ init_point: result.init_point });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Error al crear la preferencia de pago." });
  }
};
