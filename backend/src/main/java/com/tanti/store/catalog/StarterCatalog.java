package com.tanti.store.catalog;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * A new shop starts with the usual men's, women's and kids' categories, so the owner can add products
 * straight away.
 * Runs only while there are no categories at all; after that they are edited in the admin area
 * (pictures included). Turn off with {@code store.starter-data=false}.
 */
@Component
@Order(0)
public class StarterCatalog implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(StarterCatalog.class);

    /** parent slug (null for top level), name, slug, description. */
    public static final List<String[]> CATEGORIES = List.of(
            new String[] {null, "Men", "men", "Panjabis, shirts and everyday basics."},
            new String[] {"men", "Panjabi", "men-panjabi", "Festive and everyday panjabis."},
            new String[] {"men", "Shirts", "men-shirts", "Oxford, linen and poplin shirts."},
            new String[] {"men", "T-shirts & Polos", "men-tshirts", "Tees, polos and hoodies."},
            new String[] {"men", "Trousers & Jeans", "men-trousers", "Chinos and denim."},
            new String[] {null, "Women", "women", "Kurtis, three-pieces and dresses."},
            new String[] {"women", "Kurtis", "women-kurtis", "Printed, plain and embroidered kurtis."},
            new String[] {"women", "Three-Piece", "women-three-piece", "Complete sets with dupatta."},
            new String[] {"women", "Dresses", "women-dresses", "Midi and maxi dresses."},
            new String[] {"women", "Tops & Shirts", "women-tops", "Tees and shirts."},
            new String[] {"women", "Bottoms", "women-bottoms", "Palazzos and jeans."},
            new String[] {null, "Kids", "kids", "Comfortable clothes for play and festivals."},
            new String[] {"kids", "Boys", "kids-boys", "Tees, panjabis and joggers."},
            new String[] {"kids", "Girls", "kids-girls", "Frocks and hoodies."});

    private final JdbcClient jdbc;
    private final TransactionTemplate tx;
    private final boolean enabled;

    StarterCatalog(JdbcClient jdbc, TransactionTemplate tx, @Value("${store.starter-data:true}") boolean enabled) {
        this.jdbc = jdbc;
        this.tx = tx;
        this.enabled = enabled;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled || jdbc.sql("select count(*) from categories").query(Long.class).single() > 0) {
            return;
        }
        tx.executeWithoutResult(status -> {
            Map<String, Long> ids = new HashMap<>();
            Map<String, Integer> positions = new HashMap<>();
            for (String[] c : CATEGORIES) {
                String parentKey = c[0] == null ? "" : c[0];
                int position = positions.merge(parentKey, 1, Integer::sum) - 1;
                long id = jdbc.sql("""
                                insert into categories (parent_id, name, slug, description, position)
                                values (:parent, :name, :slug, :description, :position) returning id""")
                        .param("parent", c[0] == null ? null : ids.get(c[0])).param("name", c[1]).param("slug", c[2])
                        .param("description", c[3]).param("position", position)
                        .query(Long.class).single();
                ids.put(c[2], id);
            }
        });
        log.info("Added the starter categories");
    }
}
