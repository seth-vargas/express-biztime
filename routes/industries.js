const express = require("express")
const app = express()
const db = require("../db")
const helpers = require("../helpers")
const router = new express.Router()

app.use(express.json())

/* 
    POST /industries

    Needs JSON data passed in as: {code, name}

    Returns {industry: {code, name}}
*/

router.post("/", async function (req, res) {
    try {
        const { code, name } = req.body

        const { rows } = await db.query(`
            INSERT INTO industries
            VALUES ($1, $2)
            RETURNING code, name
        `, [code, name])

        return res.json({ industry: rows[0] })
    } catch (e) {
        return res.status(500).json({ message: `${e}`, route: "POST /industries" })
    }
})

/* 
    GET /industries
    Returns {industries: [{...}]}
*/

router.get("/", async function (req, res) {
    try {
        const { rows } = await db.query(`SELECT code, name FROM industries`)

        return res.json({ industries: rows })
    } catch (e) {
        return res.status(500).json({ message: `${e}`, route: "GET /industries" })
    }
})

/* 
    GET /industries/:code
    Needs JSON data as: {code}
    Returns {companies: [...]}
*/

router.get("/:code", async function (req, res) {
    try {
        const { code } = req.params
        const { rows } = await db.query(`
            SELECT c.name, c.code, i.name as industry
            FROM companies as c
            LEFT JOIN industries_companies as ic
            ON c.code = ic.comp_code
            LEFT JOIN industries as i
            ON ic.industry_code = i.code
            WHERE i.code = $1
        `, [code])

        if (!rows[0]) {
            return helpers.handleNotFoundError(res, code)
        }

        return res.json({ companies: rows })
    } catch (e) {
        return res.status(500).json({ message: `${e}`, route: "GET /industries/:code" })
    }
})

module.exports = router