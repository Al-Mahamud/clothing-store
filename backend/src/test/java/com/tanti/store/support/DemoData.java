package com.tanti.store.support;

import com.tanti.store.catalog.SizeOrder;
import com.tanti.store.shared.StoreProperties;
import com.tanti.store.support.DemoArt.Fabric;
import com.tanti.store.support.DemoArt.Garment;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * A believable shop for local runs and tests: categories, collections and about thirty products
 * with colours, sizes, stock and generated images. Deterministic, so tests can rely on it.
 */
@TestConfiguration(proxyBeanMethods = false)
public class DemoData {

    public static final List<String> TOP_SIZES = List.of("S", "M", "L", "XL", "XXL");
    public static final List<String> WOMEN_SIZES = List.of("XS", "S", "M", "L", "XL");
    public static final List<String> WAIST_SIZES = List.of("28", "30", "32", "34", "36");
    public static final List<String> KIDS_SIZES = List.of("2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-11Y");

    record Color(String name, String hex, String family) {
    }

    record Product(String name, String category, Garment garment, Fabric fabric, int price, Integer compareAt,
                   String fabricText, String fit, List<String> sizes, String sizeChart, int ageDays, int sold,
                   boolean featured, List<String> collections, String description, String details,
                   List<Color> colors) {
    }

    static Color c(String name, String hex, String family) {
        return new Color(name, hex, family);
    }

    static final Color BLACK = c("Black", "#1E1E20", "BLACK");
    static final Color OFF_WHITE = c("Off-white", "#EDE7DA", "WHITE");
    static final Color WHITE = c("White", "#F4F2EE", "WHITE");
    static final Color NAVY = c("Navy", "#1F2A44", "BLUE");
    static final Color MAROON = c("Maroon", "#6E1F2B", "RED");
    static final Color OLIVE = c("Olive", "#5B6142", "GREEN");
    static final Color SAND = c("Sand", "#C9B590", "BEIGE");
    static final Color SKY = c("Sky blue", "#9DB8D3", "BLUE");
    static final Color RUST = c("Rust", "#A4502E", "ORANGE");
    static final Color CHARCOAL = c("Charcoal", "#3B3D40", "GREY");
    static final Color BOTTLE = c("Bottle green", "#1F4D3A", "GREEN");
    static final Color MUSTARD = c("Mustard", "#C8962E", "YELLOW");
    static final Color BLUSH = c("Blush", "#D9A9A0", "PINK");
    static final Color LILAC = c("Lilac", "#B7A6C9", "PURPLE");
    static final Color TEAL = c("Teal", "#2D6E6E", "GREEN");
    static final Color DENIM = c("Mid denim", "#3E5878", "BLUE");
    static final Color LIGHT_DENIM = c("Light denim", "#7E98B5", "BLUE");
    static final Color GREY_MARL = c("Grey marl", "#9A9B9D", "GREY");
    static final Color CHOCOLATE = c("Chocolate", "#5A3A2A", "BROWN");
    static final Color ROSE = c("Dusty rose", "#C68B8B", "PINK");

