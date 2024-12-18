import pg from "pg";

import express from "express";

import morgan from "morgan";

const app = express();

const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_hr_directory"
);
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(morgan("dev"));

app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `
        SELECT name FROM employees
      `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `
        SELECT name FROM departments
      `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL = `
        INSERT INTO employees(name, department_id)
        VALUES($1, $2)
        RETURNING *
      `;
    const response = await client.query(SQL, [
      req.body.txt,
      req.body.category_id,
    ]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
        UPDATE employees
        SET name=$1, department_id=$2, updated_at= now()
        WHERE id=$3 RETURNING *
      `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
        DELETE from employees
        WHERE id = $1
      `;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

async function init() {
  await client.connect();
  console.log("connected to database");
  let SQL = `
  DROP TABLE IF EXISTS employees;
  DROP TABLE IF EXISTS departments;

  CREATE TABLE departments(
  id SERIAL PRIMARY KEY,
  name VARCHAR(100)
  );
  CREATE TABLE employees(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    department_id INTEGER REFERENCES departments(id) NOT NULL
);
`;
  await client.query(SQL);
  console.log("tables created");

  SQL = `

INSERT INTO departments(name) VALUES('HR');
INSERT INTO departments(name) VALUES('Shipping and Recieving');
INSERT INTO departments(name) VALUES('Call Center');
INSERT INTO employees(name, department_id) VALUES('Jesse', (SELECT id FROM departments WHERE name='HR'));
INSERT INTO employees(name, department_id) VALUES('Cheyenne', (SELECT id FROM departments WHERE name='Call Center'));
INSERT INTO employees(name, department_id) VALUES('Alicia', (SELECT id FROM departments WHERE name='Shipping and Recieving'));
INSERT INTO employees(name, department_id) VALUES('Jay', (SELECT id FROM departments WHERE name='Shipping and Recieving'));
INSERT INTO employees(name, department_id) VALUES('Alya', (SELECT id FROM departments WHERE name='Shipping and Recieving'));
`;

  await client.query(SQL);

  console.log("data seeded");

  app.listen(port, () => console.log(`listening of port ${port}`));
}
init();
