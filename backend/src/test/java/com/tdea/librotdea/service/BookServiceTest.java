package com.tdea.librotdea.service;

import com.tdea.librotdea.entity.Book;
import com.tdea.librotdea.entity.BookType;
import com.tdea.librotdea.repository.BookRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookServiceTest {

    @Mock
    private BookRepository bookRepository;

    @InjectMocks
    private BookService bookService;

    private Book sample() {
        return Book.builder()
                .id(1L)
                .name("Aviones")
                .isbnNumber("323234")
                .author("Pepito Perez")
                .publishDate(LocalDate.of(2025, 10, 31))
                .price(999.0)
                .type(BookType.HARDCOVER)
                .build();
    }

    @Test
    void findAllReturnsRepositoryContent() {
        when(bookRepository.findAll()).thenReturn(List.of(sample()));
        assertEquals(1, bookService.findAll().size());
    }

    @Test
    void findByIdReturnsBook() {
        when(bookRepository.findById(1L)).thenReturn(Optional.of(sample()));
        assertEquals("Aviones", bookService.findById(1L).getName());
    }

    @Test
    void findByIdThrowsWhenMissing() {
        when(bookRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(NoSuchElementException.class, () -> bookService.findById(99L));
    }

    @Test
    void saveDelegatesToRepository() {
        Book book = sample();
        when(bookRepository.save(book)).thenReturn(book);
        assertSame(book, bookService.save(book));
        verify(bookRepository).save(book);
    }

    @Test
    void updateForcesTheIdFromThePath() {
        Book incoming = sample();
        incoming.setId(null);
        when(bookRepository.save(any(Book.class))).thenAnswer(inv -> inv.getArgument(0));

        Book result = bookService.update(5L, incoming);

        assertEquals(5L, result.getId());
        verify(bookRepository).save(incoming);
    }

    @Test
    void deleteByIdDelegatesToRepository() {
        bookService.deleteById(1L);
        verify(bookRepository).deleteById(1L);
    }

    @Test
    void findByNameDelegatesToRepository() {
        when(bookRepository.findByNameContainingIgnoreCase("av")).thenReturn(List.of(sample()));
        assertEquals(1, bookService.findByName("av").size());
    }
}
