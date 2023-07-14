const express = require("express")
const app = express()
const db = require("../db")
const helpers = require("../helpers")
const { default: slugify } = require("slugify")
const router = new express.Router()

app.use(express.json())

/* 
    GET / companies -> get all companies

    Returns list of companies - {companies: [{code, name}, ...]} 
*/

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
        return res.status(500).json({ message: `${e}` , route: "GET /companies"})
    }
})


/*
    GET / companies / [code] -> get a company

    If company cannot be found, return 404 status response.

    Return obj of company: { company: { code, name, description, invoices: [id, ...] } }. 
*/

router.get("/:code", async (req, res) => {
    try {
        const { code } = req.params
        const [company, invoices] = await Promise.all([helpers.getCompanyByCode(code), helpers.getInvoicesByCompany(code)])

        if (!company[0]) {
            return helpers.handleNotFoundError(res, code)
        }

        const { description, name } = company
        const industries = company.map(r => r.industry_name)

        return res.status(200).json({ company: { code, name, description, industries, invoices } })
    } catch (err) {
        return res.status(500).json({ message: `${e}` , route: "GET /companies/:code"})
    }
})

/* 
    POST / companies -> add a company to db

    Needs to be given JSON like: {code, name, description} 

    Returns obj of new company: {company: {code, name, description}}.
*/

router.post("/", async (req, res) => {
    try {
        const { code, name, description } = req.body
        const result = await db.query(
            "INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description",
            [slugify(code), name, description]
        )
        const newCompany = result.rows[0]
        return res.status(201).json({ company: newCompany })
    } catch (e) {
        return res.status(500).json({ message: `${e}` , route: "POST /companies"})
    }
})

/* 
    PUT / companies / [code] -> updates a company

    Should return 404 if company cannot be found. 
    
    Needs to be given JSON like: {name, description} 

    Returns update company object: {company: {code, name, description}}. 
*/

router.put("/:code", async (req, res) => {
    try {
        const code = req.params.code
        const results = await helpers.getCompanyByCode(code)

        if (!results[0]) {
            return helpers.handleNotFoundError(res, code)
        }
        const existingCompany = results[0]
        const name = req.body.name || existingCompany.name
        const description = req.body.description || existingCompany.description
        const result = await db.query(
            "UPDATE companies SET name = $2, description = $3 WHERE code = $1 RETURNING code, name, description",
            [code, name, description]
        )
        const company = result.rows[0]
        return res.status(200).json({ company })
    } catch (e) {
        return res.status(500).json({ message: `${e}` , route: "PUT /companies/:code"})
    }
})

/* 
    DELETE / companies / [code] -> remove a company from db

    Should return 404 if company cannot be found. 

    Returns {status: "deleted"}. 
*/

router.delete("/:code", async (req, res) => {
    try {
        const code = req.params.code
        const result = await db.query(
            "DELETE FROM companies WHERE code = $1",
            [code]
        )
        if (result.rowCount === 0) {
            return res.status(404).json({ error: `${code} not found` })
        }
        return res.status(200).json({ status: "deleted" })
    } catch (err) {
        return res.status(500).json({ message: `${e}` , route: "DELETE /companies/:code"})
    }
})

module.exports = router