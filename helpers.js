const db = require("./db")

async function getCompanyByCode(code) {
    const result = await db.query(
        "SELECT code, name, description FROM companies WHERE code = $1",
        [code]
    );

    return result.rows[0];
}

function handleNotFoundError(res, code) {
    return res.status(404).json({ error: `${code} not found` });
}

function handleServerError(res, errorMessage) {
    return res.status(500).json({ error: errorMessage });
}

module.exports = { getCompanyByCode, handleNotFoundError, handleServerError }