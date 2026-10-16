import axios from "axios";
import BookService, { API_URL } from "./BookService";

jest.mock("axios", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const book = { name: "Aviones", isbnNumber: "323234", author: "Pepito Perez", type: "HARDCOVER" };

describe("BookService (peticiones Axios)", () => {
  beforeEach(() => {
    Object.values(axios).forEach((fn) => fn.mockResolvedValue({ data: [] }));
  });

  test("la URL base apunta al backend en el puerto 8080", () => {
    expect(API_URL).toBe("http://localhost:8080/api/books");
  });

  test("getAll hace GET a /api/books", async () => {
    await BookService.getAll();
    expect(axios.get).toHaveBeenCalledWith(API_URL);
  });

  test("getById hace GET a /api/books/{id}", async () => {
    await BookService.getById(7);
    expect(axios.get).toHaveBeenCalledWith(`${API_URL}/7`);
  });

  test("create hace POST con el libro", async () => {
    await BookService.create(book);
    expect(axios.post).toHaveBeenCalledWith(API_URL, book);
  });

  test("update hace PUT a /api/books/{id} con el libro", async () => {
    await BookService.update(3, book);
    expect(axios.put).toHaveBeenCalledWith(`${API_URL}/3`, book);
  });

  test("delete hace DELETE a /api/books/{id}", async () => {
    await BookService.delete(4);
    expect(axios.delete).toHaveBeenCalledWith(`${API_URL}/4`);
  });

  test("search hace GET a /api/books/search?name=", async () => {
    await BookService.search("av");
    expect(axios.get).toHaveBeenCalledWith(`${API_URL}/search`, { params: { name: "av" } });
  });
});
