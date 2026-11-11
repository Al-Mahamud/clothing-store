package com.tanti.store.catalog;

import java.util.List;

/**
 * Filters for the product grid. Empty lists and nulls mean "no filter".
 *
 * @param category category slug; includes its sub-categories
 * @param collection collection slug
 * @param q search text
 * @param sizes sizes in stock, any of
 * @param colors colour families, any of
 * @param sale only discounted products
 */
public record ProductQuery(
        String category,
        String collection,
        String q,
        List<String> sizes,
        List<ColorFamily> colors,
        Integer minPrice,
        Integer maxPrice,
        boolean sale,
        Sort sort,
        int page,
        int pageSize) {

    public enum Sort {
        RECOMMENDED("p.featured desc, p.sold_count desc, p.created_at desc, p.id desc"),
        NEWEST("p.created_at desc, p.id desc"),
        PRICE_ASC("p.price asc, p.id desc"),
        PRICE_DESC("p.price desc, p.id desc"),
        POPULAR("p.sold_count desc, p.id desc");

        final String orderBy;

        Sort(String orderBy) {
            this.orderBy = orderBy;
        }
    }
}
