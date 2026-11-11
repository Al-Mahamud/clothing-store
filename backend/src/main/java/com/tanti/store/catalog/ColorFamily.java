package com.tanti.store.catalog;

import java.util.Arrays;
import java.util.Optional;

/** Basic colours shoppers filter by. Each product colour belongs to one family. */
public enum ColorFamily {
    BLACK("Black", "#1C1C1C"),
    WHITE("White", "#F4F1EA"),
    GREY("Grey", "#8C8C8C"),
    BEIGE("Beige", "#CDB894"),
    BROWN("Brown", "#7A4E2D"),
    RED("Red", "#9E2B2B"),
    PINK("Pink", "#D9A0A6"),
    ORANGE("Orange", "#C8683A"),
    YELLOW("Yellow", "#D2A23A"),
    GREEN("Green", "#4D6B48"),
    BLUE("Blue", "#3C5A86"),
    PURPLE("Purple", "#8A6FA8");

    private final String label;
    private final String hex;

    ColorFamily(String label, String hex) {
        this.label = label;
        this.hex = hex;
    }

    public String label() {
        return label;
    }

    public String hex() {
        return hex;
    }

    public static Optional<ColorFamily> parse(String value) {
        return Arrays.stream(values()).filter(f -> f.name().equalsIgnoreCase(value.trim())).findFirst();
    }
}
