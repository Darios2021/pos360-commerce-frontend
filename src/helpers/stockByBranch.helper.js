// src/helpers/stockByBranch.helper.js
// ✅ COPY-PASTE FINAL
//
// Devuelve stock por sucursal para una lista de product_ids.
// Formato:
// {
//   305: [ { branch_id: 3, qty: 5 }, { branch_id: 4, qty: 0 } ],
//   306: [ { branch_id: 3, qty: 1 } ],
// }
//
// ⚠️ TODO AJUSTAR SQL a tus tablas reales.
// Recomendado: que incluya SOLO sucursales activas y productos habilitados.

const { sequelize, Sequelize } = require("../db"); // ✅ AJUSTAR si tu export es distinto

/**
 * @param {number[]} productIds
 * @returns {Promise<Record<number, Array<{branch_id:number, qty:number}>>>}
 */
async function getStockByBranchMap(productIds = []) {
  const ids = Array.from(new Set((productIds || []).map((x) => Number(x)).filter(Boolean)));
  if (!ids.length) return {};

  // ✅ MySQL: armar IN (?, ?, ?) seguro
  const placeholders = ids.map(() => "?").join(",");

  // ==========================
  // TODO AJUSTAR:
  // Cambiá estas tablas/campos a los tuyos reales.
  //
  // Opciones típicas:
  // - branch_stocks(product_id, branch_id, qty)
  // - product_branch(product_id, branch_id, enabled)
  // - branches(id, name, is_active)
  //
  // La idea:
  // - traer qty por (product_id, branch_id)
  // - incluir sucursales activas
  // - si tenés tabla de habilitación producto-sucursal, filtrar enabled=1
  // ==========================
  const sql = `
    SELECT
      s.product_id,
      s.branch_id,
      CAST(s.qty AS SIGNED) AS qty
    FROM branch_stocks s
    INNER JOIN branches b ON b.id = s.branch_id AND (b.is_active = 1 OR b.active = 1 OR b.enabled = 1)
    -- Si tenés habilitación por sucursal, descomentá y ajustá:
    -- INNER JOIN product_branch pb ON pb.product_id = s.product_id AND pb.branch_id = s.branch_id AND pb.enabled = 1
    WHERE s.product_id IN (${placeholders})
  `;

  let rows = [];
  try {
    rows = await sequelize.query(sql, {
      replacements: ids,
      type: Sequelize.QueryTypes.SELECT,
    });
  } catch (e) {
    // Si el SQL no coincide con tus tablas, lo vas a ver acá.
    // No reventamos toda la API: devolvemos vacío y logueamos.
    console.error("[stock_by_branch] SQL error:", e?.message || e);
    return {};
  }

  const map = {};
  for (const r of rows) {
    const pid = Number(r.product_id || 0);
    const bid = Number(r.branch_id || 0);
    const qty = Number(r.qty || 0);
    if (!pid || !bid) continue;

    if (!map[pid]) map[pid] = [];
    map[pid].push({ branch_id: bid, qty });
  }

  // Orden estable (opcional)
  for (const pid of Object.keys(map)) {
    map[pid].sort((a, b) => a.branch_id - b.branch_id);
  }

  return map;
}

module.exports = { getStockByBranchMap };
