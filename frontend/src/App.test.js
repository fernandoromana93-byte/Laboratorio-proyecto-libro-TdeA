import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import BookService from "./services/BookService";

jest.mock("./services/BookService", () => ({
  __esModule: true,
  default: {
    getAll: jest.fn(),
    search: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

let db;

beforeEach(() => {
  db = [
    { id: 1, name: "El señor de los anillos", isbnNumber: "6565656", author: "J.R Tolinen", publishDate: "2026-03-02", price: 5656, type: "SOFTCOPY" },
    { id: 2, name: "Aviones", isbnNumber: "323234", author: "Pepito Perez", publishDate: "2025-10-31", price: 999, type: "HARDCOVER" },
  ];
  // Backend simulado en memoria con el mismo contrato que la API real
  BookService.getAll.mockImplementation(() => Promise.resolve({ status: 200, data: [...db] }));
  BookService.search.mockImplementation((name) => {
    const found = db.filter((b) => b.name.toLowerCase().includes(name.toLowerCase()));
    return Promise.resolve(found.length ? { status: 200, data: found } : { status: 204, data: "" });
  });
  BookService.create.mockImplementation((book) => {
    const saved = { ...book, id: Math.max(0, ...db.map((b) => b.id)) + 1 };
    db.push(saved);
    return Promise.resolve({ status: 201, data: saved });
  });
  BookService.update.mockImplementation((id, book) => {
    db = db.map((b) => (b.id === id ? { ...book, id } : b));
    return Promise.resolve({ status: 200, data: { ...book, id } });
  });
  BookService.delete.mockImplementation((id) => {
    db = db.filter((b) => b.id !== id);
    return Promise.resolve({ status: 204, data: "" });
  });
});

describe("App (flujo completo CRUD + búsqueda)", () => {
  test("muestra el título, el formulario y el listado inicial en una sola pantalla", async () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /Catalogue Management System/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Book" })).toBeInTheDocument();
    expect(screen.getByText(/Book Catalogue/)).toBeInTheDocument();
    expect(await screen.findByText("El señor de los anillos")).toBeInTheDocument();
    expect(screen.getByText("Aviones")).toBeInTheDocument();
  });

  test("agregar un libro: aparece automáticamente en la lista y se confirma la creación", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Aviones");

    await user.type(screen.getByLabelText("Book Name"), "Cien años de soledad");
    await user.type(screen.getByLabelText("ISBN"), "111222");
    await user.type(screen.getByLabelText("Author"), "G. Garcia Marquez");
    fireEvent.change(screen.getByLabelText("Publish Date"), { target: { value: "1967-05-30" } });
    await user.type(screen.getByLabelText("Price"), "50");
    await user.selectOptions(screen.getByLabelText("Type"), "EBOOK");
    await user.click(screen.getByRole("button", { name: "Add Book" }));

    expect(await screen.findByText("Cien años de soledad")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Book created successfully.");
    const row = screen.getByRole("row", { name: /Cien años de soledad/ });
    expect(within(row).getByText("3")).toBeInTheDocument();
    expect(within(row).getByText("EBOOK")).toBeInTheDocument();
    expect(screen.getByLabelText("Book Name")).toHaveValue("");
  });

  test("buscar por nombre filtra la tabla (parcial, sin distinguir mayúsculas) y Clear restaura", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Aviones");

    await user.type(screen.getByLabelText("Search by name"), "AV");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => expect(screen.queryByText("El señor de los anillos")).not.toBeInTheDocument());
    expect(screen.getByText("Aviones")).toBeInTheDocument();
    expect(BookService.search).toHaveBeenCalledWith("AV");

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(await screen.findByText("El señor de los anillos")).toBeInTheDocument();
    expect(screen.getByText("Aviones")).toBeInTheDocument();
  });

  test("buscar un nombre inexistente muestra No books found", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Aviones");

    await user.type(screen.getByLabelText("Search by name"), "zzzz");
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(await screen.findByText("No books found")).toBeInTheDocument();
  });

  test("editar un libro: precarga el formulario, actualiza y refleja el cambio en la tabla", async () => {
    const user = userEvent.setup();
    render(<App />);
    const row = await screen.findByRole("row", { name: /Aviones/ });
    await user.click(within(row).getByRole("button", { name: "Edit" }));

    expect(screen.getByText("Edit Book")).toBeInTheDocument();
    expect(screen.getByLabelText("Book Name")).toHaveValue("Aviones");

    await user.clear(screen.getByLabelText("Book Name"));
    await user.type(screen.getByLabelText("Book Name"), "Aviones y helicópteros");
    await user.click(screen.getByRole("button", { name: "Update Book" }));

    expect(await screen.findByText("Aviones y helicópteros")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Book updated successfully.");
    expect(BookService.update).toHaveBeenCalledWith(2, expect.objectContaining({ name: "Aviones y helicópteros" }));
    expect(screen.getByText("Add Book", { selector: "h5" })).toBeInTheDocument();
  });

  test("eliminar un libro: desaparece de la lista y se confirma la eliminación", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(<App />);
    const row = await screen.findByRole("row", { name: /Aviones/ });
    await user.click(within(row).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(screen.queryByText("Aviones")).not.toBeInTheDocument());
    expect(screen.getByText("El señor de los anillos")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("deleted successfully");
    expect(BookService.delete).toHaveBeenCalledWith(2);
  });
});
