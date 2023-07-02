const db = require("./db")

async function getCompanyByCode(code) {
    const result = await db.query(
        "SELECT code, name, description FROM companies WHERE code = $1",
        [code]
    );

    return result.rows[0];
}

async function getInvoiceById(id) {
    const result = await db.query(
    "SELECT id, amt, paid, add_date, paid_date, comp_code FROM invoices WHERE id = $1",
    [id]
    )
    console.log(result)
    return result.rows[0]
}

async function getInvoicesByCompany(code) {
    const result = await db.query(
        "SELECT id, comp_code FROM invoices WHERE comp_code = $1",
        [code]
    )
    return result.rows.map((row) => ({
        id: row.id,
        comp_code: row.comp_code,
    }))
}

function handleNotFoundError(res, primaryKey) {
    return res.status(404).json({ error: `${primaryKey} not found` });
}

function handleServerError(res, errorMessage) {
    return res.status(500).json({ error: errorMessage });
}

module.exports = { getCompanyByCode, getInvoiceById, getInvoicesByCompany, handleNotFoundError, handleServerError }