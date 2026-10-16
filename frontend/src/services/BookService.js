import axios from "axios";

// URL base de la API de Spring Boot. Se puede sobreescribir con REACT_APP_API_URL.
export const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8080/api/books";

/**
 * Servicio que encapsula las peticiones HTTP (Axios) hacia el backend.
 * Cada método devuelve la promesa de Axios (res.data contiene el cuerpo).
 */
class BookService {
  getAll() {
    return axios.get(API_URL);
  }

  getById(id) {
    return axios.get(`${API_URL}/${id}`);
  }

  create(book) {
    return axios.post(API_URL, book);
  }

  update(id, book) {
    return axios.put(`${API_URL}/${id}`, book);
  }

  delete(id) {
    return axios.delete(`${API_URL}/${id}`);
  }

  // El backend responde 204 (sin cuerpo) cuando no hay coincidencias
  search(name) {
    return axios.get(`${API_URL}/search`, { params: { name } });
  }
}

const bookService = new BookService();
export default bookService;