    static final List<Product> PRODUCTS = List.of(
            // Men — panjabi
            new Product("Eid Cotton Panjabi", "men-panjabi", Garment.PANJABI, Fabric.PLAIN, 2490, 2990,
                    "100% combed cotton", "Regular fit", TOP_SIZES, "TOPS", 6, 210, true, List.of("eid-edit"),
                    "A crisp, breathable panjabi cut from soft combed cotton. Mandarin collar, concealed side pockets and brass-tone buttons make it the easy choice for Eid mornings and family dinners alike.",
                    "Mandarin collar\nFive-button half placket\nSide seam pockets\nSide slits at hem\nLength: 42\" (size M)",
                    List.of(OFF_WHITE, NAVY, MAROON)),
            new Product("Embroidered Silk-Blend Panjabi", "men-panjabi", Garment.PANJABI, Fabric.EMBROIDERED, 3890, null,
                    "Silk and viscose blend", "Regular fit", TOP_SIZES, "TOPS", 4, 164, true, List.of("eid-edit"),
                    "Tone-on-tone embroidery traces the collar and placket of this festive panjabi. The silk blend has a gentle sheen that catches the light without shouting.",
                    "Hand-finished embroidery on collar and placket\nMandarin collar\nFully lined yoke\nDry clean recommended",
                    List.of(MAROON, BLACK, BOTTLE)),
            new Product("Everyday Slub Panjabi", "men-panjabi", Garment.PANJABI, Fabric.PLAIN, 1890, null,
                    "Slub cotton", "Relaxed fit", TOP_SIZES, "TOPS", 52, 132, false, List.of("everyday-essentials"),
                    "Textured slub cotton gives this panjabi a lived-in feel from the first wear. Made for Fridays, prayers and lazy weekends.",
                    "Band collar\nFour-button placket\nSide slits\nPre-washed for softness",
                    List.of(SAND, SKY, OLIVE)),
            new Product("Linen Short Kurta", "men-panjabi", Garment.PANJABI, Fabric.STRIPE, 2290, 2690,
                    "Linen and cotton blend", "Regular fit", TOP_SIZES, "TOPS", 18, 74, false, List.of("linen-season"),
                    "A hip-length kurta in a breezy pin-striped linen blend. Wear it over chinos or jeans when a shirt feels too formal.",
                    "Pin-stripe weave\nBand collar\nShorter hip length\nCurved side slits",
                    List.of(WHITE, SKY)),
            // Men — shirts
            new Product("Oxford Button-Down Shirt", "men-shirts", Garment.SHIRT, Fabric.PLAIN, 1990, null,
                    "Oxford cotton", "Tailored fit", TOP_SIZES, "TOPS", 70, 188, true, List.of("everyday-essentials"),
                    "The shirt you will reach for most. Soft oxford cotton, a button-down collar that keeps its shape, and a single chest pocket.",
                    "Button-down collar\nChest pocket\nCurved hem\nMother-of-pearl effect buttons",
                    List.of(WHITE, SKY, NAVY)),
            new Product("Linen Camp-Collar Shirt", "men-shirts", Garment.SHIRT, Fabric.PLAIN, 2290, null,
                    "100% linen", "Relaxed fit", TOP_SIZES, "TOPS", 9, 96, false, List.of("linen-season"),
                    "Pure linen that gets softer with every wash. An open camp collar and relaxed cut keep the air moving on the hottest days.",
                    "Camp collar\nRelaxed boxy cut\nStraight hem to wear untucked\nGarment-washed",
                    List.of(SAND, OLIVE, RUST)),
            new Product("Gingham Check Shirt", "men-shirts", Garment.SHIRT, Fabric.CHECK, 1790, 2190,
                    "Cotton poplin", "Regular fit", TOP_SIZES, "TOPS", 95, 143, false, List.of(),
                    "A classic gingham in smooth cotton poplin. Sharp enough for the office, easy enough for a weekend coffee.",
                    "Spread collar\nChest pocket\nBarrel cuffs",
                    List.of(BOTTLE, NAVY, MAROON)),
            new Product("Striped Poplin Shirt", "men-shirts", Garment.SHIRT, Fabric.STRIPE, 1890, null,
                    "Cotton poplin", "Tailored fit", TOP_SIZES, "TOPS", 40, 61, false, List.of("everyday-essentials"),
                    "Fine vertical stripes on crisp poplin. Tailored through the body for a clean line under a blazer.",
                    "Spread collar\nTailored body\nSingle-button cuffs",
                    List.of(SKY, WHITE)),
            // Men — t-shirts & polos
            new Product("Heavyweight Crew Tee", "men-tshirts", Garment.TEE, Fabric.PLAIN, 890, 1090,
                    "220 GSM cotton jersey", "Relaxed fit", TOP_SIZES, "TOPS", 30, 412, true, List.of("everyday-essentials"),
                    "A substantial cotton tee that holds its shape wash after wash. Ribbed crew neck, dropped shoulders and a slightly boxy cut.",
                    "220 GSM jersey\nRibbed crew neck\nDropped shoulders\nTwin-needle hems",
                    List.of(BLACK, OFF_WHITE, OLIVE, CHARCOAL)),
            new Product("Piqué Polo", "men-tshirts", Garment.POLO, Fabric.PLAIN, 1290, null,
                    "Cotton piqué", "Regular fit", TOP_SIZES, "TOPS", 64, 233, false, List.of(),
                    "A breathable piqué polo with a two-button placket and ribbed collar and cuffs. Smart enough for work, easy enough for everything else.",
                    "Two-button placket\nRibbed collar and cuffs\nSplit side hem",
                    List.of(NAVY, WHITE, MAROON, BOTTLE)),
            new Product("Relaxed Pocket Tee", "men-tshirts", Garment.TEE, Fabric.STRIPE, 990, null,
                    "Cotton jersey", "Relaxed fit", TOP_SIZES, "TOPS", 3, 38, false, List.of("everyday-essentials"),
                    "Breton-inspired stripes on a soft, drapey jersey. Throw it on with chinos and you are done.",
                    "Yarn-dyed stripes\nRelaxed body\nRibbed neck",
                    List.of(NAVY, OFF_WHITE)),
            // Men — trousers
            new Product("Tapered Chino", "men-trousers", Garment.TROUSERS, Fabric.PLAIN, 2190, null,
                    "Stretch cotton twill", "Tapered fit", WAIST_SIZES, "BOTTOMS", 45, 205, true, List.of("everyday-essentials"),
                    "Comfortable stretch twill chinos that taper gently to the ankle. The one pair of trousers that goes with everything in your wardrobe.",
                    "2% elastane for stretch\nSlant front pockets\nBack welt pockets\nZip fly",
                    List.of(SAND, NAVY, OLIVE, BLACK)),
            new Product("Straight Fit Jeans", "men-trousers", Garment.JEANS, Fabric.PLAIN, 2590, 2990,
                    "12 oz cotton denim", "Straight fit", WAIST_SIZES, "BOTTOMS", 80, 176, false, List.of(),
                    "Classic five-pocket jeans in sturdy 12 oz denim with a touch of stretch. A straight leg that works with sneakers or loafers.",
                    "Five-pocket styling\nCopper-tone rivets\nZip fly\nContrast stitching",
                    List.of(DENIM, LIGHT_DENIM, BLACK)),
            new Product("Fleece Hoodie", "men-tshirts", Garment.HOODIE, Fabric.PLAIN, 2790, null,
                    "Brushed cotton fleece", "Relaxed fit", TOP_SIZES, "TOPS", 12, 88, false, List.of(),
                    "A heavyweight hoodie with a brushed inside that feels soft from day one. Double-layer hood, kangaroo pocket and ribbed trims.",
                    "Brushed fleece inside\nDouble-layer hood\nKangaroo pocket\nRibbed cuffs and hem",
                    List.of(CHARCOAL, BOTTLE, BLACK, GREY_MARL)),
            // Women — kurtis
            new Product("Block-Print Cotton Kurti", "women-kurtis", Garment.KURTI, Fabric.PRINT, 1690, null,
                    "Hand block-printed cotton", "Straight fit", WOMEN_SIZES, "TOPS", 8, 254, true, List.of("everyday-essentials"),
                    "Printed by hand with carved wooden blocks, so no two pieces are exactly alike. A light, breathable kurti for long warm days.",
                    "Hand block print\nRound neck with keyhole\nThree-quarter sleeves\nContrast hem border",
                    List.of(TEAL, MUSTARD, BLUSH)),
            new Product("A-Line Long Kurti", "women-kurtis", Garment.KURTI, Fabric.PLAIN, 1990, 2390,
                    "Viscose rayon", "A-line", WOMEN_SIZES, "TOPS", 35, 140, false, List.of(),
                    "A flowing A-line kurti that falls just below the knee. The fluid viscose drapes beautifully and travels well.",
                    "Below-knee length\nFlared A-line hem\nPiped neckline",
                    List.of(MAROON, NAVY, BOTTLE)),
            new Product("Embroidered Georgette Kurti", "women-kurtis", Garment.KURTI, Fabric.EMBROIDERED, 2890, null,
                    "Georgette with cotton lining", "Straight fit", WOMEN_SIZES, "TOPS", 5, 59, false, List.of("eid-edit"),
                    "Delicate thread embroidery on soft georgette, fully lined in cotton. Dressy enough for dawats, comfortable enough to wear all evening.",
                    "Thread embroidery at neck\nCotton lining\nThree-quarter sleeves",
                    List.of(BLACK, ROSE, OFF_WHITE)),
            // Women — three-piece
            new Product("Lawn Three-Piece Set", "women-three-piece", Garment.THREE_PIECE, Fabric.FLORAL, 3490, 4290,
                    "Lawn cotton", "Straight fit", WOMEN_SIZES, "TOPS", 14, 310, true, List.of("eid-edit"),
                    "Kameez, shalwar and dupatta in airy printed lawn. A summer set that looks pulled-together with zero effort.",
                    "Printed lawn kameez\nMatching shalwar\nChiffon dupatta with tassels",
                    List.of(LILAC, MAROON, SKY)),
            new Product("Festive Three-Piece", "women-three-piece", Garment.THREE_PIECE, Fabric.EMBROIDERED, 5490, null,
                    "Cotton silk", "Straight fit", WOMEN_SIZES, "TOPS", 2, 47, true, List.of("eid-edit"),
                    "Our most-loved Eid set: an embroidered cotton-silk kameez with straight trousers and an organza dupatta.",
                    "Embroidered neckline\nStraight trousers\nOrganza dupatta",
                    List.of(BOTTLE, MAROON, BLACK)),
            // Women — dresses & tops
            new Product("Tiered Midi Dress", "women-dresses", Garment.DRESS, Fabric.PLAIN, 2790, null,
                    "Cotton voile", "Relaxed fit", WOMEN_SIZES, "TOPS", 20, 121, false, List.of("linen-season"),
                    "Three gathered tiers of light cotton voile that swing as you walk. Short sleeves and a softly gathered round neck.",
                    "Three-tier skirt\nShort sleeves\nFully lined",
                    List.of(RUST, BLACK, OFF_WHITE)),
            new Product("Floral Tiered Dress", "women-dresses", Garment.DRESS, Fabric.FLORAL, 2990, 3490,
                    "Printed viscose", "Relaxed fit", WOMEN_SIZES, "TOPS", 11, 77, false, List.of(),
                    "A ditsy floral print on fluid viscose. Wear it with sandals now and a cardigan when the weather turns.",
                    "Allover floral print\nTiered skirt\nMidi length",
                    List.of(NAVY, BLUSH)),
            new Product("Relaxed Linen Shirt", "women-tops", Garment.SHIRT, Fabric.PLAIN, 1890, null,
                    "100% linen", "Relaxed fit", WOMEN_SIZES, "TOPS", 25, 98, false, List.of("linen-season"),
                    "An oversized linen shirt to wear open over a tee or tucked into wide trousers.",
                    "Oversized cut\nDropped shoulders\nChest pocket",
                    List.of(WHITE, SAND, SKY)),
            new Product("Ribbed Fitted Tee", "women-tops", Garment.TEE, Fabric.STRIPE, 790, null,
                    "Ribbed cotton", "Fitted", WOMEN_SIZES, "TOPS", 60, 260, false, List.of("everyday-essentials"),
                    "A soft rib-knit tee with a close fit. The base layer for every outfit.",
                    "Fine rib knit\nCrew neck\nFitted body",
                    List.of(BLACK, OFF_WHITE, CHOCOLATE)),
            // Women — bottoms
            new Product("Wide-Leg Palazzo", "women-bottoms", Garment.PALAZZO, Fabric.PLAIN, 1490, null,
                    "Crepe", "Wide leg", WOMEN_SIZES, "BOTTOMS", 50, 187, false, List.of("everyday-essentials"),
                    "Fluid wide-leg trousers with a comfortable elastic waist. Pair with kurtis or a fitted tee.",
                    "Elasticated waist\nWide flowing leg\nSide pockets",
                    List.of(BLACK, SAND, OLIVE)),
            new Product("High-Rise Mom Jeans", "women-bottoms", Garment.JEANS, Fabric.PLAIN, 2490, null,
                    "Rigid cotton denim", "Mom fit", WAIST_SIZES, "BOTTOMS", 100, 69, false, List.of(),
                    "A high waist, relaxed hips and a tapered leg in rigid denim that moulds to you over time.",
                    "High rise\nTapered leg\nFive-pocket styling",
                    List.of(LIGHT_DENIM, DENIM)),
            // Kids
            new Product("Kids Graphic Tee", "kids-boys", Garment.KIDS_TEE, Fabric.PLAIN, 590, null,
                    "Soft cotton jersey", "Regular fit", KIDS_SIZES, "KIDS", 15, 198, false, List.of(),
                    "A cheerful star print on soft cotton jersey, made for climbing, running and everything in between.",
                    "Screen-printed star\nTaped neck seam\nMachine washable",
                    List.of(MUSTARD, NAVY, BOTTLE)),
            new Product("Kids Mini Panjabi", "kids-boys", Garment.KIDS_PANJABI, Fabric.EMBROIDERED, 1290, 1590,
                    "Cotton", "Regular fit", KIDS_SIZES, "KIDS", 7, 156, true, List.of("eid-edit"),
                    "A grown-up panjabi made small, with embroidery at the collar and placket. Matching sets for Eid photos, sorted.",
                    "Embroidered placket\nBand collar\nSoft cotton",
                    List.of(OFF_WHITE, BOTTLE, MAROON)),
            new Product("Kids Jogger", "kids-boys", Garment.JOGGER, Fabric.PLAIN, 890, null,
                    "Cotton fleece", "Regular fit", KIDS_SIZES, "KIDS", 55, 120, false, List.of(),
                    "Comfy fleece joggers with an elastic waist and cuffs. Built for the playground.",
                    "Elastic waist with drawcord\nRibbed cuffs\nSide pockets",
                    List.of(GREY_MARL, NAVY, BOTTLE)),
            new Product("Girls Floral Frock", "kids-girls", Garment.FROCK, Fabric.PRINT, 1490, null,
                    "Cotton poplin", "Regular fit", KIDS_SIZES, "KIDS", 10, 134, false, List.of("eid-edit"),
                    "A twirl-ready frock in printed cotton with a bow at the waist.",
                    "Flared skirt\nBow detail\nButton back",
                    List.of(BLUSH, LILAC, MUSTARD)),
            new Product("Kids Hoodie", "kids-girls", Garment.HOODIE, Fabric.PLAIN, 1490, 1790,
                    "Cotton fleece", "Regular fit", KIDS_SIZES, "KIDS", 28, 83, false, List.of(),
                    "A cosy pullover hoodie with a kangaroo pocket.",
                    "Lined hood\nKangaroo pocket\nRibbed trims",
                    List.of(ROSE, GREY_MARL, NAVY))
    );

