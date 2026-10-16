package com.tdea.librotdea.repository;

import com.tdea.librotdea.entity.Book;
import com.tdea.librotdea.entity.BookType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class BookRepositoryTest {

    @Autowired
    private BookRepository repository;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        repository.save(book("El señor de los anillos", "6565656", "J.R Tolinen", BookType.SOFTCOPY));
        repository.save(book("Aviones", "323234", "Pepito Perez", BookType.HARDCOVER));
        repository.save(book("Cien años de soledad", "111", "G. Garcia Marquez", BookType.EBOOK));
    }

    private Book book(String name, String isbn, String author, BookType type) {
        return Book.builder()
                .name(name)
                .isbnNumber(isbn)
                .author(author)
                .publishDate(LocalDate.of(2026, 3, 2))
                .price(100.0)
                .type(type)
                .build();
    }

    @Test
    void saveGeneratesId() {
        Book saved = repository.save(book("Nuevo", "999", "Autor", BookType.EBOOK));
        assertNotNull(saved.getId());
        assertEquals(4, repository.count());
    }

    @Test
    void findByNameContainingIgnoreCase_partialMatch() {
        List<Book> result = repository.findByNameContainingIgnoreCase("av");
        assertEquals(1, result.size());
        assertEquals("Aviones", result.get(0).getName());
    }

    @Test
    void findByNameContainingIgnoreCase_ignoresCase() {
        assertEquals(1, repository.findByNameContainingIgnoreCase("SEÑOR").size());
        assertEquals(1, repository.findByNameContainingIgnoreCase("señor").size());
    }

    @Test
    void findByNameContainingIgnoreCase_matchesSeveral() {
        // "o" aparece en los tres títulos
        assertEquals(3, repository.findByNameContainingIgnoreCase("o").size());
    }

    @Test
    void findByNameContainingIgnoreCase_noMatchReturnsEmpty() {
        assertTrue(repository.findByNameContainingIgnoreCase("zzzz").isEmpty());
    }

    @Test
    void enumIsPersisted() {
        Book found = repository.findByNameContainingIgnoreCase("Aviones").get(0);
        assertEquals(BookType.HARDCOVER, found.getType());
    }
}
