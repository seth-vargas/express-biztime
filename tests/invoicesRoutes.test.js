// Tests for invoice routes

process.env.NODE_ENV = "test"

const request = require('supertest')
const app = require('../app')
const db = require("../db")

beforeAll(async function () {
    await db.query("DROP TABLE IF EXISTS industries_companies")
    await db.query("DROP TABLE IF EXISTS industries")
    await db.query("DROP TABLE IF EXISTS invoices")
    await db.query("DROP TABLE IF EXISTS companies")

    await db.query(`
        CREATE TABLE companies (
            code text PRIMARY KEY,
            name text NOT NULL UNIQUE,
            description text
        );
    `)
    await db.query(`
         CREATE TABLE invoices (
            id serial PRIMARY KEY,
            comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
            amt float NOT NULL,
            paid boolean DEFAULT false NOT NULL,
            add_date date DEFAULT CURRENT_DATE NOT NULL,
            paid_date date,
            CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
        );
    `)
    await db.query(`
        CREATE TABLE industries (
            code text PRIMARY KEY,
            name text UNIQUE
        );
     `)
    await db.query(`
        CREATE TABLE industries_companies(
            industry_code text NOT NULL REFERENCES industries ON DELETE CASCADE,
            comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
            PRIMARY KEY(industry_code, comp_code)
        );
    `)
    await db.query(`
        INSERT INTO companies
        VALUES ('test', 'Test Company', 'This is a test company.');
    `)
    await db.query(`
        INSERT INTO invoices (comp_Code, amt, paid, paid_date)
        VALUES ('test', 100, false, null);
    `)
})

describe("GET / invoices / ", () => {
    test('Returns {invoices: [{id, comp_code}, ...]}', async function () {
        const response = await request(app)
            .get("/invoices")

        expect(response.status).toBe(200)
        expect(response.body).toEqual({ invoices: [{ id: 1, comp_code: "test" }] })
    })
})

describe("POST / invoices /", () => {
    test('Returns { invoice: { id, comp_code, amt, paid, add_date, paid_date }.', async function () {
        const response = await request(app)
            .post("/invoices")
            .send({
                "comp_code": "test",
                "amt": 99.99
            })

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty("invoice")
        expect(response.body.invoice).toHaveProperty("id")
        expect(response.body.invoice.comp_code).toBe("test")
        expect(response.body.invoice.amt).toBe(99.99)
    })
})

describe("GET / invoices / [id]", () => {
    test('Returns: { invoice: { id, comp_code, amt, paid, add_date, paid_date }.', async function () {
        const response = await request(app)
            .get("/invoices/1")

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty("invoice")
    })

    test("Returns 404 message if invoice is not found", async function () {
        const response = await request(app)
            .get("/invoices/-209")

        expect(response.status).toBe(404)
        expect(response.body).toEqual({ "error": "-209 not found" })
    })
})

describe("PUT / invoices / [id]", () => {
    test('Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}} ', async function () {
        const response = await request(app)
            .put("/invoices/1")
            .send({
                amt: 99,
                paid: true
            })

        expect(response.status).toBe(200)
        expect(response.body.invoice).toHaveProperty("id")
        expect(response.body.invoice).toHaveProperty("comp_code")
        expect(response.body.invoice).toHaveProperty("amt")
        expect(response.body.invoice).toHaveProperty("paid")
        expect(response.body.invoice).toHaveProperty("add_date")
        expect(response.body.invoice).toHaveProperty("paid_date")
    })

    test("Returns 404 message if invoice is not found", async function () {
        const response = await request(app)
            .put("/invoices/-209")

        expect(response.status).toBe(404)
        expect(response.body).toEqual({ "error": "-209 not found" })
    })
})

describe("DELETE / invoices / [id]", () => {
    test('Returns: { status: "deleted" }. ', async function () {
        const response = await request(app)
            .delete("/invoices/1")

        expect(response.status).toBe(200)
        expect(response.body).toEqual({ status: "deleted" })
    })
    test("Returns 404 message if invoice is not found", async function () {
        const response = await request(app)
            .delete("/invoices/-209")

        expect(response.status).toBe(404)
        expect(response.body).toEqual({ "error": "-209 not found" })
    })

})

afterAll(async function () {
    // close db connection
    await db.end();
});