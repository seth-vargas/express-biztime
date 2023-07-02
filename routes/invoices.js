const express = require("express")
const app = express()
const db = require("../db")
const router = new express.Router()

app.use(express.json())

/* Return info on invoices: -> {invoices: [{id, comp_code}, ...]} */

router.get("/", async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, comp_code FROM invoices"
        )
        const invoices = result.rows.map((row) => ({
            id: row.id,
            comp_code: row.comp_code,
        }))
        return res.status(200).json({ invoices: invoices })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ err: 'An error occurred while getting all invoices' })
    }
})

/* Returns { invoice: { id, amt, paid, add_date, paid_date, company: { code, name, description } } }. If invoice cannot be found, returns 404. */

router.get("/:id", async (req, res) => {
    try {
        const invoiceResult = await db.query(
            "SELECT id, amt, paid, add_date, paid_invoice FROM invoices WHERE id = $1",
            [req.params.id]
        )
        if (invoiceResult.rows.length === 0) {
            return res.status(404).json({ message: `ID ${id} not found` })
        }
        const invoiceData = invoiceResult.rows[0]
        const companyResult = await db.query(
            "SELECT code, name, description FROM companies WHERE code = $1",
            [invoiceData.comp_code]
        )
        const companyData = companyResult.rows[0]
        const company = {
            code: 
        }
        const invoice = {
            id: invoiceData.id,
            amt: invoiceData.amt,
            paid: invoiceData.paid,
            add_date: invoiceData.add_date,
            paid_date: invoiceData.paid_date,
            company: company
        }
        return res.status(200).json({
            company: {
                id: company.id,
                name: company.name,
                description: company.description
            }
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ err: 'An error occurred while getting all invoices' })
    }
})

POST / invoices
Adds an invoice.

Needs to be passed in JSON body of: { comp_code, amt }

Returns: { invoice: { id, comp_code, amt, paid, add_date, paid_date } }

PUT / invoices / [id]
Updates an invoice.

If invoice cannot be found, returns a 404.

Needs to be passed in a JSON body of { amt }

Returns: { invoice: { id, comp_code, amt, paid, add_date, paid_date } }

DELETE / invoices / [id]
Deletes an invoice.

If invoice cannot be found, returns a 404.

Returns: { status: "deleted" }

Also, one route from the previous part should be updated:

GET / companies / [code]
Return obj of company: { company: { code, name, description, invoices: [id, ...] } }

If the company given cannot be found, this should return a 404 status response.

    module.exports = router