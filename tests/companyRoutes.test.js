// Tests for company routes

process.env.NODE_ENV = "test";

const request = require('supertest');
const app = require('../app');
const db = require("../db");

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

describe("GET / companies / ", () => {
    test("Returns list of companies - {companies: [{code, name}, ...]} ", async function () {
        const response = await request(app)
            .get("/companies")

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            companies: [{
                code: "test",
                name: "Test Company"
            }]
        })
    })
})

describe("POST / companies /", () => {
    test("Return obj of company: { company: { code, name, description, invoices: [id, ...] } }.", async function () {
        const response = await request(app)
            .post("/companies")
            .send({ code: "new", name: "New Test Company", description: "This is a new test company" })

        expect(response.status).toBe(201)
        expect(response.body).toEqual({
            company: {
                code: 'new',
                name: 'New Test Company',
                description: 'This is a new test company'
            }
        })
    })
})

describe("GET / companies / [code]", () => {
    test("Returns obj of new company: {company: {code, industries: [...], invoices: [...]}}.", async function () {
        const response = await request(app)
            .get("/companies/test")

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            "company": {
                "code": "test",
                "industries": [null],
                "invoices": [{
                    "id": 1,
                    "comp_code": "test",
                }]
            }
        })
    })

    test("Returns 404 message if resource is not found", async function () {
        const response = await request(app)
            .get("/companies/missing")

        expect(response.status).toBe(404)
        expect(response.body).toEqual({"error": "missing not found"})
    })
})

describe("PUT / companies / [code]", () => {
    test("Returns update company object: {company: {code, name, description}}. ", async function () {
        const response = await request(app)
            .put("/companies/test")
            .send({name: "updated"})

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            company: {
                code: "test", 
                name: "updated",
                description: "This is a test company."
            }
        })
    })

    test("Returns 404 message if resource is not found", async function () {
        const response = await request(app)
            .put("/companies/missing")

        expect(response.status).toBe(404)
        expect(response.body).toEqual({"error": "missing not found"})
    })
})

describe("DELETE / companies / [code]", () => {
    test("Returns {status: 'deleted'}. ", async function () {
        const response = await request(app)
            .delete("/companies/test")

        expect(response.status).toBe(200)
        expect(response.body).toEqual({status: "deleted"})
    })

    test("Returns 404 message if resource is not found", async function () {
        const response = await request(app)
            .delete("/companies/missing")

        expect(response.status).toBe(404)
        expect(response.body).toEqual({"error": "missing not found"})
    })
})

afterAll(async function () {
    // close db connection
    await db.end();
});