const express = require("express")
const app = express()
const db = require("../db")
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


/* Return obj of company: {company: {code, name, description}}. If company cannot be found, return 404 status response. */

router.get("/:code", async (req, res) => {
    try {
        const code = req.params.code
        const result = await db.query(
            "SELECT code, name, description FROM companies WHERE code = $1",
            [code]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ message: `${code} not found` })
        }
        const company = result.rows[0]
        return res.status(200).json({
            company: {
                code: company.code,
                name: company.name,
                description: company.description
            }
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ err: 'An error occurred while getting a company' })
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
        return res.status(201).json({
            company: {
                code: newCompany.code,
                name: newCompany.name,
                description: newCompany.description
            }
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ err: "An error occured while creating a new company" })
    }
})

/* Returns update company object: {company: {code, name, description}}. Should return 404 if company cannot be found. Needs to be given JSON like: {name, description} */

router.put("/:code", async (req, res) => {
    try {
        const code = req.params.code
        const existingCompany = await db.query(
            "SELECT code, name, description FROM companies WHERE code = $1",
            [code]
        )
        if (existingCompany.rows.length === 0) {
            return res.status(404).json({ error: "Company not found" })
        }
        const company = existingCompany.rows[0]
        const name = req.body.name || company.name
        const description = req.body.description || company.description
        const result = await db.query(
            "UPDATE companies SET name = $2, description = $3 WHERE code = $1 RETURNING code, name, description",
            [code, name, description]
        )
        const updatedCompany = result.rows[0]
        return res.status(200).json({
            company: {
                code: updatedCompany.code,
                name: updatedCompany.name,
                description: updatedCompany.description
            }
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ err: "An error occured while updating a company" })
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