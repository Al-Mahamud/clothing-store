package com.tanti.store.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import com.tanti.store.support.ApiClient;
import com.tanti.store.support.ApiClient.Response;
import com.tanti.store.support.IntegrationTest;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.server.LocalServerPort;
import tools.jackson.databind.JsonNode;

@IntegrationTest
class CatalogApiTests {

    @LocalServerPort
    int port;

    ApiClient api;

    @BeforeEach
    void setUp() {
        api = new ApiClient(port);
    }

    @Test
    void categoryTreeCountsIncludeSubCategories() {
        JsonNode tree = api.get("/api/v1/categories").body();
        assertThat(names(tree)).containsExactly("Men", "Women", "Kids");
        JsonNode men = tree.get(0);
        int childSum = 0;
        for (JsonNode child : men.get("children")) {
            childSum += child.get("productCount").asInt();
        }
        assertThat(men.get("productCount").asInt()).isEqualTo(childSum).isEqualTo(14);
        assertThat(men.get("image").asString()).startsWith("/media/demo/");
    }

    @Test
    void categoryFilterIncludesSubCategories() {
        JsonNode page = api.get("/api/v1/products?category=men&pageSize=48").body();
        assertThat(page.get("total").asInt()).isEqualTo(14);
        assertThat(page.get("items")).hasSize(14);

        JsonNode panjabi = api.get("/api/v1/products?category=men-panjabi").body();
        assertThat(panjabi.get("total").asInt()).isEqualTo(4);
        for (JsonNode item : panjabi.get("items")) {
            assertThat(item.get("category").asString()).isEqualTo("Panjabi");
        }
    }

    @Test
    void sizeFilterMatchesStockAndFacetsIgnoreTheirOwnFilter() {
        JsonNode page = api.get("/api/v1/products?size=30").body();
        assertThat(page.get("total").asInt()).isBetween(1, 3);
        for (JsonNode item : page.get("items")) {
            assertThat(item.get("name").asString()).containsAnyOf("Chino", "Jeans");
        }
        List<String> sizeFacet = new ArrayList<>();
        page.get("facets").get("sizes").forEach(f -> sizeFacet.add(f.get("value").asString()));
        assertThat(sizeFacet).contains("S", "M", "30", "4-5Y");
        assertThat(sizeFacet.indexOf("S")).isLessThan(sizeFacet.indexOf("M"));
        assertThat(sizeFacet.indexOf("28")).isLessThan(sizeFacet.indexOf("30"));
    }

    @Test
    void colourFilterUsesFamilies() {
        JsonNode page = api.get("/api/v1/products?category=women&color=green&pageSize=48").body();
        assertThat(page.get("total").asInt()).isPositive();
        JsonNode green = null;
        for (JsonNode f : page.get("facets").get("colors")) {
            if (f.get("value").asString().equals("GREEN")) {
                green = f;
            }
        }
        assertThat(green).isNotNull();
        assertThat(green.get("selected").asBoolean()).isTrue();
        assertThat(api.get("/api/v1/products?color=plaid").status()).isEqualTo(400);
    }

    @Test
    void searchMatchesPartWords() {
        JsonNode page = api.get("/api/v1/products?q=lin&pageSize=48").body();
        assertThat(names(page.get("items"))).contains("Linen Camp-Collar Shirt", "Relaxed Linen Shirt");
        assertThat(api.get("/api/v1/products?q=zzzz").body().get("total").asInt()).isZero();
        assertThat(api.get("/api/v1/products?q=%27%3A%2A%26").status()).isEqualTo(200);
    }

    @Test
    void sortsByPrice() {
        JsonNode items = api.get("/api/v1/products?sort=price_asc&pageSize=48").body().get("items");
        int previous = 0;
        for (JsonNode item : items) {
            assertThat(item.get("price").asInt()).isGreaterThanOrEqualTo(previous);
            previous = item.get("price").asInt();
        }
        assertThat(api.get("/api/v1/products?sort=cheapest").status()).isEqualTo(400);
    }

    @Test
    void saleShowsOnlyDiscountedProducts() {
        JsonNode items = api.get("/api/v1/products?sale=true&pageSize=48").body().get("items");
        assertThat(items).isNotEmpty();
        for (JsonNode item : items) {
            assertThat(item.get("compareAtPrice").asInt()).isGreaterThan(item.get("price").asInt());
        }
    }

    @Test
    void productPageHasColoursSizesAndBreadcrumb() {
        Response response = api.get("/api/v1/products/eid-cotton-panjabi");
        assertThat(response.status()).isEqualTo(200);
        JsonNode product = response.body();
        assertThat(names(product.get("breadcrumb"))).containsExactly("Men", "Panjabi");
        assertThat(product.get("colors")).hasSize(3);
        JsonNode first = product.get("colors").get(0);
        assertThat(first.get("name").asString()).isEqualTo("Off-white");
        assertThat(first.get("images")).hasSize(2);
        List<String> sizes = new ArrayList<>();
        first.get("sizes").forEach(s -> sizes.add(s.get("size").asString()));
        assertThat(sizes).containsExactly("S", "M", "L", "XL", "XXL");
        assertThat(product.get("details")).hasSizeGreaterThan(2);
        assertThat(product.get("isNew").asBoolean()).isTrue();
    }

    @Test
    void unknownProductIsNotFound() {
        Response response = api.get("/api/v1/products/no-such-thing");
        assertThat(response.status()).isEqualTo(404);
        assertThat(response.body().get("code").asString()).isEqualTo("product.not_found");
    }

    @Test
    void relatedProductsComeFromTheSameFamily() {
        JsonNode related = api.get("/api/v1/products/eid-cotton-panjabi/related").body();
        assertThat(names(related)).doesNotContain("Eid Cotton Panjabi").isNotEmpty();
        assertThat(related.get(0).get("category").asString()).isEqualTo("Panjabi");
    }

    @Test
    void homeAndCollections() {
        JsonNode home = api.get("/api/v1/home").body();
        assertThat(home.get("newArrivals")).hasSize(8);
        assertThat(home.get("bestSellers").get(0).get("name").asString()).isEqualTo("Heavyweight Crew Tee");
        assertThat(names(home.get("collections"))).containsExactly("Eid Edit", "Linen Season", "Everyday Essentials");

        JsonNode eid = api.get("/api/v1/collections/eid-edit").body();
        assertThat(eid.get("productCount").asInt())
                .isEqualTo(api.get("/api/v1/products?collection=eid-edit").body().get("total").asInt());
    }

    @Test
    void demoImagesAreServed() {
        String image = api.get("/api/v1/products/eid-cotton-panjabi").body()
                .get("colors").get(0).get("images").get(0).get("url").asString();
        assertThat(api.get(image).status()).isEqualTo(200);
    }

    private static List<String> names(JsonNode nodes) {
        List<String> names = new ArrayList<>();
        nodes.forEach(n -> names.add(n.get("name").asString()));
        return names;
    }
}
