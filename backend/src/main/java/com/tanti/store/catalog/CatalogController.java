package com.tanti.store.catalog;

import com.tanti.store.catalog.CatalogViews.CategoryNode;
import com.tanti.store.catalog.CatalogViews.CollectionView;
import com.tanti.store.catalog.CatalogViews.Home;
import com.tanti.store.catalog.CatalogViews.ProductCard;
import com.tanti.store.catalog.CatalogViews.ProductDetail;
import com.tanti.store.catalog.CatalogViews.ProductPage;
import com.tanti.store.shared.ApiException;
import java.util.Arrays;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
class CatalogController {

    private static final int MAX_PAGE_SIZE = 48;

    private final CatalogService catalog;
    private final ProductSearch search;

    CatalogController(CatalogService catalog, ProductSearch search) {
        this.catalog = catalog;
        this.search = search;
    }

    @GetMapping("/home")
    Home home() {
        return catalog.home();
    }

    @GetMapping("/categories")
    List<CategoryNode> categories() {
        return catalog.categoryTree();
    }

    @GetMapping("/categories/{slug}")
    CategoryNode category(@PathVariable String slug) {
        return catalog.category(slug);
    }

    @GetMapping("/collections")
    List<CollectionView> collections() {
        return catalog.collections();
    }

    @GetMapping("/collections/{slug}")
    CollectionView collection(@PathVariable String slug) {
        return catalog.collection(slug);
    }

    /**
     * Product grid. {@code size} and {@code color} take comma-separated values;
     * {@code sort} is one of recommended, newest, price_asc, price_desc, popular.
     */
    @GetMapping("/products")
    ProductPage products(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String collection,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(defaultValue = "false") boolean sale,
            @RequestParam(defaultValue = "recommended") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int pageSize) {
        if (page < 0 || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
            throw ApiException.badRequest("request.paging", "Page must be 0 or more and page size 1 to 48.");
        }
        ProductQuery.Sort order = Arrays.stream(ProductQuery.Sort.values())
                .filter(s -> s.name().equalsIgnoreCase(sort)).findFirst()
                .orElseThrow(() -> ApiException.badRequest("request.sort", "Unknown sort order."));
        List<ColorFamily> colors = split(color).stream()
                .map(c -> ColorFamily.parse(c).orElseThrow(
                        () -> ApiException.badRequest("request.color", "Unknown colour: " + c)))
                .distinct()
                .toList();
        return search.search(new ProductQuery(blankToNull(category), blankToNull(collection), blankToNull(q),
                split(size), colors, minPrice, maxPrice, sale, order, page, pageSize));
    }

    @GetMapping("/products/{slug}")
    ProductDetail product(@PathVariable String slug) {
        return catalog.product(slug);
    }

    @GetMapping("/products/{slug}/related")
    List<ProductCard> related(@PathVariable String slug) {
        return catalog.related(slug, 8);
    }

    private static List<String> split(String value) {
        if (value == null) {
            return List.of();
        }
        return Arrays.stream(value.split(",")).map(String::trim).filter(s -> !s.isEmpty()).distinct().limit(20)
                .toList();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
