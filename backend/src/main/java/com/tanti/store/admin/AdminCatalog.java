package com.tanti.store.admin;

import com.tanti.store.catalog.ColorFamily;
import com.tanti.store.catalog.SizeOrder;
import com.tanti.store.shared.ApiException;
import com.tanti.store.shared.StoreProperties;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Products as the shop edits them: fabric, fit and care, one price, the colours (each with a swatch
 * and the family shoppers filter by), the colour × size grid with its own stock and SKU, pictures
 * (shared or for one colour) and the collections a product is in.
 */
@Service
public class AdminCatalog {

    public static final Set<String> STATUSES = Set.of("DRAFT", "ACTIVE", "ARCHIVED");
    static final Set<String> SIZE_CHARTS = Set.of("NONE", "TOPS", "BOTTOMS", "KIDS");

    /** A colour; {@code id} is null for a new one. {@code family} is a {@link ColorFamily} name. */
    public record ColorInput(Long id, String name, String hex, String family) {
    }

    /** One size in one colour; {@code color} is the colour's place in the colours list. */
    public record VariantInput(Long id, Integer color, String size, String sku, Integer stock) {
    }

    public record ProductInput(String name, String slug, Long categoryId, String description, String details,
                               String fabric, String care, String fit, String sizeChart, Integer price,
                               Integer compareAtPrice, Boolean featured, String status, List<Long> collectionIds,
                               List<ColorInput> colors, List<VariantInput> variants) {
    }

    public record ColorView(long id, String name, String hex, String family) {
    }

    public record VariantView(long id, long colorId, String size, String sku, int stock) {
    }

    public record ImageView(long id, Long colorId, String url, String alt) {
    }

    public record ProductView(long id, String name, String slug, long categoryId, String category, String description,
                              String details, String fabric, String care, String fit, String sizeChart, int price,
                              Integer compareAtPrice, boolean featured, String status, int soldCount,
                              List<Long> collectionIds, List<ColorView> colors, List<VariantView> variants,
                              List<ImageView> images) {
    }

    public record ProductRow(long id, String name, String slug, String image, String category, String status,
                             boolean featured, int colorCount, int variantCount, int price, Integer compareAtPrice,
                             int stock, boolean low, int soldCount) {
    }

    public record ProductPage(List<ProductRow> items, int page, int pageSize, long total, Map<String, Integer> counts) {
    }

    public record StockRow(long variantId, long productId, String product, String image, String color, String hex,
                           String size, String sku, int price, int stock, String status) {
    }

    public record CollectionOption(long id, String name) {
    }

    public record FamilyOption(String value, String label, String hex) {
    }

    private static final String FIRST_IMAGE = """
            (select pi.url from product_images pi left join product_colors pc on pc.id = pi.color_id
              where pi.product_id = p.id order by pc.position nulls last, pi.position, pi.id limit 1)""";

    private static final String STOCK_SELECT = """
            select v.id, p.id, p.name,
                   coalesce((select pi.url from product_images pi where pi.product_id = p.id
                              order by pi.color_id = v.color_id desc nulls last, pi.position, pi.id limit 1), %s),
                   pc.name, pc.hex, v.size, v.sku, p.price, v.stock, p.status
              from variants v join products p on p.id = v.product_id join product_colors pc on pc.id = v.color_id\s"""
            .formatted(FIRST_IMAGE);

    private final JdbcClient jdbc;
    private final StoreProperties properties;
    private final Pictures pictures;

    AdminCatalog(JdbcClient jdbc, StoreProperties properties, Pictures pictures) {
        this.jdbc = jdbc;
        this.properties = properties;
        this.pictures = pictures;
    }

