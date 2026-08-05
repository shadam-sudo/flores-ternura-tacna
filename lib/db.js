// Cliente de base de datos compartido. @vercel/postgres exporta un `sql`
// ya diseñado como singleton reusado entre invocaciones "warm" — no crear
// un cliente nuevo por request (ver Constraints del design doc: agotar
// conexiones es el incidente de producción más probable de este proyecto).
const { sql } = require("@vercel/postgres");

module.exports = { sql };
