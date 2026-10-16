import React, { useEffect, useState } from "react";
import BookService from "../services/BookService";

export const BOOK_TYPES = ["EBOOK", "SOFTCOPY", "HARDCOVER"];

const EMPTY_FORM = {
  name: "",
  isbnNumber: "",
  author: "",
  publishDate: "",
  price: "",
  type: "HARDCOVER",
};

/**
 * Formulario para crear (POST) o editar (PUT) un libro.
 * - bookToEdit: si viene definido, el formulario entra en modo edición.
 * - onSaved(message): se llama cuando el backend confirma la operación.
 * - onCancel(): cancela la edición.
 */
function BookForm({ bookToEdit, onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bookToEdit) {
      setForm({
        name: bookToEdit.name ?? "",
        isbnNumber: bookToEdit.isbnNumber ?? "",
        author: bookToEdit.author ?? "",
        publishDate: bookToEdit.publishDate ?? "",
        price: bookToEdit.price ?? "",
        type: bookToEdit.type ?? "HARDCOVER",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError("");
  }, [bookToEdit]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.isbnNumber.trim()) {
      setError("Name and ISBN are required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      isbnNumber: form.isbnNumber.trim(),
      author: form.author.trim(),
      publishDate: form.publishDate || null,
      price: form.price === "" ? null : Number(form.price),
      type: form.type,
    };

    setSaving(true);
    setError("");
    try {
      if (bookToEdit) {
        await BookService.update(bookToEdit.id, payload);
        onSaved && onSaved("Book updated successfully.");
      } else {
        await BookService.create(payload);
        setForm(EMPTY_FORM);
        onSaved && onSaved("Book created successfully.");
      }
    } catch (e) {
      setError("The book could not be saved. Is the backend running on port 8080?");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="mb-4" onSubmit={handleSubmit} aria-label="book form">
      <h5 className="fw-bold">{bookToEdit ? "Edit Book" : "Add Book"}</h5>
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}
      <div className="row g-2 align-items-center">
        <div className="col-auto">
          <input
            className="form-control form-control-sm"
            name="name"
            placeholder="Book Name"
            aria-label="Book Name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-auto">
          <input
            className="form-control form-control-sm"
            name="isbnNumber"
            placeholder="ISBN"
            aria-label="ISBN"
            value={form.isbnNumber}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-auto">
          <input
            className="form-control form-control-sm"
            name="author"
            placeholder="Author"
            aria-label="Author"
            value={form.author}
            onChange={handleChange}
          />
        </div>
        <div className="col-auto">
          <input
            className="form-control form-control-sm"
            type="date"
            name="publishDate"
            aria-label="Publish Date"
            value={form.publishDate}
            onChange={handleChange}
          />
        </div>
        <div className="col-auto">
          <input
            className="form-control form-control-sm"
            type="number"
            step="0.01"
            min="0"
            name="price"
            placeholder="Price"
            aria-label="Price"
            value={form.price}
            onChange={handleChange}
          />
        </div>
        <div className="col-auto">
          <select
            className="form-select form-select-sm"
            name="type"
            aria-label="Type"
            value={form.type}
            onChange={handleChange}
          >
            {BOOK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="col-auto">
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {bookToEdit ? "Update Book" : "Add Book"}
          </button>
          {bookToEdit && (
            <button
              type="button"
              className="btn btn-secondary btn-sm ms-2"
              onClick={() => onCancel && onCancel()}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

export default BookForm;