    @Bean
    ApplicationRunner demoData(JdbcClient jdbc, TransactionTemplate tx, StoreProperties properties) {
        return new Loader(jdbc, tx, properties.storageRoot().resolve("demo"));
    }

    static final class Loader implements ApplicationRunner {

        private final JdbcClient jdbc;
        private final TransactionTemplate tx;
        private final Path folder;
        private final Map<String, Long> categories = new HashMap<>();
        private final Map<String, Long> collections = new HashMap<>();

        Loader(JdbcClient jdbc, TransactionTemplate tx, Path folder) {
            this.jdbc = jdbc;
            this.tx = tx;
            this.folder = folder;
        }

        @Override
        public void run(ApplicationArguments args) {
            boolean empty = jdbc.sql("select count(*) from products").query(Long.class).single() == 0;
            if (empty) {
                tx.executeWithoutResult(status -> load());
            }
        }

        private void load() {
            category(null, "Men", "men", "Panjabis, shirts and everyday basics.", 0);
            category("men", "Panjabi", "men-panjabi", "Festive and everyday panjabis.", 0);
            category("men", "Shirts", "men-shirts", "Oxford, linen and poplin shirts.", 1);
            category("men", "T-shirts & Polos", "men-tshirts", "Tees, polos and hoodies.", 2);
            category("men", "Trousers & Jeans", "men-trousers", "Chinos and denim.", 3);
            category(null, "Women", "women", "Kurtis, three-pieces and dresses.", 1);
            category("women", "Kurtis", "women-kurtis", "Printed, plain and embroidered kurtis.", 0);
            category("women", "Three-Piece", "women-three-piece", "Complete sets with dupatta.", 1);
            category("women", "Dresses", "women-dresses", "Midi and maxi dresses.", 2);
            category("women", "Tops & Shirts", "women-tops", "Tees and shirts.", 3);
            category("women", "Bottoms", "women-bottoms", "Palazzos and jeans.", 4);
            category(null, "Kids", "kids", "Comfortable clothes for play and festivals.", 2);
            category("kids", "Boys", "kids-boys", "Tees, panjabis and joggers.", 0);
            category("kids", "Girls", "kids-girls", "Frocks and hoodies.", 1);

            collection("Eid Edit", "eid-edit", "Dressed for the celebration",
                    "Panjabis, three-pieces and matching kids' sets for the most festive days of the year.", 0,
                    DemoArt.banner("#C9B590",
                            new Object[] {Garment.PANJABI, Fabric.EMBROIDERED, OFF_WHITE.hex()},
                            new Object[] {Garment.THREE_PIECE, Fabric.FLORAL, MAROON.hex()},
                            new Object[] {Garment.KIDS_PANJABI, Fabric.EMBROIDERED, BOTTLE.hex()}));
            collection("Linen Season", "linen-season", "Light layers for long, hot days",
                    "Breathable linen and voile that keep you cool from Boishakh to Bhadro.", 1,
                    DemoArt.banner("#A9B4A0",
                            new Object[] {Garment.SHIRT, Fabric.PLAIN, SAND.hex()},
                            new Object[] {Garment.DRESS, Fabric.PLAIN, RUST.hex()}));
            collection("Everyday Essentials", "everyday-essentials", "The pieces you wear the most",
                    "Tees, chinos and kurtis made to be worn, washed and worn again.", 2,
                    DemoArt.banner("#B9C3CC",
                            new Object[] {Garment.TEE, Fabric.PLAIN, BLACK.hex()},
                            new Object[] {Garment.TROUSERS, Fabric.PLAIN, SAND.hex()},
                            new Object[] {Garment.KURTI, Fabric.PRINT, TEAL.hex()}));

            Instant now = Instant.now();
            for (int i = 0; i < PRODUCTS.size(); i++) {
                product(PRODUCTS.get(i), i, now);
            }
            // A category picture is its best-selling product's first image.
            jdbc.sql("""
                    update categories c set image_url = (
                        select pi.url from products p
                          join product_images pi on pi.product_id = p.id
                          left join product_colors pc on pc.id = pi.color_id
                         where p.category_id in (select id from categories where id = c.id or parent_id = c.id)
                         order by p.sold_count desc, pc.position, pi.position limit 1)
                    """).update();
        }

