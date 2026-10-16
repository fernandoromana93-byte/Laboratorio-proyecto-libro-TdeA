/**
 * @jest-environment node
 *
 * Prueba de integración: BookService usa Axios REAL contra un servidor HTTP local
 * que imita el contrato de la API de Spring Boot (códigos 200/201/204/400/404 y CORS).
 */
import http from "http";

let server;
let BookService;
let store = [];
let nextId = 1;

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data ? JSON.parse(data) : null));
  });
}

function send(res, status, body) {
  const headers = {
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  res.writeHead(status, headers);
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

async function handler(req, res) {
  const url = new URL(req.url, "http://localhost");
  const path = url.pathname;

  if (req.method === "OPTIONS") return send(res, 200);

  if (path === "/api/books" && req.method === "GET") return send(res, 200, store);

  if (path === "/api/books/search" && req.method === "GET") {
    const name = url.searchParams.get("name");
    if (name === null) return send(res, 400);
    const found = store.filter((b) => b.name.toLowerCase().includes(name.toLowerCase()));
    return found.length ? send(res, 200, found) : send(res, 204);
  }

  if (path === "/api/books" && req.method === "POST") {
    const body = await readBody(req);
    if (!body.name || !body.name.trim()) return send(res, 400);
    const saved = { ...body, id: nextId++ };
    store.push(saved);
    return send(res, 201, saved);
  }

  const match = path.match(/^\/api\/books\/(\d+)$/);
  if (match) {
    const id = Number(match[1]);
    const index = store.findIndex((b) => b.id === id);
    if (index === -1) return send(res, 404);
    if (req.method === "GET") return send(res, 200, store[index]);
    if (req.method === "PUT") {
      const body = await readBody(req);
      store[index] = { ...body, id };
      return send(res, 200, store[index]);
    }
    if (req.method === "DELETE") {
      store.splice(index, 1);
      return send(res, 204);
    }
  }
  return send(res, 404);
}

beforeAll((done) => {
  server = http.createServer(handler).listen(0, () => {
    process.env.REACT_APP_API_URL = `http://localhost:${server.address().port}/api/books`;
    BookService = require("./BookService").default;
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

beforeEach(() => {
  store = [];
  nextId = 1;
});

const sample = (name) => ({
  name,
  isbnNumber: "6565656",
  author: "J.R Tolinen",
  publishDate: "2026-03-02",
  price: 5656,
  type: "SOFTCOPY",
});

describe("BookService contra un servidor HTTP real", () => {
  test("create -> 201 y el libro recibe id", async () => {
    const res = await BookService.create(sample("El señor de los anillos"));
    expect(res.status).toBe(201);
    expect(res.data.id).toBe(1);
    expect(res.data.name).toBe("El señor de los anillos");
  });

  test("getAll devuelve los libros creados", async () => {
    await BookService.create(sample("Uno"));
    await BookService.create(sample("Dos"));
    const res = await BookService.getAll();
    expect(res.status).toBe(200);
    expect(res.data).toHaveLength(2);
  });

  test("getById devuelve el libro y 404 si no existe", async () => {
    await BookService.create(sample("Aviones"));
    const ok = await BookService.getById(1);
    expect(ok.data.name).toBe("Aviones");
    await expect(BookService.getById(99)).rejects.toMatchObject({ response: { status: 404 } });
  });

  test("update -> 200 y cambia los datos", async () => {
    await BookService.create(sample("Original"));
    const res = await BookService.update(1, { ...sample("Modificado"), price: 10 });
    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({ id: 1, name: "Modificado", price: 10 });
    expect((await BookService.getAll()).data[0].name).toBe("Modificado");
  });

  test("delete -> 204 y el libro desaparece", async () => {
    await BookService.create(sample("Borrar"));
    const res = await BookService.delete(1);
    expect(res.status).toBe(204);
    expect((await BookService.getAll()).data).toHaveLength(0);
  });

  test("search -> 200 con coincidencias parciales sin distinguir mayúsculas", async () => {
    await BookService.create(sample("El señor de los anillos"));
    await BookService.create(sample("Aviones"));
    const res = await BookService.search("AV");
    expect(res.status).toBe(200);
    expect(res.data).toHaveLength(1);
    expect(res.data[0].name).toBe("Aviones");
  });

  test("search -> 204 sin cuerpo cuando no hay coincidencias", async () => {
    await BookService.create(sample("Aviones"));
    const res = await BookService.search("zzzz");
    expect(res.status).toBe(204);
    expect(Array.isArray(res.data)).toBe(false);
  });

  test("create con nombre vacío -> 400", async () => {
    await expect(BookService.create(sample(""))).rejects.toMatchObject({ response: { status: 400 } });
  });
});
