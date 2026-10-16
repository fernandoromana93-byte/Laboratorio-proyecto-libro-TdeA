package com.tdea.librotdea.service;

import com.tdea.librotdea.entity.Book;
import com.tdea.librotdea.repository.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class BookService {

    @Autowired
    private BookRepository bookRepository;

    public List<Book> findAll() {
        return bookRepository.findAll();
    }

    /**
     * @throws NoSuchElementException si no existe un libro con ese id
     */
    public Book findById(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Book not found with id " + id));
    }

    public Book save(Book book) {
        return bookRepository.save(book);
    }

    public void deleteById(Long id) {
        bookRepository.deleteById(id);
    }

    public Book update(Long id, Book book) {
        book.setId(id);
        return bookRepository.save(book);
    }

    public List<Book> findByName(String name) {
        return bookRepository.findByNameContainingIgnoreCase(name);
    }
}
