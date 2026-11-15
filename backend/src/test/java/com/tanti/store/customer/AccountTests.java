package com.tanti.store.customer;

import static org.assertj.core.api.Assertions.assertThat;

import com.tanti.store.shared.BangladeshPhone;
import com.tanti.store.shared.SignInLimiter;
import com.tanti.store.support.ApiClient;
import com.tanti.store.support.ApiClient.Response;
import com.tanti.store.support.DemoData;
import com.tanti.store.support.IntegrationTest;
import com.tanti.store.support.TextsSent;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.StreamSupport;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.simple.JdbcClient;
import tools.jackson.databind.JsonNode;

@IntegrationTest
class AccountTests {

    private static final AtomicInteger NUMBERS = new AtomicInteger(3_000_000);

    @LocalServerPort
    int port;

    @Autowired
    JdbcClient jdbc;

    static String newPhone() {
        return "0181" + NUMBERS.incrementAndGet();
    }

    long variant(String slug, String size) {
        long id = jdbc.sql("""
                        select v.id from variants v join products p on p.id = v.product_id
                         where p.slug = :slug and v.size = :size order by v.color_id, v.id limit 1""")
                .param("slug", slug).param("size", size).query(Long.class).single();
        jdbc.sql("update variants set stock = greatest(stock, 20) where id = :id").param("id", id).update();
        return id;
    }

    long product(String slug) {
        return jdbc.sql("select id from products where slug = :s").param("s", slug).query(Long.class).single();
    }

    ApiClient register(String phone) {
        ApiClient client = new ApiClient(port);
        assertThat(client.post("/api/v1/auth/codes", Map.of("phone", phone, "purpose", "REGISTER")).status()).isEqualTo(200);
        String code = TextsSent.lastCode(jdbc, BangladeshPhone.normalise(phone).orElseThrow());
        Response r = client.post("/api/v1/auth/register",
                Map.of("name", "Sadia Hossain", "phone", phone, "password", "cotton-123", "code", code));
        assertThat(r.status()).isEqualTo(201);
        return client;
    }

    ApiClient signIn(String phone, String password) {
        ApiClient client = new ApiClient(port);
        assertThat(client.post("/api/v1/auth/login", Map.of("phone", phone, "password", password)).status()).isEqualTo(200);
        return client;
    }

    static int quantity(JsonNode cart, long variantId) {
        return StreamSupport.stream(cart.get("items").spliterator(), false)
                .filter(i -> i.get("variantId").asLong() == variantId).mapToInt(i -> i.get("quantity").asInt()).sum();
    }

    Map<String, Object> order(String phone, boolean saveAddress) {
        Map<String, Object> body = new HashMap<>();
        body.put("name", "Sadia Hossain");
        body.put("phone", phone);
        body.put("address", "House 7, Road 3");
        body.put("area", "Uttara");
        body.put("city", "Dhaka");
        body.put("zone", "DHAKA");
        body.put("paymentMethod", "COD");
        body.put("saveAddress", saveAddress);
        return body;
    }

    @Test
    void signingUpNeedsTheTextedCodeAndBringsGuestOrdersAlong() {
        String phone = newPhone();
        ApiClient shopper = new ApiClient(port);
        shopper.post("/api/v1/cart/items", Map.of("variantId", variant("heavyweight-crew-tee", "M"), "quantity", 1));
        String number = shopper.post("/api/v1/checkout", order(phone, false)).body().get("number").asString();

        shopper.post("/api/v1/auth/codes", Map.of("phone", phone, "purpose", "REGISTER"));
        Response tooSoon = shopper.post("/api/v1/auth/codes", Map.of("phone", phone, "purpose", "REGISTER"));
        assertThat(tooSoon.status()).isEqualTo(429);
        String code = TextsSent.lastCode(jdbc, phone);
        Map<String, Object> form = new HashMap<>(Map.of("name", "Sadia Hossain", "phone", phone, "password", "cotton-123",
                "code", code.equals("000000") ? "111111" : "000000"));
        assertThat(shopper.post("/api/v1/auth/register", form).status()).isEqualTo(400);
        form.put("code", code);
        JsonNode me = shopper.post("/api/v1/auth/register", form).body();
        assertThat(me.get("linkedOrders").asInt()).isEqualTo(1);
        assertThat(shopper.get("/api/v1/account/orders").body().get("items").get(0).get("number").asString()).isEqualTo(number);

        Response again = new ApiClient(port).post("/api/v1/auth/codes", Map.of("phone", phone, "purpose", "REGISTER"));
        assertThat(again.status()).isEqualTo(409);
        assertThat(shopper.post("/api/v1/auth/logout", null).status()).isEqualTo(204);
        assertThat(shopper.get("/api/v1/auth/me").body().get("customer").isNull()).isTrue();
        assertThat(shopper.get("/api/v1/account/profile").status()).isEqualTo(401);
    }

