package com.tanti.store.catalog;

import java.util.List;

/**
 * Sort order for sizes, so S comes before M and 30 before 32 whatever order they were added in.
 * Letter sizes come first, then waist sizes, then kids' ages, then anything else.
 */
public final class SizeOrder {

    private static final List<String> LETTERS = List.of("XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL");
    private static final List<String> KIDS = List.of("0-6M", "6-12M", "1-2Y", "2-3Y", "3-4Y", "4-5Y", "5-6Y",
            "6-7Y", "7-8Y", "8-9Y", "9-10Y", "10-11Y", "11-12Y", "12-13Y");

    private SizeOrder() {
    }

    public static int position(String size) {
        String s = size.trim().toUpperCase();
        int letter = LETTERS.indexOf(s);
        if (letter >= 0) {
            return 10 + letter;
        }
        if (s.matches("\\d{2}")) {
            return 100 + Integer.parseInt(s);
        }
        int kids = KIDS.indexOf(s);
        if (kids >= 0) {
            return 300 + kids;
        }
        return s.equals("FREE") || s.equals("ONE SIZE") ? 500 : 900;
    }
}
