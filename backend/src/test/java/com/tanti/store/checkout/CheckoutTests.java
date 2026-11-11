package com.tanti.store.checkout;

import static org.assertj.core.api.Assertions.assertThat;

import com.tanti.store.support.ApiClient;
import com.tanti.store.support.ApiClient.Response;
import com.tanti.store.support.IntegrationTest;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.simple.JdbcClient;
import tools.jackson.databind.JsonNode;

@IntegrationTest
class CheckoutTests {

    @LocalServerPort
    int port;

    @Autowired
    JdbcClient jdbc;

    ApiClient shopper;

    @BeforeEach
    void setUp() {
        shopper = new ApiClient(port);
    }

    /** A variant of the product with at least {@code minStock} pieces, so tests never fight over stock. */
    long variant(String slug, int minStock) {
        return jdbc.sql("""
                        select v.id from variants v join products p on p.id = v.product_id
                         where p.slug = :slug and v.stock >= :min order by v.stock desc, v.id limit 1""")
                .param("slug", slug).param("min", minStock).query(Long.class).single();
    }

    int stock(long variantId) {
        return jdbc.sql("select stock from variants where id = :id").param("id", variantId).query(Integer.class).single();
    }

    Map<String, Object> address(String zone) {
        Map<String, Object> body = new HashMap<>();
        body.put("name", "Nusrat Jahan");
        body.put("phone", "+880 1712-345678");
        body.put("email", "nusrat@example.com");
        body.put("address", "House 7, Road 2, Block C");
        body.put("area", "Mirpur 10");
        body.put("city", "Dhaka");
        body.put("zone", zone);
        body.put("paymentMethod", "COD");
        return body;
    }

    @Test
    void addingToTheBagRemembersTheBagInACookie() {
        long tee = variant("heavyweight-crew-tee", 3);
        Response added = shopper.post("/api/v1/cart/items", Map.of("variantId", tee, "quantity", 2));
        assertThat(added.status()).isEqualTo(200);
        assertThat(added.body().get("itemCount").asInt()).isEqualTo(2);
        assertThat(added.body().get("subtotal").asInt()).isEqualTo(2 * 890);

        JsonNode cart = shopper.get("/api/v1/cart").body();
        assertThat(cart.get("items")).hasSize(1);
        assertThat(cart.get("items").get(0).get("image").asString()).startsWith("/media/");
        assertThat(cart.get("remainingForFreeDelivery").asInt()).isEqualTo(3000 - 1780);

        assertThat(new ApiClient(port).get("/api/v1/cart").body().get("items")).isEmpty();
    }

    @Test
    void cannotAddMoreThanIsInStock() {
        long variant = variant("tapered-chino", 1);
        int stock = stock(variant);
        Response response = shopper.post("/api/v1/cart/items", Map.of("variantId", variant, "quantity", Math.min(stock + 1, 10)));
        if (stock < 10) {
            assertThat(response.status()).isEqualTo(409);
            assertThat(response.body().get("code").asString()).isEqualTo("cart.not_enough_stock");
        }
    }

    @Test
    void changingAndRemovingLines() {
        long a = variant("pique-polo", 3);
        long b = variant("wide-leg-palazzo", 1);
        shopper.post("/api/v1/cart/items", Map.of("variantId", a, "quantity", 1));
        shopper.post("/api/v1/cart/items", Map.of("variantId", b, "quantity", 1));
        JsonNode changed = shopper.patch("/api/v1/cart/items/" + a, Map.of("quantity", 3)).body();
        assertThat(changed.get("itemCount").asInt()).isEqualTo(4);
        JsonNode removed = shopper.delete("/api/v1/cart/items/" + b).body();
        assertThat(removed.get("items")).hasSize(1);
        JsonNode zero = shopper.patch("/api/v1/cart/items/" + a, Map.of("quantity", 0)).body();
        assertThat(zero.get("items")).isEmpty();
    }