    @Test
    void wrongPasswordsArePausedAndForgottenOnesResetWithACode() {
        String phone = newPhone();
        register(phone);
        ApiClient guesser = new ApiClient(port);
        for (int i = 0; i < SignInLimiter.PER_PHONE; i++) {
            assertThat(guesser.post("/api/v1/auth/login", Map.of("phone", phone, "password", "guess-" + i)).status()).isEqualTo(401);
        }
        assertThat(guesser.post("/api/v1/auth/login", Map.of("phone", phone, "password", "cotton-123")).status()).isEqualTo(429);

        ApiClient owner = new ApiClient(port);
        owner.post("/api/v1/auth/codes", Map.of("phone", phone, "purpose", "RESET"));
        JsonNode me = owner.post("/api/v1/auth/password-reset",
                Map.of("phone", phone, "code", TextsSent.lastCode(jdbc, phone), "newPassword", "new-cotton-456")).body();
        assertThat(me.get("customer").get("phone").asString()).isEqualTo(phone);
        signIn(phone, "new-cotton-456");
    }

    @Test
    void theGuestBagJoinsTheAccountAtSignIn() {
        long tee = variant("heavyweight-crew-tee", "M");
        long chino = variant("tapered-chino", "32");
        String phone = newPhone();
        ApiClient laptop = register(phone);
        laptop.post("/api/v1/cart/items", Map.of("variantId", tee, "quantity", 1));

        ApiClient phoneBrowser = new ApiClient(port);
        phoneBrowser.post("/api/v1/cart/items", Map.of("variantId", tee, "quantity", 3));
        phoneBrowser.post("/api/v1/cart/items", Map.of("variantId", chino, "quantity", 1));
        phoneBrowser.post("/api/v1/auth/login", Map.of("phone", phone, "password", "cotton-123"));

        JsonNode merged = phoneBrowser.get("/api/v1/cart").body();
        assertThat(quantity(merged, tee)).isEqualTo(3);
        assertThat(quantity(merged, chino)).isEqualTo(1);
        assertThat(quantity(laptop.get("/api/v1/cart").body(), chino)).isEqualTo(1);
        phoneBrowser.post("/api/v1/auth/logout", null);
        assertThat(phoneBrowser.get("/api/v1/cart").body().get("itemCount").asInt()).isZero();
    }

