const express = require("express")
const app = express()
const db = require("../db")
const helpers = require("../helpers")
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

/*  
    GET / invoices / [id] -> Gets an invoice

    If invoice cannot be found, returns 404. 

    Returns { invoice: { id, amt, paid, add_date, paid_date, company: { code, name, description } } }.
*/

router.get("/:id", async (req, res) => {
    try {
        const invoice = await helpers.getInvoiceById(req.params.id)
        if (!invoice) {
            return helpers.handleNotFoundError(res, req.params.id)
        }
        const company = await helpers.getCompanyByCode(invoice.comp_code)
        const invoiceData = { ...invoice, company }
        return res.status(200).json({ invoice: invoiceData })
    } catch (error) {
        console.log(error)
        return helpers.handleServerError(res, 'An error occurred while getting an invoice')
    }
})

/*
    POST / invoices -> Adds an invoice

    Returns: { invoice: { id, comp_code, amt, paid, add_date, paid_date }. 
    Needs to be passed in JSON body of: { comp_code, amt } 
*/

router.post("/", async (req, res) => {
    try {
        const { comp_code, amt } = req.body
        const result = await db.query(
            "INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date",
            [comp_code, amt]
        )
        const newInvoice = result.rows[0]
        const invoiceData = {
            id: newInvoice.id,
            comp_code: newInvoice.comp_code,
            amt: newInvoice.amt,
            paid: newInvoice.paid,
            add_date: newInvoice.add_date,
            paid_date: newInvoice.paid_date
        }
        return res.status(201).json({ invoice: invoiceData })
    } catch (error) {
        console.log(error)
        return helpers.handleServerError(res, 'An error occurred while creating invoice')
    }
})

/*  
    PUT /invoices/[id] -> Updates an invoice

    If invoice cannot be found, returns a 404.

    Needs to be passed in a JSON body of {amt, paid}

    If paying unpaid invoice: sets paid_date to today
    If un-paying: sets paid_date to null
    Else: keep current paid_date
    Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}} 
*/

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params
        const { amt, paid } = req.body

        const invoice = await helpers.getInvoiceById(id)

        if (!invoice) {
            return helpers.handleNotFoundError(res, id)
        }

        const currentPaidDate = invoice.paid_date
        let paidDate

        if (paid && !currentPaidDate) {
            paidDate = helpers.newDate()
        } else if (!paid) {
            paidDate = null;
        } else {
            paidDate = currentPaidDate;
        }

        const result = await db.query(
            "UPDATE invoices SET amt = $2, paid = $3, paid_date = $4 WHERE id = $1 RETURNING id, comp_code, amt, paid, add_date, paid_date",
            [id, (amt || invoice.amt), paid, paidDate]
        )

        return res.status(200).json({ invoice: result.rows[0] })
    } catch (error) {
        console.log(error)
        return helpers.handleServerError(res, "An error occured while updating an invoice")
    }
})

/*  
    DELETE / invoices / [id] -> Deletes an invoice. 

    If invoice cannot be found, returns a 404.

    Returns: { status: "deleted" }. 
*/

router.delete("/:id", async (req, res) => {
    try {
        const result = await db.query(
            "DELETE FROM invoices WHERE id = $1",
            [req.params.id]
        )
        if (result.rowCount === 0) {
            return helpers.handleNotFoundError(res, req.params.id)
        }
        return res.status(200).json({ status: "deleted" })
    } catch (error) {
        console.log(error)
        return helpers.handleServerError(res, "An error occured while deleting an invoice")
    }
})

module.exports = router