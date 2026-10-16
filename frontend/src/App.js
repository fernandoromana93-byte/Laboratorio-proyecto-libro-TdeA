import React, { useState } from "react";
import BookList from "./components/BookList";
import BookForm from "./components/BookForm";

function App() {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [bookToEdit, setBookToEdit] = useState(null);
  const [message, setMessage] = useState("");

  const refresh = (text) => {
    setMessage(text || "");
    setBookToEdit(null);
    setRefreshKey((key) => key + 1);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setMessage("");
    setSearchTerm(searchInput);
  };

  const handleClear = () => {
    setSearchInput("");
    setSearchTerm("");
  };

  return (
    <div className="app-container">
      <h1 className="fw-bold mb-3">📚 Catalogue Management System</h1>

      <form className="d-flex gap-2 mb-3" onSubmit={handleSearch} role="search">
        <input
          className="form-control form-control-sm w-auto"
          type="text"
          placeholder="Search by name"
          aria-label="Search by name"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="btn btn-primary btn-sm">
          Search
        </button>
        {(searchTerm || searchInput) && (
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleClear}>
            Clear
          </button>
        )}
      </form>

      {message && (
        <div className="alert alert-success py-2" role="status">
          {message}
        </div>
      )}

      <BookForm bookToEdit={bookToEdit} onSaved={refresh} onCancel={() => setBookToEdit(null)} />

      <BookList
        searchTerm={searchTerm}
        refreshKey={refreshKey}
        onEdit={setBookToEdit}
        onChanged={refresh}
      />
    </div>
  );
}

export default App;
