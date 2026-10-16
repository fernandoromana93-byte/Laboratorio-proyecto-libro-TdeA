import React, { useEffect, useState } from "react";
import BookService from "../services/BookService";

/**
 * Tabla de libros. Carga los datos con useEffect al montar el componente y
 * cada vez que cambia searchTerm (búsqueda por nombre) o refreshKey (recarga).
 */
function BookList({ searchTerm = "", refreshKey = 0, onEdit, onChanged }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const term = searchTerm.trim();
    const request = term ? BookService.search(term) : BookService.getAll();

    setLoading(true);
    request
      .then((response) => {
        if (cancelled) return;
        // 204 No Content (sin coincidencias) llega con data vacía
        setBooks(Array.isArray(response.data) ? response.data : []);
        setError("");
      })
      .catch(() => {
        if (cancelled) return;
        setBooks([]);
        setError("Could not load the books. Is the backend running on port 8080?");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchTerm, refreshKey]);

  const handleDelete = async (book) => {
    if (!window.confirm(`Delete "${book.name}"?`)) return;
    try {
      await BookService.delete(book.id);
      onChanged && onChanged(`Book "${book.name}" deleted successfully.`);
    } catch (e) {
      setError("The book could not be deleted.");
    }
  };

  return (
    <div className="catalog-card">
      <h4 className="fw-bold mb-3">📚 Book Catalogue</h4>
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}
      <table className="table table-bordered table-hover align-middle text-center">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>ISBN</th>
            <th>Author</th>
            <th>Publish Date</th>
            <th>Price</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {!loading && books.length === 0 && (
            <tr>
              <td colSpan="8">No books found</td>
            </tr>
          )}
          {books.map((book) => (
            <tr key={book.id}>
              <td>{book.id}</td>
              <td className="text-start">{book.name}</td>
              <td>{book.isbnNumber}</td>
              <td>{book.author}</td>
              <td>{book.publishDate}</td>
              <td>{book.price}</td>
              <td>{book.type}</td>
              <td>
                <button
                  type="button"
                  className="btn btn-primary btn-sm me-1"
                  onClick={() => onEdit && onEdit(book)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleDelete(book)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BookList;
