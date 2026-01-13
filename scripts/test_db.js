require("dotenv").config();

const { testConnection, pool } = require("../db_automation");

(async () => {
  try {
    const ok = await testConnection();
    await pool.end();
    process.exit(ok ? 0 : 1);
  } catch (e) {
    try {
      await pool.end();
    } catch (_) {
      // ignore
    }
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  }
})();

