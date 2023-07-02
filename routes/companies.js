const express = require("express")
const app = express()
const db = require("../db")
const helpers = require("../helpers")
const router = new express.Router()

app.use(express.json())

/* Returns list of companies - {companies: [{code, name}, ...]} */

router.get("/", async (req, res) => {
    try {
        const results = await db.query(
            `SELECT code, name FROM companies`
        )
        const companies = results.rows.map((row) => ({
            code: row.code,
            name: row.name,
        }))
        return res.status(200).json({ companies: companies })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ err: 'An error occurred while getting all companies' })
    }
})


/*  GET / companies / [code] -> get a company
    Return obj of company: { company: { code, name, description, invoices: [id, ...] } }. If company cannot be found, return 404 status response. */

router.get("/:code", async (req, res) => {
    try {
        const code = req.params.code
        const companyPromise = helpers.getCompanyByCode(code)
        const invoicePromise = helpers.getInvoicesByCompany(code)

        const [company, invoices] = await Promise.all([companyPromise, invoicePromise])

        if (!company) {
            return helpers.handleNotFoundError(res, code)
        }

        return res.status(200).json({
            company: {
                code: company.code,
                name: company.name,
                description: company.description,
                invoices: invoices
            },
        })
    } catch (err) {
        console.log(err)
        return helpers.handleServerError(res, 'An error occurred while getting a company')
    }
})

/* Returns obj of new company: {company: {code, name, description}}. Needs to be given JSON like: {code, name, description} */

router.post("/", async (req, res) => {
    try {
        const { code, name, description } = req.body
        const result = await db.query(
            "INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description",
            [code, name, description]
        )
        const newCompany = result.rows[0]
        return res.status(201).json({ company: newCompany })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ err: "An error occured while creating a new company" })
    }
})

/* Returns update company object: {company: {code, name, description}}. Should return 404 if company cannot be found. Needs to be given JSON like: {name, description} */

router.put("/:code", async (req, res) => {
    try {
        const code = req.params.code
        const existingCompany = await helpers.getCompanyByCode(code)

        if (!existingCompany) {
            return helpers.handleNotFoundError(res, code)
        }
        const name = req.body.name || existingCompany.name
        const description = req.body.description || existingCompany.description
        const result = await db.query(
            "UPDATE companies SET name = $2, description = $3 WHERE code = $1 RETURNING code, name, description",
            [code, name, description]
        )
        const updatedCompany = result.rows[0]
        return res.status(200).json({ company: { updatedCompany } })
    } catch (err) {
        console.log(err)
        return helpers.handleServerError(res, err)
    }
})

/* Returns {status: "deleted"}. Should return 404 if company cannot be found. */

router.delete("/:code", async (req, res) => {
    try {
        const code = req.params.code
        const result = await db.query(
            "DELETE FROM companies WHERE code = $1",
            [code]
        )
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Company not found" })
        }
        return res.status(200).json({ status: "deleted" })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ err: "An error occured while deleting a company" })
    }
})

module.exports = router