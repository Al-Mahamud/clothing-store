package com.tanti.store.catalog;

import java.util.List;

/** What the catalog API returns. */
public final class CatalogViews {

    private CatalogViews() {
    }

    public record Swatch(String name, String hex) {
    }

    public record ProductCard(
            long id,
            String slug,
            String name,
            String category,
            int price,
            Integer compareAtPrice,
            String image,
            String hoverImage,
            List<Swatch> colors,
            boolean isNew,
            boolean soldOut) {
    }

    public record CategoryNode(
            long id,
            String name,
            String slug,
            String description,
            String image,
            int productCount,
            List<CategoryNode> children) {
    }

    public record CategoryRef(String name, String slug) {
    }

    public record FacetValue(String value, String label, String hex, int count, boolean selected) {
    }

    public record PriceRange(int min, int max) {
    }

    public record Facets(List<FacetValue> sizes, List<FacetValue> colors, PriceRange price) {
    }

    public record ProductPage(
            List<ProductCard> items,
            int page,
            int pageSize,
            long total,
            Facets facets) {
    }

    public record Image(String url, String alt) {
    }

    public record SizeStock(long variantId, String size, String sku, int stock) {
    }

    public record ColorOption(long id, String name, String hex, List<Image> images, List<SizeStock> sizes) {
    }

    public record ProductDetail(
            long id,
            String slug,
            String name,
            List<CategoryRef> breadcrumb,
            String description,
            List<String> details,
            String fabric,
            String care,
            String fit,
            String sizeChart,
            int price,
            Integer compareAtPrice,
            boolean isNew,
            List<ColorOption> colors) {
    }

    public record CollectionView(
            long id,
            String name,
            String slug,
            String tagline,
            String description,
            String image,
            int productCount) {
    }

    public record Home(
            List<CollectionView> collections,
            List<CategoryNode> categories,
            List<ProductCard> newArrivals,
            List<ProductCard> bestSellers) {
    }
}
