import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BookList from "./BookList";
import BookService from "../services/BookService";

jest.mock("../services/BookService", () => ({
  __esModule: true,
  default: { getAll: jest.fn(), search: jest.fn(), delete: jest.fn() },
}));

const books = [
  { id: 1, name: "El señor de los anillos", isbnNumber: "6565656", author: "J.R Tolinen", publishDate: "2026-03-02", price: 5656, type: "SOFTCOPY" },
  { id: 2, name: "Aviones", isbnNumber: "323234", author: "Pepito Perez", publishDate: "2025-10-31", price: 999, type: "HARDCOVER" },
];

beforeEach(() => {
  BookService.getAll.mockResolvedValue({ status: 200, data: books });
  BookService.search.mockResolvedValue({ status: 200, data: [books[1]] });
  BookService.delete.mockResolvedValue({ status: 204, data: "" });
});

describe("BookList", () => {
  test("al cargar llama a getAll (useEffect) y pinta los libros en la tabla", async () => {
    render(<BookList />);
    expect(await screen.findByText("El señor de los anillos")).toBeInTheDocument();
    expect(BookService.getAll).toHaveBeenCalledTimes(1);
    expect(BookService.search).not.toHaveBeenCalled();

    ["ID", "Name", "ISBN", "Author", "Publish Date", "Price", "Type", "Actions"].forEach((h) =>
      expect(screen.getByRole("columnheader", { name: h })).toBeInTheDocument()
    );
    const row = screen.getByRole("row", { name: /Aviones/ });
    ["2", "323234", "Pepito Perez", "2025-10-31", "999", "HARDCOVER"].forEach((v) =>
      expect(within(row).getByText(v)).toBeInTheDocument()
    );
    expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(2);
  });

  test("con searchTerm usa search en lugar de getAll", async () => {
    render(<BookList searchTerm="av" />);
    expect(await screen.findByText("Aviones")).toBeInTheDocument();
    expect(BookService.search).toHaveBeenCalledWith("av");
    expect(BookService.getAll).not.toHaveBeenCalled();
    expect(screen.queryByText("El señor de los anillos")).not.toBeInTheDocument();
  });

  test("respuesta 204 (data vacía) muestra No books found", async () => {
    BookService.search.mockResolvedValue({ status: 204, data: "" });
    render(<BookList searchTerm="zzzz" />);
    expect(await screen.findByText("No books found")).toBeInTheDocument();
  });

  test("si el backend falla muestra un mensaje de error", async () => {
    BookService.getAll.mockRejectedValue(new Error("Network Error"));
    render(<BookList />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load the books");
  });

  test("vuelve a consultar cuando cambia refreshKey", async () => {
    const { rerender } = render(<BookList refreshKey={0} />);
    await screen.findByText("Aviones");
    rerender(<BookList refreshKey={1} />);
    await waitFor(() => expect(BookService.getAll).toHaveBeenCalledTimes(2));
  });

  test("Edit entrega el libro al padre", async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    render(<BookList onEdit={onEdit} />);
    const row = await screen.findByRole("row", { name: /Aviones/ });
    await user.click(within(row).getByRole("button", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledWith(books[1]);
  });

  test("Delete con confirmación elimina el libro y avisa al padre", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    const onChanged = jest.fn();
    render(<BookList onChanged={onChanged} />);
    const row = await screen.findByRole("row", { name: /Aviones/ });
    await user.click(within(row).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(BookService.delete).toHaveBeenCalledWith(2));
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith(expect.stringContaining("deleted successfully")));
  });

  test("Delete cancelado en el confirm no llama al backend", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    const onChanged = jest.fn();
    render(<BookList onChanged={onChanged} />);
    const row = await screen.findByRole("row", { name: /Aviones/ });
    await user.click(within(row).getByRole("button", { name: "Delete" }));

    expect(BookService.delete).not.toHaveBeenCalled();
    expect(onChanged).not.toHaveBeenCalled();
  });
});
