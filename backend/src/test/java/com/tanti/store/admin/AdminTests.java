package com.tanti.store.admin;

import static org.assertj.core.api.Assertions.assertThat;

import com.tanti.store.support.ApiClient;
import com.tanti.store.support.ApiClient.Response;
import com.tanti.store.support.DemoData;
import com.tanti.store.support.FakeSslCommerz;
import com.tanti.store.support.IntegrationTest;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.StreamSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.simple.JdbcClient;
import tools.jackson.databind.JsonNode;

@IntegrationTest
class AdminTests {

    static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0x0D, 'I', 'H', 'D', 'R'};

    @LocalServerPort
    int port;

    @Autowired
    JdbcClient jdbc;

    @Autowired
    FakeSslCommerz gateway;

    ApiClient admin;

    @BeforeEach
    void signIn() {
        admin = new ApiClient(port);
        assertThat(admin.post("/api/v1/staff/login",
                Map.of("phone", DemoData.STAFF_PHONE, "password", DemoData.STAFF_PASSWORD)).status()).isEqualTo(200);
    }

    /** The first colour of a product in a size, with its stock set to 50. */
    long variant(String slug, String size) {
        long id = jdbc.sql("""
                        select v.id from variants v join products p on p.id = v.product_id
                         where p.slug = :s and v.size = :size order by v.color_id, v.id limit 1""")
                .param("s", slug).param("size", size).query(Long.class).single();
        jdbc.sql("update variants set stock = 50 where id = :id").param("id", id).update();
        return id;
    }

    int stock(long variant) {
        return jdbc.sql("select stock from variants where id = :id").param("id", variant).query(Integer.class).single();
    }

    JsonNode place(ApiClient shopper, String method, String zone) {
        Map<String, Object> body = new HashMap<>();
        body.put("name", "Mitu Rahman");
        body.put("phone", "01555123456");
        body.put("address", "Flat 2C, House 8, Road 4");
        body.put("area", zone.equals("DHAKA") ? "Uttara" : "Agrabad");
        body.put("city", zone.equals("DHAKA") ? "Dhaka" : "Chattogram");
        body.put("zone", zone);
        body.put("paymentMethod", method);
        Response r = shopper.post("/api/v1/checkout", body);
        assertThat(r.status()).isEqualTo(201);
        return r.body();
    }

    @Test
    void onlyActiveStaffGetIn() {
        ApiClient anonymous = new ApiClient(port);
        assertThat(anonymous.get("/api/v1/admin/dashboard").status()).isEqualTo(401);
        ApiClient customer = new ApiClient(port);
        customer.post("/api/v1/auth/login", Map.of("phone", DemoData.DEMO_PHONE, "password", DemoData.DEMO_PASSWORD));
        assertThat(customer.get("/api/v1/admin/dashboard").status()).isEqualTo(403);
        assertThat(anonymous.post("/api/v1/staff/login", Map.of("phone", DemoData.STAFF_PHONE, "password", "nope-nope"))
                .status()).isEqualTo(401);
        // A customer's password doesn't open the admin area.
        assertThat(anonymous.post("/api/v1/staff/login",
                Map.of("phone", DemoData.DEMO_PHONE, "password", DemoData.DEMO_PASSWORD)).status()).isEqualTo(401);

        assertThat(admin.get("/api/v1/staff/me").body().get("staff").get("name").asString()).startsWith("Farhana");
        JsonNode dashboard = admin.get("/api/v1/admin/dashboard").body();
        assertThat(dashboard.get("week")).hasSize(7);
        assertThat(dashboard.get("open").has("CONFIRMED")).isTrue();
        assertThat(dashboard.get("topProducts").size()).isGreaterThan(0);
        // Staff aren't customers: no account pages.
        assertThat(admin.get("/api/v1/account/profile").status()).isEqualTo(401);

        jdbc.sql("update staff set active = false where phone = :p").param("p", DemoData.STAFF_PHONE).update();
        try {
            assertThat(admin.get("/api/v1/admin/dashboard").status()).isEqualTo(401);
        } finally {
            jdbc.sql("update staff set active = true where phone = :p").param("p", DemoData.STAFF_PHONE).update();
        }
    }

    @Test
    void anOrderIsConfirmedShippedWithACourierAndDelivered() {
        long zz = variant("heavyweight-crew-tee", "M");
        ApiClient shopper = new ApiClient(port);
        shopper.post("/api/v1/cart/items", Map.of("variantId", zz, "quantity", 2));
        JsonNode placed = place(shopper, "COD", "OUTSIDE");
        String number = placed.get("number").asString();

        JsonNode open = admin.get("/api/v1/admin/orders?filter=OPEN&zone=OUTSIDE&q=" + number).body();
        assertThat(open.get("items").get(0).get("number").asString()).isEqualTo(number);
        assertThat(admin.get("/api/v1/admin/orders?zone=DHAKA&q=" + number).body().get("items")).isEmpty();
        JsonNode detail = admin.get("/api/v1/admin/orders/" + number).body();
        assertThat(detail.get("next").toString()).contains("CONFIRMED", "CANCELLED");
        assertThat(detail.get("skus").get(0).asString()).isNotBlank();

        assertThat(admin.post("/api/v1/admin/orders/" + number + "/status", Map.of("status", "SHIPPED")).status()).isEqualTo(409);
        admin.post("/api/v1/admin/orders/" + number + "/status", Map.of("status", "CONFIRMED"));
        admin.post("/api/v1/admin/orders/" + number + "/notes", Map.of("note", "Customer asked for a call before delivery"));
        JsonNode shipped = admin.post("/api/v1/admin/orders/" + number + "/status",
                Map.of("status", "SHIPPED", "courier", "Sundarban Courier", "trackingCode", "SCS-55120")).body();
        assertThat(shipped.get("order").get("courier").asString()).isEqualTo("Sundarban Courier");
        // The shopper sees who is bringing it.
        JsonNode theirs = shopper.get("/api/v1/orders/" + number + "?token=" + placed.get("token").asString()).body();
        assertThat(theirs.get("trackingCode").asString()).isEqualTo("SCS-55120");

        JsonNode done = admin.post("/api/v1/admin/orders/" + number + "/status", Map.of("status", "DELIVERED")).body();
        assertThat(done.get("order").get("status").asString()).isEqualTo("DELIVERED");
        assertThat(done.get("order").get("paymentStatus").asString()).isEqualTo("PAID");
        assertThat(done.get("order").get("events").toString()).contains("Cash collected", "call before delivery",
                "With Sundarban Courier (SCS-55120)");
        assertThat(jdbc.sql("""
                        select count(*) from order_events e join orders o on o.id = e.order_id
                         where o.number = :n and e.actor like 'staff:Farhana%'""")
                .param("n", number).query(Integer.class).single()).isEqualTo(4);
        assertThat(done.get("next")).isEmpty();
    }

    @Test
    void cancellingAPaidOrderGivesStockBackAndShowsARefundDue() throws Exception {
        long fig = variant("oxford-button-down-shirt", "M");
        ApiClient shopper = new ApiClient(port);
        shopper.post("/api/v1/cart/items", Map.of("variantId", fig, "quantity", 1));
        String number = place(shopper, "ONLINE", "DHAKA").get("number").asString();
        String tran = number + "-1";
        String val = gateway.pay(tran, gateway.session(tran).get("total_amount"), "BDT", "bKash");
        HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create(
                        "http://localhost:" + port + "/api/v1/payments/sslcommerz/ipn"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString("tran_id=" + tran + "&status=VALID&val_id=" + val)).build(),
                HttpResponse.BodyHandlers.discarding());
        assertThat(stock(fig)).isEqualTo(49);

        JsonNode cancelled = admin.post("/api/v1/admin/orders/" + number + "/status",
                Map.of("status", "CANCELLED", "note", "Stitching came loose at the cuff")).body();
        assertThat(cancelled.get("refundDue").asBoolean()).isTrue();
        assertThat(cancelled.get("attempts").get(0).get("cardType").asString()).isEqualTo("bKash");
        assertThat(stock(fig)).isEqualTo(50);
        assertThat(admin.get("/api/v1/admin/orders?filter=REFUND_DUE").body().get("items").toString()).contains(number);

        assertThat(admin.post("/api/v1/admin/orders/" + number + "/refund", Map.of("reference", " ")).status()).isEqualTo(400);
        JsonNode refunded = admin.post("/api/v1/admin/orders/" + number + "/refund", Map.of("reference", "RF-88231")).body();
        assertThat(refunded.get("order").get("paymentStatus").asString()).isEqualTo("REFUNDED");
        assertThat(refunded.get("refundReference").asString()).isEqualTo("RF-88231");
        assertThat(admin.post("/api/v1/admin/orders/" + number + "/refund", Map.of("reference", "again")).status()).isEqualTo(409);
    }

    @Test
    void aReturnedParcelCanStayOutOfStock() {
        long rubber = variant("pique-polo", "M");
        ApiClient shopper = new ApiClient(port);
        shopper.post("/api/v1/cart/items", Map.of("variantId", rubber, "quantity", 1));
        String number = place(shopper, "COD", "OUTSIDE").get("number").asString();
        admin.post("/api/v1/admin/orders/" + number + "/status", Map.of("status", "CONFIRMED"));
        admin.post("/api/v1/admin/orders/" + number + "/status", Map.of("status", "SHIPPED"));
        JsonNode back = admin.post("/api/v1/admin/orders/" + number + "/status",
                Map.of("status", "CANCELLED", "restock", false, "note", "Courier returned it stained")).body();
        assertThat(back.get("order").get("events").toString()).contains("Pieces not returned to stock");
        assertThat(back.get("refundDue").asBoolean()).isFalse();
        assertThat(stock(rubber)).isEqualTo(49);
    }

    Map<String, Object> shirt(long category) {
        Map<String, Object> shirt = new HashMap<>();
        shirt.put("name", "Handloom Gamcha Shirt");
        shirt.put("categoryId", category);
        shirt.put("description", "A relaxed shirt in soft handloom check.");
        shirt.put("details", "Woven in Narsingdi\nCoconut-shell buttons");
        shirt.put("fabric", "Handloom cotton");
        shirt.put("care", "Machine wash cold, dry in shade");
        shirt.put("fit", "Relaxed fit");
        shirt.put("sizeChart", "TOPS");
        shirt.put("price", 1890);
        shirt.put("compareAtPrice", 1800);
        shirt.put("status", "ACTIVE");
        shirt.put("colors", new ArrayList<>(List.of(
                new HashMap<>(Map.of("name", "Indigo", "hex", "#2B3A67", "family", "BLUE")),
                new HashMap<>(Map.of("name", "Rust", "hex", "#A4502E", "family", "ORANGE")))));
        List<Map<String, Object>> variants = new ArrayList<>();
        variants.add(new HashMap<>(Map.of("color", 0, "size", "s", "sku", "GAM-IND-S", "stock", 20)));
        variants.add(new HashMap<>(Map.of("color", 0, "size", "M", "sku", "GAM-IND-M", "stock", 8)));
        variants.add(new HashMap<>(Map.of("color", 1, "size", "M", "sku", "GAM-RST-M", "stock", 5)));
        shirt.put("variants", variants);
        return shirt;
    }

    @Test
    @SuppressWarnings("unchecked")
    void productsAreEditedWithColoursSizesAndPictures() {
        long shirts = jdbc.sql("select id from categories where slug = 'men-shirts'").query(Long.class).single();
        long linen = jdbc.sql("select id from collections where slug = 'linen-season'").query(Long.class).single();
        Map<String, Object> shirt = shirt(shirts);
        Response invalid = admin.post("/api/v1/admin/products", shirt);
        assertThat(invalid.status()).isEqualTo(400);
        assertThat(invalid.body().get("fields").has("compareAtPrice")).isTrue();

        shirt.put("compareAtPrice", 2290);
        List<Map<String, Object>> variants = (List<Map<String, Object>>) shirt.get("variants");
        variants.add(new HashMap<>(Map.of("color", 1, "size", "m", "sku", "GAM-RST-M2")));
        Response twice = admin.post("/api/v1/admin/products", shirt);
        assertThat(twice.body().get("fields").get("variants.3.size").asString()).contains("already has this size");
        variants.remove(3);
        ((List<Map<String, Object>>) shirt.get("colors")).get(1).put("family", "TEAL");
        assertThat(admin.post("/api/v1/admin/products", shirt).body().get("fields").has("colors.1.family")).isTrue();
        ((List<Map<String, Object>>) shirt.get("colors")).get(1).put("family", "ORANGE");

        shirt.put("collectionIds", List.of(linen));
        JsonNode created = admin.post("/api/v1/admin/products", shirt).body();
        long id = created.get("id").asLong();
        assertThat(created.get("slug").asString()).isEqualTo("handloom-gamcha-shirt");
        assertThat(created.get("variants").get(0).get("size").asString()).isEqualTo("S");
        assertThat(created.get("collectionIds").get(0).asLong()).isEqualTo(linen);
        JsonNode shop = new ApiClient(port).get("/api/v1/products/handloom-gamcha-shirt").body();
        assertThat(shop.get("colors")).hasSize(2);
        assertThat(shop.get("fabric").asString()).isEqualTo("Handloom cotton");
        assertThat(new ApiClient(port).get("/api/v1/products?color=ORANGE&q=gamcha").body().get("items")).hasSize(1);

        // Swap the two indigo sizes in one save, drop rust (and its size), add off-white.
        long indigo = created.get("colors").get(0).get("id").asLong();
        List<Map<String, Object>> colors = new ArrayList<>(List.of(
                new HashMap<>(Map.of("id", indigo, "name", "Indigo", "hex", "#2B3A67", "family", "BLUE")),
                new HashMap<>(Map.of("name", "Off-white", "hex", "#EDE7DA", "family", "WHITE"))));
        JsonNode small = created.get("variants").get(0);
        JsonNode medium = created.get("variants").get(1);
        List<Map<String, Object>> next = new ArrayList<>(List.of(
                new HashMap<>(Map.of("id", small.get("id").asLong(), "color", 0, "size", "M", "sku", "GAM-IND-S", "stock", 20)),
                new HashMap<>(Map.of("id", medium.get("id").asLong(), "color", 0, "size", "S", "sku", "GAM-IND-M", "stock", 8)),
                new HashMap<>(Map.of("color", 1, "size", "L", "sku", "GAM-OFW-L", "stock", 4))));
        shirt.put("colors", colors);
        shirt.put("variants", next);
        JsonNode updated = admin.put("/api/v1/admin/products/" + id, shirt).body();
        assertThat(updated.get("colors")).hasSize(2);
        assertThat(updated.get("colors").get(1).get("name").asString()).isEqualTo("Off-white");
        assertThat(updated.get("variants")).hasSize(3);
        assertThat(updated.get("variants").get(0).get("size").asString()).isEqualTo("S");
        assertThat(updated.get("variants").get(0).get("sku").asString()).isEqualTo("GAM-IND-M");

        // A colour on sale needs a size.
        List<Map<String, Object>> lonely = new ArrayList<>(colors);
        lonely.add(new HashMap<>(Map.of("name", "Rust", "hex", "#A4502E", "family", "ORANGE")));
        shirt.put("colors", lonely);
        assertThat(admin.put("/api/v1/admin/products/" + id, shirt).body().get("fields").has("colors.2.name")).isTrue();
        shirt.put("colors", colors);

        next.get(2).put("sku", jdbc.sql("select sku from variants v join products p on p.id = v.product_id where p.slug = 'pique-polo' limit 1")
                .query(String.class).single());
        assertThat(admin.put("/api/v1/admin/products/" + id, shirt).status()).isEqualTo(409);
        next.get(2).put("sku", "GAM-OFW-L");

        // Pictures: one for every colour, one for off-white only.
        long offWhite = updated.get("colors").get(1).get("id").asLong();
        JsonNode one = admin.upload("/api/v1/admin/products/" + id + "/images", "file", "gamcha.png", "image/png", PNG).body();
        String url = one.get("images").get(0).get("url").asString();
        assertThat(url).startsWith("/media/products/").endsWith(".png");
        assertThat(admin.status(url)).isEqualTo(200);
        JsonNode two = admin.upload("/api/v1/admin/products/" + id + "/images?colorId=" + offWhite + "&alt=Off-white+front",
                "file", "front.png", "image/png", PNG).body();
        long second = two.get("images").get(1).get("id").asLong();
        assertThat(two.get("images").get(1).get("colorId").asLong()).isEqualTo(offWhite);
        JsonNode moved = admin.post("/api/v1/admin/products/" + id + "/images/" + second + "/move", Map.of("direction", -1)).body();
        assertThat(moved.get("images").get(0).get("id").asLong()).isEqualTo(second);
        Response svg = admin.upload("/api/v1/admin/products/" + id + "/images", "file", "x.svg", "image/svg+xml",
                "<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>".getBytes());
        assertThat(svg.status()).isEqualTo(400);
        long other = jdbc.sql("select id from product_colors where product_id <> :p limit 1").param("p", id).query(Long.class).single();
        assertThat(admin.upload("/api/v1/admin/products/" + id + "/images?colorId=" + other, "file", "a.png", "image/png", PNG)
                .status()).isEqualTo(400);
        JsonNode shown = new ApiClient(port).get("/api/v1/products/handloom-gamcha-shirt").body();
        JsonNode offWhiteOption = StreamSupport.stream(shown.get("colors").spliterator(), false)
                .filter(c -> c.get("name").asString().equals("Off-white")).findFirst().orElseThrow();
        assertThat(offWhiteOption.get("images")).hasSize(2);
        assertThat(shown.get("colors").get(0).get("images")).hasSize(1);
        assertThat(admin.delete("/api/v1/admin/products/" + id + "/images/" + second).body().get("images")).hasSize(1);
        assertThat(admin.get("/api/v1/admin/color-families").body()).hasSize(12);

        shirt.put("status", "ARCHIVED");
        assertThat(admin.put("/api/v1/admin/products/" + id, shirt).status()).isEqualTo(200);
        assertThat(new ApiClient(port).get("/api/v1/products/handloom-gamcha-shirt").status()).isEqualTo(404);
        assertThat(new ApiClient(port).post("/api/v1/admin/products", shirt).status()).isEqualTo(401);
    }

    @Test
    void stockIsListedPerOptionAndSet() {
        long arjun = variant("straight-fit-jeans", "32");
        jdbc.sql("update variants set stock = 2 where id = :id").param("id", arjun).update();
        JsonNode low = admin.get("/api/v1/admin/stock?low=true").body();
        assertThat(low.toString()).contains("\"variantId\":" + arjun);
        JsonNode set = admin.patch("/api/v1/admin/variants/" + arjun + "/stock", Map.of("stock", 120)).body();
        assertThat(set.get("stock").asInt()).isEqualTo(120);
        assertThat(set.get("color").asString()).isNotBlank();
        assertThat(admin.patch("/api/v1/admin/variants/" + arjun + "/stock", Map.of("stock", -1)).status()).isEqualTo(400);
        assertThat(admin.get("/api/v1/admin/products?low=true").body().get("counts").get("ACTIVE").asInt()).isGreaterThan(20);
    }

    @Test
    void couponsAndDeliveryFees() {
        Map<String, Object> coupon = new HashMap<>(Map.of("code", "boishakh200", "description", "৳200 off for Pohela Boishakh",
                "kind", "FIXED", "value", 200, "minSubtotal", 1000));
        JsonNode created = admin.post("/api/v1/admin/coupons", coupon).body();
        assertThat(created.get("code").asString()).isEqualTo("BOISHAKH200");
        assertThat(admin.post("/api/v1/admin/coupons", coupon).status()).isEqualTo(409);

        ApiClient shopper = new ApiClient(port);
        shopper.post("/api/v1/cart/items", Map.of("variantId", variant("festive-three-piece", "M"), "quantity", 1));
        assertThat(shopper.post("/api/v1/cart/coupon", Map.of("code", "BOISHAKH200")).body().get("discount").asInt()).isEqualTo(200);
        coupon.put("active", false);
        admin.put("/api/v1/admin/coupons/" + created.get("id").asLong(), coupon);
        assertThat(shopper.get("/api/v1/cart").body().get("couponProblem").asString()).isNotBlank();

        try {
            assertThat(admin.put("/api/v1/admin/delivery", Map.of("insideDhaka", -5, "outsideDhaka", 150, "freeOver", 4000))
                    .body().get("fields").has("insideDhaka")).isTrue();
            JsonNode fees = admin.put("/api/v1/admin/delivery", Map.of("insideDhaka", 80, "outsideDhaka", 150, "freeOver", 99999)).body();
            assertThat(fees.get("updatedBy").asString()).startsWith("staff:Farhana");
            assertThat(new ApiClient(port).get("/api/v1/delivery").body().get("outsideDhaka").asInt()).isEqualTo(150);
            Response quoted = shopper.post("/api/v1/checkout/quote", Map.of("zone", "OUTSIDE"));
            assertThat(quoted.status()).as(quoted.body().toString()).isEqualTo(200);
            JsonNode quote = quoted.body();
            assertThat(quote.get("shippingFee").asInt()).isEqualTo(150);
            assertThat(shopper.get("/api/v1/cart").body().get("freeDeliveryOver").asInt()).isEqualTo(99999);
        } finally {
            jdbc.sql("delete from delivery_settings").update();
        }
        assertThat(new ApiClient(port).get("/api/v1/delivery").body().get("insideDhaka").asInt()).isEqualTo(70);
    }

    @Test
    void categoriesAndCollectionsAreEdited() {
        JsonNode tree = admin.get("/api/v1/admin/categories").body();
        assertThat(tree).hasSize(3);
        long men = StreamSupport.stream(tree.spliterator(), false).filter(c -> c.get("slug").asString().equals("men"))
                .findFirst().orElseThrow().get("id").asLong();
        assertThat(admin.post("/api/v1/admin/categories", Map.of("name", "X", "parentId", men)).status()).isEqualTo(400);
        JsonNode added = admin.post("/api/v1/admin/categories",
                Map.of("name", "Winter Wear", "parentId", men, "description", "Shawls, jackets and sweaters.")).body();
        JsonNode winter = StreamSupport.stream(added.spliterator(), false).filter(c -> c.get("id").asLong() == men)
                .findFirst().orElseThrow().get("children").get(4);
        assertThat(winter.get("slug").asString()).isEqualTo("winter-wear");
        long winterId = winter.get("id").asLong();
        JsonNode withPicture = admin.upload("/api/v1/admin/categories/" + winterId + "/image", "file", "m.png", "image/png", PNG).body();
        assertThat(withPicture.toString()).contains("/media/categories/");
        assertThat(admin.delete("/api/v1/admin/categories/" + men).status()).isEqualTo(409);
        assertThat(admin.delete("/api/v1/admin/categories/" + winterId).status()).isEqualTo(200);

        JsonNode collections = admin.post("/api/v1/admin/collections",
                Map.of("name", "Winter Layers", "tagline", "Shawls for foggy mornings", "active", false)).body();
        JsonNode layers = collections.get(collections.size() - 1);
        assertThat(layers.get("slug").asString()).isEqualTo("winter-layers");
        assertThat(new ApiClient(port).get("/api/v1/collections/winter-layers").status()).isEqualTo(404);
        JsonNode moved = admin.post("/api/v1/admin/collections/" + layers.get("id").asLong() + "/move", Map.of("direction", -1)).body();
        assertThat(moved.get(moved.size() - 2).get("slug").asString()).isEqualTo("winter-layers");
        assertThat(admin.post("/api/v1/admin/collections", Map.of("name", "Winter Layers")).status()).isEqualTo(409);
    }

    @Test
    void staffAreAddedSwitchedOffAndReset() {
        assertThat(admin.post("/api/v1/admin/staff", Map.of("name", "Jamal", "phone", "01312345670", "password", "short"))
                .status()).isEqualTo(400);
        admin.post("/api/v1/admin/staff", Map.of("name", "Jamal Hossain", "phone", "01312345670", "password", "start-here-123"));
        assertThat(admin.post("/api/v1/admin/staff", Map.of("name", "Again", "phone", "01312345670", "password", "start-here-123"))
                .status()).isEqualTo(409);
        long jamal = jdbc.sql("select id from staff where phone = '01312345670'").query(Long.class).single();

        ApiClient jamalsPhone = new ApiClient(port);
        assertThat(jamalsPhone.post("/api/v1/staff/login", Map.of("phone", "01312345670", "password", "start-here-123")).status())
                .isEqualTo(200);
        assertThat(jamalsPhone.post("/api/v1/admin/me/password",
                Map.of("currentPassword", "start-here-123", "newPassword", "jamal-own-pass")).status()).isEqualTo(204);

        admin.post("/api/v1/admin/staff/" + jamal + "/active", Map.of("active", false));
        assertThat(jamalsPhone.get("/api/v1/admin/dashboard").status()).isEqualTo(401);
        assertThat(new ApiClient(port).post("/api/v1/staff/login", Map.of("phone", "01312345670", "password", "jamal-own-pass"))
                .status()).isEqualTo(401);

        admin.post("/api/v1/admin/staff/" + jamal + "/active", Map.of("active", true));
        admin.post("/api/v1/admin/staff/" + jamal + "/password", Map.of("password", "manager-set-99"));
        assertThat(new ApiClient(port).post("/api/v1/staff/login", Map.of("phone", "01312345670", "password", "manager-set-99"))
                .status()).isEqualTo(200);

        long me = jdbc.sql("select id from staff where phone = :p").param("p", DemoData.STAFF_PHONE).query(Long.class).single();
        Response self = admin.post("/api/v1/admin/staff/" + me + "/active", Map.of("active", false));
        assertThat(self.status()).isEqualTo(409);
        assertThat(self.body().get("code").asString()).isEqualTo("staff.self");
    }
}