    public ProductPage products(String q, Long categoryId, String status, boolean lowOnly, int page) {
        List<String> where = new ArrayList<>(List.of("true"));
        Map<String, Object> params = new HashMap<>();
        params.put("low", properties.admin().lowStock());
        if (q != null && !q.isBlank()) {
            where.add("(p.name ilike :q or p.fabric ilike :q or exists "
                    + "(select 1 from variants s where s.product_id = p.id and s.sku ilike :q))");
            params.put("q", "%" + q.trim() + "%");
        }
        if (categoryId != null) {
            where.add("(p.category_id = :cat or p.category_id in (select id from categories where parent_id = :cat))");
            params.put("cat", categoryId);
        }
        if (status != null && STATUSES.contains(status)) {
            where.add("p.status = :status");
            params.put("status", status);
        }
        if (lowOnly) {
            where.add("p.status = 'ACTIVE' and exists (select 1 from variants s where s.product_id = p.id and s.stock <= :low)");
        }
        String condition = String.join(" and ", where);
        int size = 30;
        long total = jdbc.sql("select count(*) from products p where " + condition).params(params).query(Long.class).single();
        params.put("limit", size);
        params.put("offset", (long) page * size);
        List<ProductRow> rows = jdbc.sql("""
                        select p.id, p.name, p.slug, %s, c.name, p.status, p.featured,
                               (select count(*) from product_colors pc where pc.product_id = p.id),
                               (select count(*) from variants s where s.product_id = p.id),
                               p.price, p.compare_at_price,
                               coalesce((select sum(stock) from variants s where s.product_id = p.id), 0),
                               exists (select 1 from variants s where s.product_id = p.id and s.stock <= :low),
                               p.sold_count
                          from products p join categories c on c.id = p.category_id
                         where %s order by p.status = 'ARCHIVED', p.name limit :limit offset :offset"""
                        .formatted(FIRST_IMAGE, condition))
                .params(params)
                .query((rs, n) -> new ProductRow(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getString(4),
                        rs.getString(5), rs.getString(6), rs.getBoolean(7), rs.getInt(8), rs.getInt(9), rs.getInt(10),
                        (Integer) rs.getObject(11), rs.getInt(12), rs.getBoolean(13), rs.getInt(14)))
                .list();
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (String s : List.of("ACTIVE", "DRAFT", "ARCHIVED")) {
            counts.put(s, 0);
        }
        jdbc.sql("select status, count(*) from products group by status").query(rs -> {
            counts.put(rs.getString(1), rs.getInt(2));
        });
        return new ProductPage(rows, page, size, total, counts);
    }

    public ProductView product(long id) {
        List<ColorView> colors = jdbc.sql("select id, name, hex, family from product_colors where product_id = :id order by position, id")
                .param("id", id)
                .query((rs, n) -> new ColorView(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getString(4)))
                .list();
        List<VariantView> variants = jdbc.sql("""
                        select v.id, v.color_id, v.size, v.sku, v.stock
                          from variants v join product_colors pc on pc.id = v.color_id
                         where v.product_id = :id order by pc.position, pc.id, v.position, v.size""")
                .param("id", id)
                .query((rs, n) -> new VariantView(rs.getLong(1), rs.getLong(2), rs.getString(3), rs.getString(4), rs.getInt(5)))
                .list();
        List<ImageView> images = jdbc.sql("select id, color_id, url, alt from product_images where product_id = :id order by position, id")
                .param("id", id)
                .query((rs, n) -> new ImageView(rs.getLong(1), (Long) rs.getObject(2), rs.getString(3), rs.getString(4)))
                .list();
        List<Long> collections = jdbc.sql("select collection_id from product_collections where product_id = :id order by collection_id")
                .param("id", id).query(Long.class).list();
        return jdbc.sql("""
                        select p.id, p.name, p.slug, p.category_id, c.name, p.description, p.details, p.fabric, p.care,
                               p.fit, p.size_chart, p.price, p.compare_at_price, p.featured, p.status, p.sold_count
                          from products p join categories c on c.id = p.category_id where p.id = :id""")
                .param("id", id)
                .query((rs, n) -> new ProductView(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getLong(4),
                        rs.getString(5), rs.getString(6), rs.getString(7), rs.getString(8), rs.getString(9),
                        rs.getString(10), rs.getString(11), rs.getInt(12), (Integer) rs.getObject(13), rs.getBoolean(14),
                        rs.getString(15), rs.getInt(16), collections, colors, variants, images))
                .optional()
                .orElseThrow(() -> ApiException.notFound("product"));
    }

