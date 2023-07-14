const db = require("./db")

async function getCompanyByCode(code) {
    // Had to change the query to include grabbing the industries associated with the company
    // const result = await db.query(
    //     "SELECT code, name, description FROM companies WHERE code = $1",
    //     [code]
    // );

    // return result.rows[0];

    const { rows } = await db.query(`
        SELECT c.code, c.description, c.name, i.name as industry_name 
        FROM companies as c 
        LEFT JOIN industries_companies as ic 
        ON c.code = ic.comp_code 
        LEFT JOIN industries as i 
        ON ic.industry_code = i.code 
        WHERE c.code = $1
    `, [code])

    return rows;
}

async function getInvoiceById(id) {
    const result = await db.query(
        "SELECT id, amt, paid, add_date, paid_date, comp_code FROM invoices WHERE id = $1",
        [id]
    )
    return result.rows[0]
}

async function getInvoicesByCompany(code) {
    const { rows } = await db.query(
        "SELECT id, comp_code FROM invoices WHERE comp_code = $1",
        [code]
    )
    return rows.map((row) => ({ id: row.id, comp_code: row.comp_code, }))
}

function handleNotFoundError(res, primaryKey) {
    return res.status(404).json({ error: `${primaryKey} not found` });
}

/* 
    creates new date obj in a format we can use in db

    returns yyyy-mm-dd
*/

function newDate() {
    return new Date().toJSON().slice(0, 10)
}

module.exports = { getCompanyByCode, getInvoiceById, getInvoicesByCompany, handleNotFoundError, newDate }