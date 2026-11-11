package com.tanti.store.catalog;

import com.tanti.store.catalog.CatalogViews.Facets;
import com.tanti.store.catalog.CatalogViews.FacetValue;
import com.tanti.store.catalog.CatalogViews.PriceRange;
import com.tanti.store.catalog.CatalogViews.ProductCard;
import com.tanti.store.catalog.CatalogViews.ProductPage;
import com.tanti.store.catalog.CatalogViews.Swatch;
import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/** Finds active products for grids, with facet counts for the filter panel. */
@Service
public class ProductSearch {

    /** Products added within this period carry the "New" badge. */
    static final Duration NEW_FOR = Duration.ofDays(30);

    private static final TypeReference<List<Swatch>> SWATCHES = new TypeReference<>() {
    };

    private final JdbcClient jdbc;
    private final JsonMapper json;

    ProductSearch(JdbcClient jdbc, JsonMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    public ProductPage search(ProductQuery query) {
        Where where = where(query, Facet.NONE);
        long total = jdbc.sql("select count(*) from products p where " + where.sql)
                .params(where.params).query(Long.class).single();
        List<ProductCard> items = cards(where.sql, where.params, query.sort().orderBy, query.pageSize(),
                (long) query.page() * query.pageSize(), query.colors());
        return new ProductPage(items, query.page(), query.pageSize(), total, facets(query));
    }

    /** Cards for an arbitrary filter: home page rails, related products. */
    public List<ProductCard> cards(String whereSql, Map<String, ?> params, String orderBy, int limit) {
        return cards("p.status = 'ACTIVE' and (" + whereSql + ")", params, orderBy, limit, 0, List.of());
    }

    private List<ProductCard> cards(String whereSql, Map<String, ?> params, String orderBy, int limit, long offset,
                                    List<ColorFamily> preferredColors) {
        Map<String, Object> all = new HashMap<>(params);
        all.put("limit", limit);
        all.put("offset", offset);
        String imageOrder = "pc.position nulls last, pi.position, pi.id";
        if (!preferredColors.isEmpty()) {
            all.put("preferredColors", preferredColors.stream().map(Enum::name).toList());
            imageOrder = "case when pc.family in (:preferredColors) then 0 else 1 end, " + imageOrder;
        }
        String sql = """
                select p.id, p.slug, p.name, c.name as category, p.price, p.compare_at_price, p.created_at,
                       (select coalesce(json_agg(json_build_object('name', pc.name, 'hex', pc.hex)
                                                 order by pc.position), '[]')
                          from product_colors pc where pc.product_id = p.id) as colors,
                       array(select pi.url from product_images pi
                               left join product_colors pc on pc.id = pi.color_id
                              where pi.product_id = p.id
                              order by %s limit 2) as images,
                       exists (select 1 from variants v where v.product_id = p.id and v.stock > 0) as in_stock
                  from products p
                  join categories c on c.id = p.category_id
                 where %s
                 order by %s
                 limit :limit offset :offset
                """.formatted(imageOrder, whereSql, orderBy);
        Instant newSince = Instant.now().minus(NEW_FOR);
        return jdbc.sql(sql).params(all).query((rs, n) -> card(rs, newSince)).list();
    }

    private ProductCard card(ResultSet rs, Instant newSince) throws SQLException {
        String[] images = strings(rs.getArray("images"));
        int compareAt = rs.getInt("compare_at_price");
        return new ProductCard(
                rs.getLong("id"),
                rs.getString("slug"),
                rs.getString("name"),
                rs.getString("category"),
                rs.getInt("price"),
                rs.wasNull() || compareAt == 0 ? null : compareAt,
                images.length > 0 ? images[0] : null,
                images.length > 1 ? images[1] : null,
                json.readValue(rs.getString("colors"), SWATCHES),
                rs.getTimestamp("created_at").toInstant().isAfter(newSince),
                !rs.getBoolean("in_stock"));
    }

    private static String[] strings(Array array) throws SQLException {
        return array == null ? new String[0] : (String[]) array.getArray();
    }

    private Facets facets(ProductQuery query) {
        Where forSizes = where(query, Facet.SIZE);
        Map<String, Object> sizeParams = new HashMap<>(forSizes.params);
        String colorOnVariant = "";
        if (!query.colors().isEmpty()) {
            colorOnVariant = " and pc.family in (:facetColors)";
            sizeParams.put("facetColors", query.colors().stream().map(Enum::name).toList());
        }
        List<FacetValue> sizes = jdbc.sql("""
                        select v.size, min(v.position) as position, count(distinct p.id) as n
                          from products p
                          join variants v on v.product_id = p.id and v.stock > 0
                          join product_colors pc on pc.id = v.color_id
                         where %s %s
                         group by v.size
                         order by position, v.size
                        """.formatted(forSizes.sql, colorOnVariant))
                .params(sizeParams)
                .query((rs, n) -> {
                    String size = rs.getString("size");
                    return new FacetValue(size, size, null, rs.getInt("n"),
                            query.sizes().stream().anyMatch(size::equalsIgnoreCase));
                })
                .list();

        Where forColors = where(query, Facet.COLOR);
        Map<String, Integer> colorCounts = jdbc.sql("""
                        select pc.family, count(distinct p.id) as n
                          from products p
                          join product_colors pc on pc.product_id = p.id
                         where %s
                         group by pc.family
                        """.formatted(forColors.sql))
                .params(forColors.params)
                .query(rs -> {
                    Map<String, Integer> counts = new HashMap<>();
                    while (rs.next()) {
                        counts.put(rs.getString("family"), rs.getInt("n"));
                    }
                    return counts;
                });
        List<FacetValue> colors = Arrays.stream(ColorFamily.values())
                .filter(f -> colorCounts.containsKey(f.name()) || query.colors().contains(f))
                .map(f -> new FacetValue(f.name(), f.label(), f.hex(), colorCounts.getOrDefault(f.name(), 0),
                        query.colors().contains(f)))
                .toList();

        Where forPrice = where(query, Facet.PRICE);
        PriceRange price = jdbc.sql("select coalesce(min(p.price), 0) as lo, coalesce(max(p.price), 0) as hi "
                        + "from products p where " + forPrice.sql)
                .params(forPrice.params)
                .query((rs, n) -> new PriceRange(rs.getInt("lo"), rs.getInt("hi")))
                .single();
        return new Facets(sizes, colors, price);
    }

    /** Which filter to leave out, so a facet shows what choosing another value would give. */
    private enum Facet {
        NONE, SIZE, COLOR, PRICE
    }

    private record Where(String sql, Map<String, Object> params) {
    }

    private Where where(ProductQuery query, Facet leaveOut) {
        List<String> conditions = new ArrayList<>();
        Map<String, Object> params = new HashMap<>();
        conditions.add("p.status = 'ACTIVE'");
        if (query.category() != null) {
            conditions.add("""
                    p.category_id in (
                        with recursive tree as (
                            select id from categories where slug = :category
                            union all
                            select c.id from categories c join tree on c.parent_id = tree.id)
                        select id from tree)""");
            params.put("category", query.category());
        }
        if (query.collection() != null) {
            conditions.add("""
                    p.id in (select pcl.product_id from product_collections pcl
                               join collections col on col.id = pcl.collection_id
                              where col.slug = :collection)""");
            params.put("collection", query.collection());
        }
        String tsQuery = tsQuery(query.q());
        if (tsQuery != null) {
            conditions.add("p.search @@ to_tsquery('simple', :tsq)");
            params.put("tsq", tsQuery);
        }
        if (query.sale()) {
            conditions.add("p.compare_at_price is not null");
        }
        boolean bySize = leaveOut != Facet.SIZE && !query.sizes().isEmpty();
        boolean byColor = leaveOut != Facet.COLOR && !query.colors().isEmpty();
        if (bySize || byColor) {
            // Size and colour must match the same variant: "black in M", not "black in some size, M in another colour".
            StringBuilder exists = new StringBuilder("""
                    exists (select 1 from variants fv join product_colors fc on fc.id = fv.color_id
                             where fv.product_id = p.id and fv.stock > 0""");
            if (bySize) {
                exists.append(" and upper(fv.size) in (:sizes)");
                params.put("sizes", query.sizes().stream().map(String::toUpperCase).toList());
            }
            if (byColor) {
                exists.append(" and fc.family in (:colors)");
                params.put("colors", query.colors().stream().map(Enum::name).toList());
            }
            conditions.add(exists.append(")").toString());
        }
        if (leaveOut != Facet.PRICE) {
            if (query.minPrice() != null) {
                conditions.add("p.price >= :minPrice");
                params.put("minPrice", query.minPrice());
            }
            if (query.maxPrice() != null) {
                conditions.add("p.price <= :maxPrice");
                params.put("maxPrice", query.maxPrice());
            }
        }
        return new Where(conditions.stream().map(c -> "(" + c + ")").collect(Collectors.joining(" and ")), params);
    }

    /** "blue lin" becomes {@code blue:* & lin:*}, so partly typed words still match. */
    static String tsQuery(String q) {
        if (q == null) {
            return null;
        }
        List<String> terms = Arrays.stream(q.toLowerCase().split("[^\\p{L}\\p{N}]+"))
                .filter(t -> !t.isBlank())
                .limit(8)
                .map(t -> t + ":*")
                .toList();
        return terms.isEmpty() ? null : String.join(" & ", terms);
    }
}