    @Test
    void ordersAddressesAndOrderAgain() {
        long kurti = variant("block-print-cotton-kurti", "M");
        long palazzo = variant("wide-leg-palazzo", "S");
        String phone = newPhone();
        ApiClient customer = register(phone);
        customer.post("/api/v1/cart/items", Map.of("variantId", kurti, "quantity", 1));
        customer.post("/api/v1/cart/items", Map.of("variantId", palazzo, "quantity", 2));
        String number = customer.post("/api/v1/checkout", order(phone, true)).body().get("number").asString();

        JsonNode history = customer.get("/api/v1/account/orders").body();
        assertThat(history.get("items").get(0).get("number").asString()).isEqualTo(number);
        assertThat(history.get("items").get(0).get("lineCount").asInt()).isEqualTo(2);
        JsonNode saved = customer.get("/api/v1/account/addresses").body();
        assertThat(saved).hasSize(1);
        assertThat(saved.get(0).get("zone").asString()).isEqualTo("DHAKA");
        assertThat(saved.get(0).get("isDefault").asBoolean()).isTrue();

        ApiClient stranger = register(newPhone());
        assertThat(stranger.get("/api/v1/account/orders/" + number).status()).isEqualTo(404);
        assertThat(stranger.post("/api/v1/account/orders/" + number + "/reorder", null).status()).isEqualTo(404);

        jdbc.sql("update variants set stock = 0 where id = :id").param("id", palazzo).update();
        JsonNode again = customer.post("/api/v1/account/orders/" + number + "/reorder", null).body();
        assertThat(again.get("added").asInt()).isEqualTo(1);
        assertThat(again.get("unavailable").get(0).asString()).isEqualTo("Wide-Leg Palazzo (Black, S)");
        assertThat(quantity(again.get("cart"), kurti)).isEqualTo(1);
        jdbc.sql("update variants set stock = 20 where id = :id").param("id", palazzo).update();

        Map<String, Object> office = new HashMap<>(Map.of("label", "Office", "name", "Sadia", "phone", phone,
                "address", "Level 4, Gulshan Avenue", "area", "Gulshan", "city", "Dhaka", "zone", "DHAKA", "makeDefault", true));
        customer.post("/api/v1/account/addresses", office);
        JsonNode list = customer.get("/api/v1/account/addresses").body();
        assertThat(list.get(0).get("label").asString()).isEqualTo("Office");
        Map<String, Object> noZone = new HashMap<>(office);
        noZone.remove("zone");
        assertThat(customer.post("/api/v1/account/addresses", noZone).body().get("fields").has("zone")).isTrue();
    }

    @Test
    void piecesCanBeSavedForLater() {
        ApiClient customer = register(newPhone());
        long dress = product("floral-tiered-dress");
        long shirt = product("oxford-button-down-shirt");
        customer.post("/api/v1/account/wishlist", Map.of("productId", dress));
        List<Long> ids = StreamSupport.stream(customer.post("/api/v1/account/wishlist", Map.of("productId", shirt)).body()
                .spliterator(), false).map(JsonNode::asLong).toList();
        assertThat(ids).containsExactly(shirt, dress);
        // Saving twice changes nothing.
        assertThat(customer.post("/api/v1/account/wishlist", Map.of("productId", shirt)).body()).hasSize(2);
        JsonNode cards = customer.get("/api/v1/account/wishlist").body();
        assertThat(cards.get(0).get("slug").asString()).isEqualTo("oxford-button-down-shirt");
        assertThat(customer.delete("/api/v1/account/wishlist/" + shirt).body()).hasSize(1);
        assertThat(customer.post("/api/v1/account/wishlist", Map.of("productId", 999_999)).status()).isEqualTo(404);
        assertThat(new ApiClient(port).get("/api/v1/account/wishlist").status()).isEqualTo(401);
    }

    @Test
    void theDemoCustomerHasHistoryAndSavedPieces() {
        ApiClient demo = signIn(DemoData.DEMO_PHONE, DemoData.DEMO_PASSWORD);
        assertThat(demo.get("/api/v1/account/orders").body().get("total").asInt()).isEqualTo(2);
        assertThat(demo.get("/api/v1/account/wishlist").body()).hasSize(3);
        assertThat(demo.get("/api/v1/account/addresses").body().get(0).get("area").asString()).isEqualTo("Dhanmondi");
    }

    @Test
    void changingThePasswordSignsOutOtherDevices() {
        String phone = newPhone();
        ApiClient here = register(phone);
        ApiClient elsewhere = signIn(phone, "cotton-123");
        assertThat(here.post("/api/v1/account/password",
                Map.of("currentPassword", "cotton-123", "newPassword", "garden-456")).status()).isEqualTo(204);
        assertThat(here.get("/api/v1/account/profile").status()).isEqualTo(200);
        assertThat(elsewhere.get("/api/v1/account/profile").status()).isEqualTo(401);
    }
}
