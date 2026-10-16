import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BookForm from "./BookForm";
import BookService from "../services/BookService";

jest.mock("../services/BookService", () => ({
  __esModule: true,
  default: { create: jest.fn(), update: jest.fn() },
}));

const existing = {
  id: 5,
  name: "Aviones",
  isbnNumber: "323234",
  author: "Pepito Perez",
  publishDate: "2025-10-31",
  price: 999,
  type: "HARDCOVER",
};

beforeEach(() => {
  BookService.create.mockResolvedValue({ status: 201, data: {} });
  BookService.update.mockResolvedValue({ status: 200, data: {} });
});

describe("BookForm", () => {
  test("muestra todos los campos del libro y el botón Add Book", () => {
    render(<BookForm />);
    ["Book Name", "ISBN", "Author", "Publish Date", "Price", "Type"].forEach((label) =>
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: "Add Book" })).toBeInTheDocument();
    expect(screen.getByLabelText("Type")).toHaveValue("HARDCOVER");
    expect(screen.getAllByRole("option").map((o) => o.value)).toEqual(["EBOOK", "SOFTCOPY", "HARDCOVER"]);
  });

  test("crear: envía el libro por POST, avisa al padre y limpia el formulario", async () => {
    const user = userEvent.setup();
    const onSaved = jest.fn();
    render(<BookForm onSaved={onSaved} />);

    await user.type(screen.getByLabelText("Book Name"), "El señor de los anillos");
    await user.type(screen.getByLabelText("ISBN"), "6565656");
    await user.type(screen.getByLabelText("Author"), "J.R Tolinen");
    fireEvent.change(screen.getByLabelText("Publish Date"), { target: { value: "2026-03-02" } });
    await user.type(screen.getByLabelText("Price"), "5656");
    await user.selectOptions(screen.getByLabelText("Type"), "SOFTCOPY");
    await user.click(screen.getByRole("button", { name: "Add Book" }));

    await waitFor(() => expect(BookService.create).toHaveBeenCalledTimes(1));
    expect(BookService.create).toHaveBeenCalledWith({
      name: "El señor de los anillos",
      isbnNumber: "6565656",
      author: "J.R Tolinen",
      publishDate: "2026-03-02",
      price: 5656,
      type: "SOFTCOPY",
    });
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith("Book created successfully."));
    expect(screen.getByLabelText("Book Name")).toHaveValue("");
    expect(screen.getByLabelText("Price")).toHaveValue(null);
  });

  test("no llama al backend si el nombre solo tiene espacios", async () => {
    const user = userEvent.setup();
    render(<BookForm />);
    await user.type(screen.getByLabelText("Book Name"), "   ");
    await user.type(screen.getByLabelText("ISBN"), "123");
    await user.click(screen.getByRole("button", { name: "Add Book" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Name and ISBN are required.");
    expect(BookService.create).not.toHaveBeenCalled();
  });

  test("muestra un error si el backend falla", async () => {
    BookService.create.mockRejectedValue(new Error("Network Error"));
    const user = userEvent.setup();
    const onSaved = jest.fn();
    render(<BookForm onSaved={onSaved} />);
    await user.type(screen.getByLabelText("Book Name"), "X");
    await user.type(screen.getByLabelText("ISBN"), "1");
    await user.click(screen.getByRole("button", { name: "Add Book" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("could not be saved");
    expect(onSaved).not.toHaveBeenCalled();
  });

  test("editar: precarga los datos y envía el libro por PUT con su id", async () => {
    const user = userEvent.setup();
    const onSaved = jest.fn();
    render(<BookForm bookToEdit={existing} onSaved={onSaved} />);

    expect(screen.getByText("Edit Book")).toBeInTheDocument();
    expect(screen.getByLabelText("Book Name")).toHaveValue("Aviones");
    expect(screen.getByLabelText("ISBN")).toHaveValue("323234");
    expect(screen.getByLabelText("Publish Date")).toHaveValue("2025-10-31");
    expect(screen.getByLabelText("Price")).toHaveValue(999);

    await user.clear(screen.getByLabelText("Book Name"));
    await user.type(screen.getByLabelText("Book Name"), "Aviones 2");
    await user.click(screen.getByRole("button", { name: "Update Book" }));

    await waitFor(() => expect(BookService.update).toHaveBeenCalledTimes(1));
    expect(BookService.update).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ name: "Aviones 2", isbnNumber: "323234", price: 999, type: "HARDCOVER" })
    );
    expect(BookService.create).not.toHaveBeenCalled();
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith("Book updated successfully."));
  });

  test("el botón Cancel avisa al padre", async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    render(<BookForm bookToEdit={existing} onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