    public List<CollectionOption> collectionOptions() {
        return jdbc.sql("select id, name from collections order by position, name")
                .query((rs, n) -> new CollectionOption(rs.getLong(1), rs.getString(2))).list();
    }

    public static List<FamilyOption> families() {
        return java.util.Arrays.stream(ColorFamily.values()).map(f -> new FamilyOption(f.name(), f.label(), f.hex())).toList();
    }

    /** Creates ({@code id} null) or updates a product with all of its colours and sizes. Ones left out are removed. */
    @Transactional
    public ProductView save(Long id, ProductInput in) {
        Map<String, String> errors = new LinkedHashMap<>();
        String name = trim(in.name());
        if (name == null) {
            errors.put("name", "Please enter the product's name.");
        }
        if (in.categoryId() == null || jdbc.sql("select count(*) from categories where id = :id").param("id", in.categoryId())
                .query(Integer.class).single() == 0) {
            errors.put("categoryId", "Please choose a category.");
        }
        String status = in.status() == null ? "DRAFT" : in.status();
        if (!STATUSES.contains(status)) {
            errors.put("status", "Choose draft, on sale or archived.");
        }
        String sizeChart = in.sizeChart() == null ? "NONE" : in.sizeChart();
        if (!SIZE_CHARTS.contains(sizeChart)) {
            errors.put("sizeChart", "Choose a size guide.");
        }
        if (in.price() == null || in.price() <= 0) {
            errors.put("price", "Enter a price above ৳0.");
        } else if (in.compareAtPrice() != null && in.compareAtPrice() <= in.price()) {
            errors.put("compareAtPrice", "The old price must be higher than the price.");
        }
        List<ColorInput> colors = in.colors() == null ? List.of() : in.colors();
        List<VariantInput> variants = in.variants() == null ? List.of() : in.variants();
        if (colors.isEmpty()) {
            errors.put("colors", "Add at least one colour.");
        }
        Set<String> colorNames = new HashSet<>();
        for (int i = 0; i < colors.size(); i++) {
            ColorInput c = colors.get(i);
            String at = "colors." + i + ".";
            if (trim(c.name()) == null) {
                errors.put(at + "name", "Name the colour.");
            } else if (c.name().trim().length() > 40) {
                errors.put(at + "name", "Keep it under 40 characters.");
            } else if (!colorNames.add(c.name().trim().toLowerCase(Locale.ROOT))) {
                errors.put(at + "name", "Two colours have this name.");
            }
            if (c.hex() == null || !c.hex().matches("#[0-9A-Fa-f]{6}")) {
                errors.put(at + "hex", "Choose the swatch colour.");
            }
            if (c.family() == null || ColorFamily.parse(c.family()).isEmpty()) {
                errors.put(at + "family", "Choose the colour family shoppers filter by.");
            }
        }
        if (status.equals("ACTIVE") && variants.isEmpty()) {
            errors.put("variants", "A product on sale needs at least one size.");
        }
        Set<String> pairs = new HashSet<>();
        Set<String> skus = new HashSet<>();
        Set<Integer> usedColors = new HashSet<>();
        for (int i = 0; i < variants.size(); i++) {
            VariantInput v = variants.get(i);
            String at = "variants." + i + ".";
            if (v.color() == null || v.color() < 0 || v.color() >= colors.size()) {
                errors.put(at + "color", "Choose a colour.");
            } else {
                usedColors.add(v.color());
            }
            String size = trim(v.size());
            if (size == null || size.length() > 10) {
                errors.put(at + "size", "Enter a size, e.g. M, 32 or 4-5Y.");
            } else if (v.color() != null && !pairs.add(v.color() + ":" + size.toUpperCase(Locale.ROOT))) {
                errors.put(at + "size", "This colour already has this size.");
            }
            if (trim(v.sku()) == null) {
                errors.put(at + "sku", "Enter a SKU.");
            } else if (!skus.add(v.sku().trim().toUpperCase(Locale.ROOT))) {
                errors.put(at + "sku", "Two sizes have this SKU.");
            }
            if (v.stock() != null && (v.stock() < 0 || v.stock() > 100_000)) {
                errors.put(at + "stock", "From 0 to 100000.");
            }
        }
        if (status.equals("ACTIVE")) {
            for (int i = 0; i < colors.size(); i++) {
                if (!usedColors.contains(i) && !errors.containsKey("colors." + i + ".name")) {
                    errors.put("colors." + i + ".name", "Add a size for this colour, or remove it.");
                }
            }
        }
        List<Long> collectionIds = in.collectionIds() == null ? List.of()
                : in.collectionIds().stream().filter(Objects::nonNull).distinct().toList();
        if (!collectionIds.isEmpty() && jdbc.sql("select count(*) from collections where id in (:ids)")
                .param("ids", collectionIds).query(Integer.class).single() != collectionIds.size()) {
            errors.put("collectionIds", "One of the collections doesn't exist.");
        }
        String slug = trim(in.slug()) == null ? slug(name == null ? "" : name) : slug(in.slug());
        if (slug.isEmpty()) {
            errors.put("slug", "Enter a web address name using English letters.");
        } else if (jdbc.sql("select count(*) from products where slug = :s and id <> coalesce(cast(:id as bigint), -1)")
                .param("s", slug).param("id", id).query(Integer.class).single() > 0) {
            errors.put("slug", "Another product already uses this web address.");
        }
        if (!errors.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "request.invalid", "Please check the highlighted fields.", errors);
        }
        Map<String, Object> f = new HashMap<>();
        f.put("name", name);
        f.put("slug", slug);
        f.put("cat", in.categoryId());
        f.put("description", in.description() == null ? "" : in.description().trim());
        f.put("details", in.details() == null ? "" : in.details().strip());
        f.put("fabric", trim(in.fabric()));
        f.put("care", trim(in.care()));
        f.put("fit", trim(in.fit()));
        f.put("chart", sizeChart);
        f.put("price", in.price());
        f.put("compare", in.compareAtPrice());
        f.put("featured", Boolean.TRUE.equals(in.featured()));
        f.put("status", status);
        long productId;
        if (id == null) {
            productId = jdbc.sql("""
                            insert into products (name, slug, category_id, description, details, fabric, care, fit,
                                                  size_chart, price, compare_at_price, featured, status)
                            values (:name, :slug, :cat, :description, :details, :fabric, :care, :fit, :chart, :price,
                                    :compare, :featured, :status) returning id""")
                    .params(f).query(Long.class).single();
        } else {
            jdbc.sql("select id from products where id = :id for update").param("id", id).query(Long.class).optional()
                    .orElseThrow(() -> ApiException.notFound("product"));
            f.put("id", id);
            jdbc.sql("""
                            update products set name = :name, slug = :slug, category_id = :cat, description = :description,
                                   details = :details, fabric = :fabric, care = :care, fit = :fit, size_chart = :chart,
                                   price = :price, compare_at_price = :compare, featured = :featured, status = :status,
                                   updated_at = now()
                             where id = :id""")
                    .params(f).update();
            productId = id;
        }
        List<Long> colorIds = saveColors(productId, colors);
        saveVariants(productId, variants, colorIds);
        jdbc.sql("delete from product_collections where product_id = :p").param("p", productId).update();
        for (Long collection : collectionIds) {
            jdbc.sql("insert into product_collections (product_id, collection_id) values (:p, :c)")
                    .param("p", productId).param("c", collection).update();
        }
        return product(productId);
    }

    /** Saves the colours in order and returns their ids in the same order. */
    private List<Long> saveColors(long productId, List<ColorInput> colors) {
        List<Long> existing = jdbc.sql("select id from product_colors where product_id = :p").param("p", productId)
                .query(Long.class).list();
        Set<Long> keep = new HashSet<>();
        for (ColorInput c : colors) {
            if (c.id() != null) {
                if (!existing.contains(c.id())) {
                    throw ApiException.badRequest("color.not_found", "One of the colours doesn't belong to this product.");
                }
                keep.add(c.id());
            }
        }
        for (Long old : existing) {
            if (!keep.contains(old)) {
                // Its pictures stay with the product as shared pictures; its sizes go with it.
                jdbc.sql("update product_images set color_id = null where color_id = :id").param("id", old).update();
                jdbc.sql("delete from product_colors where id = :id").param("id", old).update();
            }
        }
        List<Long> ids = new ArrayList<>();
        for (int i = 0; i < colors.size(); i++) {
            ColorInput c = colors.get(i);
            Map<String, Object> f = Map.of("p", productId, "n", c.name().trim(), "h", c.hex().toUpperCase(Locale.ROOT),
                    "fam", ColorFamily.parse(c.family()).orElseThrow().name(), "pos", i);
            if (c.id() == null) {
                ids.add(jdbc.sql("""
                                insert into product_colors (product_id, name, hex, family, position)
                                values (:p, :n, :h, :fam, :pos) returning id""")
                        .params(f).query(Long.class).single());
            } else {
                jdbc.sql("update product_colors set name = :n, hex = :h, family = :fam, position = :pos where id = :id and product_id = :p")
                        .params(f).param("id", c.id()).update();
                ids.add(c.id());
            }
        }
        return ids;
    }

    private void saveVariants(long productId, List<VariantInput> variants, List<Long> colorIds) {
        List<Long> existing = jdbc.sql("select id from variants where product_id = :p").param("p", productId)
                .query(Long.class).list();
        Set<Long> keep = new HashSet<>();
        for (VariantInput v : variants) {
            if (v.id() != null) {
                if (!existing.contains(v.id())) {
                    throw ApiException.badRequest("variant.not_found", "One of the sizes doesn't belong to this product.");
                }
                keep.add(v.id());
            }
        }
        for (Long old : existing) {
            if (!keep.contains(old)) {
                jdbc.sql("delete from variants where id = :id").param("id", old).update();
            }
        }
        // Park SKUs first, so two sizes can swap SKUs in one save.
        jdbc.sql("update variants set sku = '~' || id where product_id = :p").param("p", productId).update();
        try {
            for (VariantInput v : variants) {
                String size = v.size().trim().toUpperCase(Locale.ROOT);
                Map<String, Object> f = new HashMap<>();
                f.put("product", productId);
                f.put("color", colorIds.get(v.color()));
                f.put("size", size);
                f.put("pos", SizeOrder.position(size));
                f.put("sku", v.sku().trim().toUpperCase(Locale.ROOT));
                f.put("stock", v.stock() == null ? 0 : v.stock());
                if (v.id() == null) {
                    jdbc.sql("""
                                    insert into variants (product_id, color_id, size, position, sku, stock)
                                    values (:product, :color, :size, :pos, :sku, :stock)""")
                            .params(f).update();
                } else {
                    f.put("id", v.id());
                    jdbc.sql("""
                                    update variants set color_id = :color, size = :size, position = :pos, sku = :sku,
                                                        stock = :stock
                                     where id = :id""")
                            .params(f).update();
                }
            }
        } catch (DuplicateKeyException e) {
            throw new ApiException(HttpStatus.CONFLICT, "variant.sku_taken", "A SKU is already used by another product.",
                    Map.of("variants", "A SKU is already used by another product."));
        }
    }

    /** Adds a picture at the end; {@code colorId} null shows it with every colour. */
    @Transactional
    public ProductView addImage(long productId, Long colorId, String alt, byte[] bytes) {
        product(productId);
        checkColor(productId, colorId);
        String url = pictures.store("products", bytes);
        int position = jdbc.sql("select coalesce(max(position), -1) + 1 from product_images where product_id = :p")
                .param("p", productId).query(Integer.class).single();
        jdbc.sql("""
                        insert into product_images (product_id, color_id, url, alt, position)
                        values (:p, :c, :u, :a, :pos)""")
                .param("p", productId).param("c", colorId).param("u", url)
                .param("a", alt == null ? "" : alt.trim()).param("pos", position).update();
        touch(productId);
        return product(productId);
    }

    @Transactional
    public ProductView updateImage(long productId, long imageId, Long colorId, String alt) {
        checkColor(productId, colorId);
        if (jdbc.sql("update product_images set color_id = :c, alt = :a where id = :id and product_id = :p")
                .param("c", colorId).param("a", alt == null ? "" : alt.trim()).param("id", imageId)
                .param("p", productId).update() == 0) {
            throw ApiException.notFound("image");
        }
        touch(productId);
        return product(productId);
    }

    /** Moves a picture one place earlier (-1) or later (+1). The first picture is the one on cards. */
    @Transactional
    public ProductView moveImage(long productId, long imageId, int direction) {
        List<Long> ids = new ArrayList<>(jdbc.sql("select id from product_images where product_id = :p order by position, id")
                .param("p", productId).query(Long.class).list());
        int at = ids.indexOf(imageId);
        if (at < 0) {
            throw ApiException.notFound("image");
        }
        int to = at + Integer.signum(direction);
        if (to >= 0 && to < ids.size()) {
            ids.remove(at);
            ids.add(to, imageId);
            for (int i = 0; i < ids.size(); i++) {
                jdbc.sql("update product_images set position = :pos where id = :id").param("pos", i).param("id", ids.get(i)).update();
            }
            touch(productId);
        }
        return product(productId);
    }

    /** Removes the picture from the product. The file stays on disk, since old orders may still show it. */
    @Transactional
    public ProductView deleteImage(long productId, long imageId) {
        if (jdbc.sql("delete from product_images where id = :id and product_id = :p").param("id", imageId)
                .param("p", productId).update() == 0) {
            throw ApiException.notFound("image");
        }
        touch(productId);
        return product(productId);
    }

    public List<StockRow> stock(String q, boolean lowOnly) {
        Map<String, Object> params = new HashMap<>();
        params.put("low", properties.admin().lowStock());
        String where = "p.status <> 'ARCHIVED'";
        if (lowOnly) {
            where += " and v.stock <= :low";
        }
        if (q != null && !q.isBlank()) {
            where += " and (p.name ilike :q or v.sku ilike :q or pc.name ilike :q)";
            params.put("q", "%" + q.trim() + "%");
        }
        return jdbc.sql(STOCK_SELECT + """
                         where %s
                         order by p.name, p.id, pc.position, pc.id, v.position, v.size
                         limit 1000""".formatted(where))
                .params(params)
                .query((rs, n) -> stockRow(rs))
                .list();
    }

    @Transactional
    public StockRow setStock(long variantId, int stock) {
        if (stock < 0 || stock > 100_000) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "request.invalid", "Please check the highlighted fields.",
                    Map.of("stock", "Enter a number from 0 to 100000."));
        }
        if (jdbc.sql("update variants set stock = :s where id = :id").param("s", stock).param("id", variantId).update() == 0) {
            throw ApiException.notFound("variant");
        }
        return jdbc.sql(STOCK_SELECT + " where v.id = :id").param("id", variantId).query((rs, n) -> stockRow(rs)).single();
    }

    private void checkColor(long productId, Long colorId) {
        if (colorId != null && jdbc.sql("select count(*) from product_colors where id = :id and product_id = :p")
                .param("id", colorId).param("p", productId).query(Integer.class).single() == 0) {
            throw ApiException.badRequest("color.not_found", "That colour doesn't belong to this product.");
        }
    }

    private void touch(long productId) {
        jdbc.sql("update products set updated_at = now() where id = :id").param("id", productId).update();
    }

    private static StockRow stockRow(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new StockRow(rs.getLong(1), rs.getLong(2), rs.getString(3), rs.getString(4), rs.getString(5),
                rs.getString(6), rs.getString(7), rs.getString(8), rs.getInt(9), rs.getInt(10), rs.getString(11));
    }

    static String slug(String text) {
        String plain = Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return plain.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }

    private static String trim(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
