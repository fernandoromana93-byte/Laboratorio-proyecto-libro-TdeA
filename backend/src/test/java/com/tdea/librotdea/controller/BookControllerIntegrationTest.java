package com.tdea.librotdea.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tdea.librotdea.entity.Book;
import com.tdea.librotdea.entity.BookType;
import com.tdea.librotdea.repository.BookRepository;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Pruebas de integración de punta a punta: controlador + servicio + repositorio + H2.
 */
@SpringBootTest
@AutoConfigureMockMvc
class BookControllerIntegrationTest {

    private static final String URL = "/api/books";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BookRepository bookRepository;

    @BeforeEach
    void cleanDatabase() {
        bookRepository.deleteAll();
    }

    private Book sample(String name) {
        return Book.builder()
                .name(name)
                .isbnNumber("6565656")
                .author("J.R Tolinen")
                .publishDate(LocalDate.of(2026, 3, 2))
                .price(5656.0)
                .type(BookType.SOFTCOPY)
                .build();
    }

    private String json(Book book) throws Exception {
        return objectMapper.writeValueAsString(book);
    }

    // ---------- CREATE ----------

    @Test
    void createBookReturns201WithLocationAndBody() throws Exception {
        mockMvc.perform(post(URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(sample("El señor de los anillos"))))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", Matchers.containsString("/api/books/")))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("El señor de los anillos"))
                .andExpect(jsonPath("$.isbnNumber").value("6565656"))
                .andExpect(jsonPath("$.author").value("J.R Tolinen"))
                .andExpect(jsonPath("$.publishDate").value("2026-03-02"))
                .andExpect(jsonPath("$.price").value(5656.0))
                .andExpect(jsonPath("$.type").value("SOFTCOPY"));

        assertEquals(1, bookRepository.count());
    }

    @Test
    void createBookWithBlankNameReturns400() throws Exception {
        mockMvc.perform(post(URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"isbnNumber\":\"1\",\"type\":\"EBOOK\"}"))
                .andExpect(status().isBadRequest());
        assertEquals(0, bookRepository.count());
    }

    @Test
    void createBookWithInvalidEnumReturns400() throws Exception {
        mockMvc.perform(post(URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"X\",\"isbnNumber\":\"1\",\"type\":\"PAPERBACK\"}"))
                .andExpect(status().isBadRequest());
    }

    // ---------- READ ----------

    @Test
    void getAllReturnsEmptyListWhenNoBooks() throws Exception {
        mockMvc.perform(get(URL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getAllReturnsAllBooks() throws Exception {
        bookRepository.save(sample("Uno"));
        bookRepository.save(sample("Dos"));

        mockMvc.perform(get(URL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void getByIdReturnsTheBook() throws Exception {
        Book saved = bookRepository.save(sample("Aviones"));

        mockMvc.perform(get(URL + "/" + saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.getId()))
                .andExpect(jsonPath("$.name").value("Aviones"));
    }

    @Test
    void getByIdReturns404WhenMissing() throws Exception {
        mockMvc.perform(get(URL + "/9999"))
                .andExpect(status().isNotFound());
    }

    // ---------- UPDATE ----------

    @Test
    void updateBookReturns200AndPersistsChanges() throws Exception {
        Book saved = bookRepository.save(sample("Original"));
        Book changes = sample("Modificado");
        changes.setPrice(10.5);
        changes.setType(BookType.EBOOK);

        mockMvc.perform(put(URL + "/" + saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(changes)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.getId()))
                .andExpect(jsonPath("$.name").value("Modificado"))
                .andExpect(jsonPath("$.price").value(10.5))
                .andExpect(jsonPath("$.type").value("EBOOK"));

        assertEquals(1, bookRepository.count());
        assertEquals("Modificado", bookRepository.findById(saved.getId()).orElseThrow().getName());
    }

    @Test
    void updateBookReturns404WhenMissing() throws Exception {
        mockMvc.perform(put(URL + "/9999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(sample("Fantasma"))))
                .andExpect(status().isNotFound());
        assertEquals(0, bookRepository.count());
    }

    // ---------- DELETE ----------

    @Test
    void deleteBookReturns204AndRemovesIt() throws Exception {
        Book saved = bookRepository.save(sample("Para borrar"));

        mockMvc.perform(delete(URL + "/" + saved.getId()))
                .andExpect(status().isNoContent());

        assertEquals(0, bookRepository.count());
        mockMvc.perform(get(URL + "/" + saved.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteBookReturns404WhenMissing() throws Exception {
        mockMvc.perform(delete(URL + "/9999"))
                .andExpect(status().isNotFound());
    }

    // ---------- SEARCH ----------

    @Test
    void searchReturnsPartialCaseInsensitiveMatches() throws Exception {
        bookRepository.save(sample("El señor de los anillos"));
        bookRepository.save(sample("Aviones"));

        mockMvc.perform(get(URL + "/search").param("name", "AV"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Aviones"));
    }

    @Test
    void searchReturns204WhenNothingMatches() throws Exception {
        bookRepository.save(sample("Aviones"));

        mockMvc.perform(get(URL + "/search").param("name", "zzzz"))
                .andExpect(status().isNoContent());
    }

    @Test
    void searchWithoutNameParameterReturns400() throws Exception {
        mockMvc.perform(get(URL + "/search"))
                .andExpect(status().isBadRequest());
    }

    // ---------- CORS ----------

    @Test
    void corsPreflightFromReactAppIsAllowed() throws Exception {
        mockMvc.perform(options(URL)
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
    }

    @Test
    void corsFromUnknownOriginIsRejected() throws Exception {
        mockMvc.perform(options(URL)
                        .header("Origin", "http://evil.example.com")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }

    @Test
    void simpleGetFromReactAppIncludesCorsHeader() throws Exception {
        mockMvc.perform(get(URL).header("Origin", "http://localhost:3000"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
    }

    // ---------- OpenAPI / Actuator ----------

    @Test
    void openApiDocumentDescribesTheBookEndpoints() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths[/api/books]").exists())
                .andExpect(jsonPath("$.paths[/api/books/{id}]").exists())
                .andExpect(jsonPath("$.paths[/api/books/search]").exists());
    }

    @Test
    void healthEndpointIsUp() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }
}