        private void category(String parent, String name, String slug, String description, int position) {
            long id = jdbc.sql("""
                            insert into categories (parent_id, name, slug, description, position)
                            values (:parent, :name, :slug, :description, :position) returning id""")
                    .param("parent", parent == null ? null : categories.get(parent))
                    .param("name", name).param("slug", slug).param("description", description)
                    .param("position", position)
                    .query(Long.class).single();
            categories.put(slug, id);
        }

        private void collection(String name, String slug, String tagline, String description, int position,
                                String svg) {
            String url = write("collection-" + slug + ".svg", svg);
            long id = jdbc.sql("""
                            insert into collections (name, slug, tagline, description, image_url, position)
                            values (:name, :slug, :tagline, :description, :url, :position) returning id""")
                    .param("name", name).param("slug", slug).param("tagline", tagline)
                    .param("description", description).param("url", url).param("position", position)
                    .query(Long.class).single();
            collections.put(slug, id);
        }

        private void product(Product p, int index, Instant now) {
            String slug = slug(p.name());
            Instant created = now.minus(Duration.ofDays(p.ageDays())).minus(Duration.ofMinutes(index));
            long id = jdbc.sql("""
                            insert into products (name, slug, category_id, description, details, fabric, fit, care,
                                                  size_chart, price, compare_at_price, status, featured, sold_count,
                                                  created_at, updated_at)
                            values (:name, :slug, :category, :description, :details, :fabric, :fit, :care,
                                    :sizeChart, :price, :compareAt, 'ACTIVE', :featured, :sold, :created, :created)
                            returning id""")
                    .param("name", p.name()).param("slug", slug).param("category", categories.get(p.category()))
                    .param("description", p.description()).param("details", p.details())
                    .param("fabric", p.fabricText()).param("fit", p.fit())
                    .param("care", "Machine wash cold with similar colours. Do not bleach. Warm iron on the reverse. Dry in shade.")
                    .param("sizeChart", p.sizeChart()).param("price", p.price()).param("compareAt", p.compareAt())
                    .param("featured", p.featured()).param("sold", p.sold())
                    .param("created", Timestamp.from(created))
                    .query(Long.class).single();
            for (String collection : p.collections()) {
                jdbc.sql("insert into product_collections (product_id, collection_id) values (:p, :c)")
                        .param("p", id).param("c", collections.get(collection)).update();
            }
            for (int ci = 0; ci < p.colors().size(); ci++) {
                Color color = p.colors().get(ci);
                long colorId = jdbc.sql("""
                                insert into product_colors (product_id, name, hex, family, position)
                                values (:p, :name, :hex, :family, :position) returning id""")
                        .param("p", id).param("name", color.name()).param("hex", color.hex())
                        .param("family", color.family()).param("position", ci)
                        .query(Long.class).single();
                String base = slug + "-" + slug(color.name());
                String front = write(base + "-1.svg", DemoArt.product(p.garment(), p.fabric(), color.hex()));
                String close = write(base + "-2.svg", DemoArt.detail(p.garment(), p.fabric(), color.hex()));
                image(id, colorId, front, p.name() + " in " + color.name(), 0);
                image(id, colorId, close, p.name() + " in " + color.name() + ", close-up", 1);
                for (String size : p.sizes()) {
                    int stock = stock(index, ci, size);
                    jdbc.sql("""
                                    insert into variants (product_id, color_id, size, position, sku, stock)
                                    values (:p, :c, :size, :position, :sku, :stock)""")
                            .param("p", id).param("c", colorId).param("size", size)
                            .param("position", SizeOrder.position(size))
                            .param("sku", String.format(Locale.ROOT, "TN-%03d-%s-%s", index + 1,
                                    color.name().replaceAll("[^A-Za-z]", "").substring(0, 3).toUpperCase(Locale.ROOT),
                                    size.replace("-", "")))
                            .param("stock", stock)
                            .update();
                }
            }
        }

        /** Mostly healthy stock, with some sizes low and some sold out. */
        private static int stock(int product, int color, String size) {
            int h = Math.abs((product * 31 + color * 17 + size.hashCode()) % 23);
            if (h == 0 || h == 7) {
                return 0;
            }
            if (h < 4) {
                return h;
            }
            return 6 + h;
        }

        private void image(long productId, long colorId, String url, String alt, int position) {
            jdbc.sql("""
                            insert into product_images (product_id, color_id, url, alt, position)
                            values (:p, :c, :url, :alt, :position)""")
                    .param("p", productId).param("c", colorId).param("url", url).param("alt", alt)
                    .param("position", position).update();
        }

        private String write(String name, String svg) {
            try {
                Files.createDirectories(folder);
                Files.writeString(folder.resolve(name), svg);
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
            return "/media/demo/" + name;
        }

        static String slug(String text) {
            return text.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        }
    }
}