    @Test
    void couponsCheckTheirRules() {
        long cheap = variant("kids-graphic-tee", 1);
        shopper.post("/api/v1/cart/items", Map.of("variantId", cheap, "quantity", 1));

        Response tooSmall = shopper.post("/api/v1/cart/coupon", Map.of("code", "welcome10"));
        assertThat(tooSmall.status()).isEqualTo(422);
        assertThat(tooSmall.body().get("code").asString()).isEqualTo("coupon.min_subtotal");
        assertThat(shopper.post("/api/v1/cart/coupon", Map.of("code", "NOPE")).body().get("code").asString())
                .isEqualTo("coupon.not_found");
        assertThat(shopper.post("/api/v1/cart/coupon", Map.of("code", "SUMMER20")).body().get("code").asString())
                .isEqualTo("coupon.expired");

        long panjabi = variant("eid-cotton-panjabi", 1);
        shopper.post("/api/v1/cart/items", Map.of("variantId", panjabi, "quantity", 1));
        JsonNode cart = shopper.post("/api/v1/cart/coupon", Map.of("code", " welcome10 ")).body();
        assertThat(cart.get("coupon").get("code").asString()).isEqualTo("WELCOME10");
        assertThat(cart.get("discount").asInt()).isEqualTo((590 + 2490) / 10);
        assertThat(cart.get("total").asInt()).isEqualTo(590 + 2490 - 308);

        // Dropping below the minimum keeps the code but stops the discount, with a reason.
        JsonNode after = shopper.delete("/api/v1/cart/items/" + panjabi).body();
        assertThat(after.get("discount").asInt()).isZero();
        assertThat(after.get("couponProblem").asString()).startsWith("WELCOME10");
    }

    @Test
    void placingACashOnDeliveryOrder() {
        long variant = variant("everyday-slub-panjabi", 1);
        int before = stock(variant);
        shopper.post("/api/v1/cart/items", Map.of("variantId", variant, "quantity", 1));

        JsonNode quote = shopper.post("/api/v1/checkout/quote", Map.of("zone", "OUTSIDE")).body();
        assertThat(quote.get("shippingFee").asInt()).isEqualTo(130);
        assertThat(quote.get("total").asInt()).isEqualTo(1890 + 130);

        Response placed = shopper.post("/api/v1/checkout", address("OUTSIDE"));
        assertThat(placed.status()).isEqualTo(201);
        String number = placed.body().get("number").asString();
        String token = placed.body().get("token").asString();
        assertThat(number).startsWith("TN");
        assertThat(stock(variant)).isEqualTo(before - 1);
        assertThat(shopper.get("/api/v1/cart").body().get("items")).isEmpty();

        JsonNode order = shopper.get("/api/v1/orders/" + number + "?token=" + token).body();
        assertThat(order.get("status").asString()).isEqualTo("PLACED");
        assertThat(order.get("phone").asString()).isEqualTo("01712345678");
        assertThat(order.get("items").get(0).get("quantity").asInt()).isEqualTo(1);
        assertThat(order.get("total").asInt()).isEqualTo(1890 + 130);
        assertThat(order.get("events")).hasSize(1);

        assertThat(shopper.get("/api/v1/orders/" + number + "?token=wrong").status()).isEqualTo(404);
        ApiClient stranger = new ApiClient(port);
        assertThat(stranger.get("/api/v1/orders/track?number=" + number.toLowerCase() + "&phone=01712345678").status())
                .isEqualTo(200);
        assertThat(stranger.get("/api/v1/orders/track?number=" + number + "&phone=01812345678").status())
                .isEqualTo(404);
    }

    @Test
    void deliveryIsFreeOverTheThreshold() {
        long set = variant("festive-three-piece", 1);
        shopper.post("/api/v1/cart/items", Map.of("variantId", set, "quantity", 1));
        JsonNode quote = shopper.post("/api/v1/checkout/quote", Map.of("zone", "DHAKA")).body();
        assertThat(quote.get("shippingFee").asInt()).isZero();
        assertThat(quote.get("total").asInt()).isEqualTo(5490);
    }

    @Test
    void checkoutValidatesTheAddress() {
        shopper.post("/api/v1/cart/items", Map.of("variantId", variant("kids-jogger", 1), "quantity", 1));
        Map<String, Object> body = address("DHAKA");
        body.put("phone", "12345");
        Response badPhone = shopper.post("/api/v1/checkout", body);
        assertThat(badPhone.status()).isEqualTo(400);
        assertThat(badPhone.body().get("fields").get("phone").asString()).contains("11-digit");

        body = address("DHAKA");
        body.put("name", "");
        body.remove("zone");
        Response missing = shopper.post("/api/v1/checkout", body);
        assertThat(missing.status()).isEqualTo(400);
        assertThat(missing.body().get("fields").has("name")).isTrue();
        assertThat(missing.body().get("fields").has("zone")).isTrue();
    }

    @Test
    void emptyBagCannotCheckOut() {
        Response response = shopper.post("/api/v1/checkout", address("DHAKA"));
        assertThat(response.status()).isEqualTo(409);
        assertThat(response.body().get("code").asString()).isEqualTo("cart.empty");
    }

    @Test
    void writesNeedTheCsrfToken() {
        Response response = shopper.postWithoutCsrf("/api/v1/cart/items",
                Map.of("variantId", variant("kids-jogger", 1), "quantity", 1));
        assertThat(response.status()).isEqualTo(403);
    }
}
