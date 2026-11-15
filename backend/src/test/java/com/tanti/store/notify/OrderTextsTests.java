package com.tanti.store.notify;

import static org.assertj.core.api.Assertions.assertThat;

import com.tanti.store.support.ApiClient;
import com.tanti.store.support.DemoData;
import com.tanti.store.support.IntegrationTest;
import com.tanti.store.support.TextsSent;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.simple.JdbcClient;
import tools.jackson.databind.JsonNode;

@IntegrationTest
class OrderTextsTests {

    /** The GSM 7-bit basic alphabet: anything else makes a text Unicode and only 70 characters long. */
    static final Pattern GSM = Pattern.compile("[A-Za-z0-9 @£$¥èéùìòÇ\\nØø\\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!\"#¤%&'()*+,\\-./:;<=>?¡ÄÖÑÜ§¿äöñüà]*");

    @LocalServerPort
    int port;

    @Autowired
    JdbcClient jdbc;

    ApiClient admin;

    @BeforeEach
    void signIn() {
        admin = new ApiClient(port);
        admin.post("/api/v1/staff/login", Map.of("phone", DemoData.STAFF_PHONE, "password", DemoData.STAFF_PASSWORD));
    }

    long variant(String slug, String size) {
        long id = jdbc.sql("""
                        select v.id from variants v join products p on p.id = v.product_id
                         where p.slug = :s and v.size = :size order by v.color_id, v.id limit 1""")
                .param("s", slug).param("size", size).query(Long.class).single();
        jdbc.sql("update variants set stock = 50 where id = :id").param("id", id).update();
        return id;
    }

    JsonNode place(String phone, String slug, String size) {
        ApiClient shopper = new ApiClient(port);
        shopper.post("/api/v1/cart/items", Map.of("variantId", variant(slug, size), "quantity", 1));
        Map<String, Object> body = new HashMap<>();
        body.put("name", "Mitu Rahman");
        body.put("phone", phone);
        body.put("address", "Flat 2C, House 8, Road 4");
        body.put("area", "Uttara");
        body.put("city", "Dhaka");
        body.put("zone", "DHAKA");
        body.put("paymentMethod", "COD");
        ApiClient.Response r = shopper.post("/api/v1/checkout", body);
        assertThat(r.status()).isEqualTo(201);
        return r.body();
    }

    void move(String number, String status, Map<String, Object> extra) {
        Map<String, Object> body = new HashMap<>(extra);
        body.put("status", status);
        assertThat(admin.post("/api/v1/admin/orders/" + number + "/status", body).status()).isEqualTo(200);
    }

    static void assertOneSms(String text) {
        assertThat(text.length()).as(text).isLessThanOrEqualTo(160);
        assertThat(GSM.matcher(text).matches()).as("SMS alphabet: " + text).isTrue();
    }

    @Test
    void customersAreTextedWhenAnOrderIsPlacedSentAndCancelled() {
        String phone = "01556000101";
        String number = place(phone, "heavyweight-crew-tee", "M").get("number").asString();
        List<String> placed = TextsSent.bodies(jdbc, phone, "ORDER_PLACED");
        assertThat(placed).hasSize(1);
        assertThat(placed.get(0)).startsWith("Tanti: ").contains(number, "cash on delivery", "shop.test/track");
        assertOneSms(placed.get(0));

        move(number, "CONFIRMED", Map.of());
        assertThat(jdbc.sql("select count(*) from sms_messages where phone = :p").param("p", phone)
                .query(Long.class).single()).isEqualTo(1);
        move(number, "SHIPPED", Map.of("courier", "Sundarban Courier Service Limited Head Office", "trackingCode", "SCS-55021"));
        String shipped = TextsSent.bodies(jdbc, phone, "ORDER_SHIPPED").get(0);
        assertThat(shipped).contains(number, "Sundarban Courier", "SCS-55021", "keep Tk");
        assertOneSms(shipped);

        String second = place(phone, "pique-polo", "M").get("number").asString();
        move(second, "CANCELLED", Map.of("restock", true));
        String cancelled = TextsSent.bodies(jdbc, phone, "ORDER_CANCELLED").get(0);
        assertThat(cancelled).contains(second, "Call us");
        assertOneSms(cancelled);
    }

    @Test
    void deliveryIsRecordedButNotTexted() {
        String phone = "01556000202";
        String number = place(phone, "tapered-chino", "32").get("number").asString();
        move(number, "CONFIRMED", Map.of());
        move(number, "SHIPPED", Map.of());
        move(number, "DELIVERED", Map.of());
        assertThat(jdbc.sql("select delivered_at is not null from orders where number = :n").param("n", number)
                .query(Boolean.class).single()).isTrue();
        assertThat(jdbc.sql("select count(*) from sms_messages where phone = :p").param("p", phone)
                .query(Long.class).single()).isEqualTo(2);
    }
}
