package com.tdea.librotdea.controller;

import com.tdea.librotdea.entity.Book;
import com.tdea.librotdea.service.BookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping(value = "/api/books",
        produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Book API", description = "CRUD Operations for Managing books")
public class BookController {

    private final BookService service;

    @Autowired
    public BookController(BookService service) {
        this.service = service;
    }

    // GET ALL
    @GetMapping
    @Operation(summary = "List all books")
    public ResponseEntity<List<Book>> getAllBooks() {
        return ResponseEntity.ok(service.findAll());
    }

    // GET BY ID
    @GetMapping("/{id}")
    @Operation(summary = "Get a book by id")
    public ResponseEntity<Book> getBookById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.findById(id)); // 200
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build(); // 404
        }
    }

    // CREATE
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Create a book")
    public ResponseEntity<Book> addBook(@Valid @RequestBody Book book) {
        Book savedBook = service.save(book);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(savedBook.getId())
                .toUri();
        return ResponseEntity.created(location).body(savedBook); // 201
    }

    // UPDATE (se valida la existencia antes de actualizar)
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Update a book")
    public ResponseEntity<Book> updateBook(@PathVariable Long id, @Valid @RequestBody Book book) {
        try {
            service.findById(id); // lanza NoSuchElementException si no existe
            Book updatedBook = service.update(id, book);
            return ResponseEntity.ok(updatedBook); // 200
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build(); // 404
        }
    }

    // DELETE
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a book")
    public ResponseEntity<Void> deleteBook(@PathVariable Long id) {
        try {
            service.findById(id); // validar existencia
            service.deleteById(id);
            return ResponseEntity.noContent().build(); // 204
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build(); // 404
        }
    }

    // SEARCH por nombre (parcial, sin distinguir mayúsculas)
    @GetMapping("/search")
    @Operation(summary = "Search books by name")
    public ResponseEntity<List<Book>> searchBooks(@RequestParam String name) {
        List<Book> books = service.findByName(name);
        if (books.isEmpty()) {
            return ResponseEntity.noContent().build(); // 204
        }
        return ResponseEntity.ok(books); // 200
    }
}
