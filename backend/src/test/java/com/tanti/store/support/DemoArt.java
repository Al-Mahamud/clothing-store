package com.tanti.store.support;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Draws flat-lay garment illustrations as SVG, standing in for product photos in demo data.
 * Canvas is 600 x 800 (3:4, the product image ratio). Shapes are drawn for the left half and
 * mirrored where a garment is symmetric.
 */
public final class DemoArt {

    public enum Garment { TEE, POLO, SHIRT, PANJABI, HOODIE, TROUSERS, JEANS, KURTI, THREE_PIECE, DRESS, PALAZZO, FROCK, KIDS_TEE, KIDS_PANJABI, JOGGER }

    public enum Fabric { PLAIN, CHECK, STRIPE, PRINT, FLORAL, EMBROIDERED }

    private DemoArt() {
    }

    /** Full garment on a soft backdrop. */
    public static String product(Garment garment, Fabric fabric, String hex) {
        return document("0 0 600 800", backdrop(hex, 600, 800) + garment(garment, fabric, hex, "g", ""));
    }

    /** A close-up of the same garment: the second image on product cards and pages. */
    public static String detail(Garment garment, Fabric fabric, String hex) {
        String crop = switch (garment) {
            case TROUSERS, JEANS, PALAZZO, JOGGER -> "150 80 300 400";
            case DRESS, FROCK -> "160 90 280 373";
            default -> "165 70 270 360";
        };
        return document(crop, backdrop(hex, 600, 800) + garment(garment, fabric, hex, "g", ""));
    }

    /** A wide banner with several garments, for collections and the home page. */
    public static String banner(String background, Object[]... looks) {
        StringBuilder body = new StringBuilder();
        body.append("<rect width=\"1600\" height=\"1000\" fill=\"").append(background).append("\"/>");
        body.append("<rect width=\"1600\" height=\"1000\" fill=\"url(#bannerLight)\"/>");
        int n = looks.length;
        for (int i = 0; i < n; i++) {
            Object[] look = looks[i];
            double scale = n >= 3 ? 0.98 : 1.08;
            double x = 800 - (n * 600 * scale * 0.78) / 2 + i * 600 * scale * 0.78 - 20;
            double y = (1000 - 800 * scale) / 2 + 40 + (i % 2 == 1 ? -18 : 0);
            String transform = String.format(Locale.ROOT, "translate(%.0f %.0f) scale(%.2f)", x, y, scale);
            body.append(garment((Garment) look[0], (Fabric) look[1], (String) look[2], "b" + i, transform));
        }
        String defs = "<defs><radialGradient id=\"bannerLight\" cx=\"50%\" cy=\"30%\" r=\"80%\">"
                + "<stop offset=\"0\" stop-color=\"#fff\" stop-opacity=\".22\"/>"
                + "<stop offset=\"1\" stop-color=\"#000\" stop-opacity=\".12\"/></radialGradient></defs>";
        return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1600 1000\" preserveAspectRatio=\"xMidYMid slice\">"
                + defs + body + "</svg>";
    }

    private static String document(String viewBox, String content) {
        return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"" + viewBox
                + "\" preserveAspectRatio=\"xMidYMid slice\">" + content + "</svg>";
    }

    private static String backdrop(String hex, int w, int h) {
        double lum = luminance(hex);
        String base = lum > 0.72 ? "#DCD5C9" : "#EEEAE3";
        String light = mix(base, hex, 0.07);
        String dark = mix(darken(base, 0.06), hex, 0.10);
        return "<defs><radialGradient id=\"bg\" cx=\"50%\" cy=\"38%\" r=\"78%\">"
                + "<stop offset=\"0\" stop-color=\"" + lighten(light, 0.25) + "\"/>"
                + "<stop offset=\"1\" stop-color=\"" + dark + "\"/></radialGradient></defs>"
                + "<rect width=\"" + w + "\" height=\"" + h + "\" fill=\"url(#bg)\"/>";
    }

    // ---------------------------------------------------------------- garments

    private static String garment(Garment garment, Fabric fabric, String hex, String id, String transform) {
        Shape shape = shape(garment, hex);
        String line = darken(hex, luminance(hex) < 0.15 ? -0.35 : 0.28);
        StringBuilder g = new StringBuilder();
        g.append("<g").append(transform.isEmpty() ? "" : " transform=\"" + transform + "\"").append(">");
        g.append("<defs>")
                .append("<clipPath id=\"").append(id).append("c\"><path d=\"").append(shape.body).append("\"/></clipPath>")
                .append("<linearGradient id=\"").append(id).append("s\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\">")
                .append(stop(0, "#000", .16)).append(stop(.22, "#fff", .07)).append(stop(.5, "#fff", 0))
                .append(stop(.78, "#000", .04)).append(stop(1, "#000", .18)).append("</linearGradient>")
                .append("<linearGradient id=\"").append(id).append("v\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">")
                .append(stop(0, "#fff", .10)).append(stop(.6, "#000", 0)).append(stop(1, "#000", .14))
                .append("</linearGradient>")
                .append("<filter id=\"").append(id).append("n\" x=\"0\" y=\"0\" width=\"100%\" height=\"100%\">")
                .append("<feTurbulence type=\"fractalNoise\" baseFrequency=\"1.1\" numOctaves=\"2\" seed=\"4\"/>")
                .append("<feColorMatrix type=\"saturate\" values=\"0\"/>")
                .append("<feComponentTransfer><feFuncA type=\"table\" tableValues=\"0 .22\"/></feComponentTransfer></filter>")
                .append("<filter id=\"").append(id).append("d\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"140%\">")
                .append("<feDropShadow dx=\"0\" dy=\"16\" stdDeviation=\"18\" flood-color=\"#2a2118\" flood-opacity=\".22\"/></filter>")
                .append(pattern(fabric, hex, id))
                .append("</defs>");
        g.append(shape.under);
        g.append("<path d=\"").append(shape.body).append("\" fill=\"").append(hex)
                .append("\" filter=\"url(#").append(id).append("d)\"/>");
        g.append("<g clip-path=\"url(#").append(id).append("c)\">");
        if (fabric != Fabric.PLAIN && fabric != Fabric.EMBROIDERED) {
            g.append("<rect width=\"600\" height=\"800\" fill=\"url(#").append(id).append("p)\"/>");
        }
        g.append(shape.inside.replace("LINE", line).replace("ACCENT", accent(hex)));
        g.append("<rect width=\"600\" height=\"800\" fill=\"url(#").append(id).append("s)\"/>");
        g.append("<rect width=\"600\" height=\"800\" fill=\"url(#").append(id).append("v)\"/>");
        g.append("<rect width=\"600\" height=\"800\" filter=\"url(#").append(id).append("n)\" opacity=\".55\"/>");
        g.append("</g>");
        g.append(shape.over.replace("LINE", line).replace("ACCENT", accent(hex)).replace("SHADOW", darken(hex, .35)));
        if (fabric == Fabric.EMBROIDERED) {
            g.append(embroidery(garment, hex));
        }
        g.append("</g>");
        return g.toString();
    }

    private record Shape(String body, String under, String inside, String over) {
    }

    private static final String STITCH = "fill=\"none\" stroke=\"LINE\" stroke-width=\"2\" stroke-dasharray=\"6 5\" opacity=\".55\"";
    private static final String SEAM = "fill=\"none\" stroke=\"LINE\" stroke-width=\"2.2\" opacity=\".6\"";
    private static final String FOLD = "fill=\"none\" stroke=\"#000\" stroke-width=\"10\" stroke-linecap=\"round\" opacity=\".06\"";

    private static Shape shape(Garment garment, String hex) {
        String inner = darken(hex, .32);
        return switch (garment) {
            case TEE, KIDS_TEE, POLO -> {
                String body = "M228 140 C252 170 348 170 372 140 L452 162 L548 262 L490 326 L438 286 L440 668 "
                        + "C360 678 240 678 160 668 L162 286 L110 326 L52 262 L148 162 Z";
                String over = "<path d=\"M228 140 C258 126 342 126 372 140 C348 170 252 170 228 140 Z\" fill=\"" + inner + "\"/>"
                        + "<path d=\"M228 140 C252 170 348 170 372 140\" fill=\"none\" stroke=\"LINE\" stroke-width=\"9\" opacity=\".55\"/>"
                        + "<path d=\"M164 650 C240 659 360 659 436 650\" " + STITCH + "/>"
                        + "<path d=\"M62 254 L120 316 M538 254 L480 316\" " + STITCH + "/>"
                        + "<path d=\"M148 162 L162 286 M452 162 L438 286\" " + SEAM + "/>";
                if (garment == Garment.POLO) {
                    over = "<path d=\"M228 140 C258 126 342 126 372 140 C348 170 252 170 228 140 Z\" fill=\"" + inner + "\"/>"
                            + "<rect x=\"284\" y=\"160\" width=\"32\" height=\"150\" rx=\"3\" fill=\"" + hex + "\" stroke=\"LINE\" stroke-width=\"2\" opacity=\".95\"/>"
                            + "<circle cx=\"300\" cy=\"212\" r=\"6\" fill=\"" + lighten(hex, .5) + "\" stroke=\"LINE\"/>"
                            + "<circle cx=\"300\" cy=\"262\" r=\"6\" fill=\"" + lighten(hex, .5) + "\" stroke=\"LINE\"/>"
                            + "<path d=\"M224 134 Q236 192 270 226 L300 170 Q262 160 238 134 Z\" fill=\"" + hex + "\" stroke=\"LINE\" stroke-width=\"2\"/>"
                            + "<path d=\"M376 134 Q364 192 330 226 L300 170 Q338 160 362 134 Z\" fill=\"" + hex + "\" stroke=\"LINE\" stroke-width=\"2\"/>"
                            + "<path d=\"M164 650 C240 659 360 659 436 650\" " + STITCH + "/>"
                            + "<path d=\"M58 258 L116 322 M542 258 L484 322\" fill=\"none\" stroke=\"LINE\" stroke-width=\"12\" opacity=\".25\"/>"
                            + "<path d=\"M148 162 L162 286 M452 162 L438 286\" " + SEAM + "/>";
                }
                if (garment == Garment.KIDS_TEE) {
                    over += "<g transform=\"translate(300 360)\"><circle r=\"62\" fill=\"ACCENT\" opacity=\".9\"/>"
                            + "<path d=\"M0 -38 L11 -12 L38 -11 L17 7 L24 34 L0 19 L-24 34 L-17 7 L-38 -11 L-11 -12 Z\" fill=\"" + hex + "\"/></g>";
                }
                String inside = "<path d=\"M250 420 C270 490 262 570 282 650\" " + FOLD + "/><path d=\"M370 330 C380 420 392 520 380 640\" " + FOLD + "/>";
                yield new Shape(body, "", inside, over);
            }
            case SHIRT -> {
                String body = "M232 128 L368 128 L452 156 C470 250 486 400 500 560 L446 572 C436 450 430 360 428 300 "
                        + "L432 690 C380 704 220 704 168 690 L172 300 C170 360 164 450 154 572 L100 560 C114 400 130 250 148 156 Z";
                String over = "<path d=\"M232 126 C270 110 330 110 368 126 L300 152 Z\" fill=\"" + inner + "\"/>"
                        + "<rect x=\"288\" y=\"170\" width=\"24\" height=\"526\" fill=\"none\" stroke=\"LINE\" stroke-width=\"2\" opacity=\".55\"/>"
                        + buttons(300, 230, 70, 7, 5.5, lighten(hex, .55))
                        + "<path d=\"M230 124 L300 154 L278 212 L218 162 Z\" fill=\"" + hex + "\" stroke=\"LINE\" stroke-width=\"2\"/>"
                        + "<path d=\"M370 124 L300 154 L322 212 L382 162 Z\" fill=\"" + hex + "\" stroke=\"LINE\" stroke-width=\"2\"/>"
                        + "<path d=\"M338 252 L400 252 L400 318 L369 332 L338 318 Z\" " + SEAM + "/>"
                        + "<path d=\"M106 516 L158 526 M494 516 L442 526\" " + SEAM + "/>"
                        + "<path d=\"M148 156 C160 220 170 260 172 300 M452 156 C440 220 430 260 428 300\" " + SEAM + "/>"
                        + "<path d=\"M172 676 C230 690 370 690 428 676\" " + STITCH + "/>";
                String inside = "<path d=\"M240 330 C250 450 246 560 256 680\" " + FOLD + "/><path d=\"M372 380 C376 470 384 560 378 660\" " + FOLD + "/>";
                yield new Shape(body, "", inside, over);
            }
            case PANJABI, KIDS_PANJABI -> {
                String body = "M236 132 L364 132 L448 158 C466 250 482 400 494 580 L440 590 C432 460 428 370 426 300 "
                        + "L448 770 L152 770 L174 300 C172 370 168 460 160 590 L106 580 C118 400 134 250 152 158 Z";
                String gold = "#C9A75A";
                String over = "<path d=\"M236 132 C260 150 340 150 364 132 L362 112 C340 128 260 128 238 112 Z\" fill=\"" + hex + "\" stroke=\"LINE\" stroke-width=\"2\"/>"
                        + "<path d=\"M238 112 C260 128 340 128 362 112 C340 104 260 104 238 112 Z\" fill=\"" + inner + "\"/>"
                        + "<rect x=\"289\" y=\"146\" width=\"22\" height=\"250\" fill=\"none\" stroke=\"LINE\" stroke-width=\"2\" opacity=\".6\"/>"
                        + buttons(300, 186, 58, 4, 5.5, gold)
                        + "<path d=\"M158 772 L170 650 M442 772 L430 650\" " + SEAM + "/>"
                        + "<path d=\"M112 540 L162 548 M488 540 L438 548\" " + SEAM + "/>"
                        + "<path d=\"M152 158 C164 220 172 260 174 300 M448 158 C436 220 428 260 426 300\" " + SEAM + "/>"
                        + "<path d=\"M156 754 L444 754\" " + STITCH + "/>";
                String inside = "<path d=\"M236 420 C246 540 240 650 250 760\" " + FOLD + "/><path d=\"M368 420 C374 540 382 650 376 760\" " + FOLD + "/>";
                yield new Shape(body, "", inside, over);
            }
            case HOODIE -> {
                String body = "M226 140 L374 140 L454 168 C474 270 492 420 506 560 L452 572 C440 450 432 360 430 310 "
                        + "L432 652 L168 652 L170 310 C168 360 160 450 148 572 L94 560 C108 420 126 270 146 168 Z";
                String hood = "<path d=\"M206 160 C190 80 246 30 300 30 C354 30 410 80 394 160 Z\" fill=\"" + hex + "\"/>"
                        + "<path d=\"M206 160 C190 80 246 30 300 30 C354 30 410 80 394 160 Z\" fill=\"#000\" opacity=\".10\"/>";
                String over = "<path d=\"M236 146 C246 92 354 92 364 146 C340 178 260 178 236 146 Z\" fill=\"" + inner + "\"/>"
                        + "<path d=\"M282 168 L274 300 M318 168 L326 300\" stroke=\"" + lighten(hex, .6) + "\" stroke-width=\"5\" stroke-linecap=\"round\"/>"
                        + "<path d=\"M210 474 L390 474 L422 604 L178 604 Z\" " + SEAM + "/>"
                        + "<path d=\"M210 474 L180 600 M390 474 L420 600\" fill=\"none\" stroke=\"LINE\" stroke-width=\"4\" opacity=\".5\"/>"
                        + "<path d=\"M176 652 L424 652 L420 694 L180 694 Z\" fill=\"" + hex + "\"/>"
                        + "<path d=\"M176 652 L424 652 L420 694 L180 694 Z\" fill=\"#000\" opacity=\".10\"/>"
                        + ribs(184, 652, 418, 694, 8)
                        + "<path d=\"M452 572 L506 560 L512 600 L458 610 Z M148 572 L94 560 L88 600 L142 610 Z\" fill=\"" + darken(hex, .08) + "\"/>";
                String inside = "<path d=\"M246 330 C256 420 250 520 262 640\" " + FOLD + "/><path d=\"M366 320 C372 420 380 520 372 640\" " + FOLD + "/>";
                yield new Shape(body, hood, inside, over);
            }
            case TROUSERS, JEANS, JOGGER -> {
                boolean jeans = garment == Garment.JEANS;
                boolean jogger = garment == Garment.JOGGER;
                String body = jogger
                        ? "M188 110 L412 110 L414 158 L430 690 L436 750 L326 750 L322 690 L300 340 L278 690 L274 750 L164 750 L170 690 L186 158 Z"
                        : "M190 110 L410 110 L412 150 L436 760 L322 760 L300 330 L278 760 L164 760 L188 150 Z";
                String stitch = jeans ? "fill=\"none\" stroke=\"#D39A4C\" stroke-width=\"2.2\" stroke-dasharray=\"6 4\"" : STITCH;
                StringBuilder over = new StringBuilder();
                over.append("<path d=\"M190 110 L410 110 L412 150 L188 150 Z\" fill=\"#000\" opacity=\".10\"/>");
                if (jogger) {
                    over.append(ribs(192, 112, 408, 156, 9));
                    over.append("<path d=\"M170 690 L278 690 L274 750 L164 750 Z M322 690 L430 690 L436 750 L326 750 Z\" fill=\"#000\" opacity=\".12\"/>");
                    over.append("<path d=\"M290 156 C286 190 280 200 272 214 M310 156 C314 190 320 200 328 214\" stroke=\"" + lighten(hex, .6) + "\" stroke-width=\"5\" fill=\"none\" stroke-linecap=\"round\"/>");
                } else {
                    for (int x : new int[] {210, 262, 338, 390}) {
                        over.append("<rect x=\"").append(x - 6).append("\" y=\"104\" width=\"12\" height=\"52\" rx=\"3\" fill=\"").append(hex)
                                .append("\" stroke=\"LINE\" stroke-width=\"1.5\"/>");
                    }
                    over.append("<circle cx=\"300\" cy=\"130\" r=\"8\" fill=\"").append(jeans ? "#B88A4A" : darken(hex, .3)).append("\"/>");
                    over.append("<path d=\"M314 152 L314 286 Q314 312 300 326\" ").append(stitch).append("/>");
                }
                over.append("<path d=\"M196 160 C206 200 220 236 244 252 M404 160 C394 200 380 236 356 252\" ")
                        .append(jeans ? stitch : SEAM).append("/>");
                if (jeans) {
                    over.append("<path d=\"M366 168 L396 168 L398 206 L368 210 Z\" ").append(stitch).append("/>");
                    over.append("<circle cx=\"244\" cy=\"252\" r=\"4\" fill=\"#C59A55\"/><circle cx=\"356\" cy=\"252\" r=\"4\" fill=\"#C59A55\"/>");
                    over.append("<path d=\"M190 150 L410 150\" ").append(stitch).append("/>");
                }
                if (!jogger) {
                    over.append("<path d=\"M168 742 L276 742 M324 742 L432 742\" ").append(stitch).append("/>");
                }
                String inside = "<path d=\"M234 300 L220 740\" stroke=\"#fff\" stroke-width=\"3\" opacity=\".18\"/>"
                        + "<path d=\"M366 300 L380 740\" stroke=\"#fff\" stroke-width=\"3\" opacity=\".18\"/>"
                        + "<path d=\"M250 520 C258 560 252 600 260 660\" " + FOLD + "/>"
                        + (jeans ? "<path d=\"M200 300 C230 420 240 470 236 560\" stroke=\"#fff\" stroke-width=\"40\" opacity=\".08\" fill=\"none\"/>"
                        + "<path d=\"M400 300 C370 420 360 470 364 560\" stroke=\"#fff\" stroke-width=\"40\" opacity=\".08\" fill=\"none\"/>" : "");
                yield new Shape(body, "", inside, over.toString());
            }
            case PALAZZO -> {
                String body = "M200 110 L400 110 L402 160 L470 760 L310 760 L300 360 L290 760 L130 760 L198 160 Z";
                String over = "<path d=\"M200 110 L400 110 L402 160 L198 160 Z\" fill=\"#000\" opacity=\".10\"/>"
                        + ribs(204, 112, 396, 158, 7);
                String inside = "<path d=\"M230 200 L176 750 M262 220 L232 750 M370 200 L424 750 M338 220 L368 750\" fill=\"none\" stroke=\"#000\" stroke-width=\"6\" opacity=\".07\"/>";
                yield new Shape(body, "", inside, over);
            }
            case KURTI, THREE_PIECE -> {
                String body = "M244 120 C262 160 338 160 356 120 L408 140 L470 300 L420 330 L396 262 L392 340 "
                        + "C420 470 452 620 476 770 L124 770 C148 620 180 470 208 340 L204 262 L180 330 L130 300 L192 140 Z";
                String over = "<path d=\"M244 120 C270 108 330 108 356 120 C338 160 262 160 244 120 Z\" fill=\"" + inner + "\"/>"
                        + "<path d=\"M244 120 C262 160 338 160 356 120\" fill=\"none\" stroke=\"ACCENT\" stroke-width=\"6\"/>"
                        + "<path d=\"M300 156 L300 236\" stroke=\"ACCENT\" stroke-width=\"4\"/>"
                        + "<path d=\"M130 300 L180 330 M470 300 L420 330\" stroke=\"ACCENT\" stroke-width=\"8\"/>"
                        + "<path d=\"M150 640 L166 770 M450 640 L434 770\" " + SEAM + "/>";
                String inside = "<path d=\"M120 722 L480 722 L480 770 L120 770 Z\" fill=\"ACCENT\" opacity=\".85\"/>"
                        + "<path d=\"M120 714 L480 714\" stroke=\"ACCENT\" stroke-width=\"3\" opacity=\".85\"/>"
                        + "<path d=\"M244 380 C230 500 220 620 214 760\" " + FOLD + "/><path d=\"M356 380 C370 500 380 620 386 760\" " + FOLD + "/>";
                if (garment == Garment.THREE_PIECE) {
                    String dupatta = mix(accent(hex), hex, .35);
                    over += "<path d=\"M176 150 L246 128 L486 676 L418 712 Z\" fill=\"" + dupatta + "\" opacity=\".88\"/>"
                            + "<path d=\"M176 150 L418 712 M246 128 L486 676\" stroke=\"" + hex + "\" stroke-width=\"7\" opacity=\".7\"/>"
                            + "<path d=\"M418 712 L486 676\" stroke=\"" + dupatta + "\" stroke-width=\"14\" stroke-dasharray=\"2 4\"/>";
                }
                yield new Shape(body, "", inside, over);
            }
            case DRESS -> {
                String body = "M250 110 C270 140 330 140 350 110 L392 122 L420 210 L388 226 L380 200 L376 300 L392 300 "
                        + "L430 460 L452 460 L490 620 L514 620 L540 770 L60 770 L86 620 L110 620 L148 460 L170 460 "
                        + "L208 300 L224 300 L220 200 L212 226 L180 210 L208 122 Z";
                String over = "<path d=\"M250 110 C274 100 326 100 350 110 C330 140 270 140 250 110 Z\" fill=\"" + inner + "\"/>"
                        + "<path d=\"M208 300 L392 300 M148 460 L452 460 M86 620 L514 620\" " + SEAM + "/>"
                        + gathers(214, 300, 386, 14) + gathers(156, 460, 444, 18) + gathers(94, 620, 506, 22);
                String inside = "<path d=\"M230 480 L200 760 M300 470 L300 770 M370 480 L400 760\" " + FOLD + "/>";
                yield new Shape(body, "", inside, over);
            }
            case FROCK -> {
                String body = "M244 170 C262 196 338 196 356 170 L374 172 L382 320 L398 340 C440 460 480 600 500 720 "
                        + "L100 720 C120 600 160 460 202 340 L218 320 L226 172 Z";
                String over = "<path d=\"M244 170 C262 196 338 196 356 170\" fill=\"none\" stroke=\"LINE\" stroke-width=\"5\" opacity=\".6\"/>"
                        + "<path d=\"M218 330 L382 330\" stroke=\"ACCENT\" stroke-width=\"14\"/>"
                        + "<path d=\"M300 330 L256 300 L258 362 Z M300 330 L344 300 L342 362 Z\" fill=\"ACCENT\"/>"
                        + "<circle cx=\"300\" cy=\"330\" r=\"10\" fill=\"ACCENT\"/>"
                        + "<path d=\"M108 690 L492 690\" " + STITCH + "/>";
                String inside = "<path d=\"M250 400 L210 710 M300 400 L300 712 M350 400 L390 710\" " + FOLD + "/>";
                yield new Shape(body, "", inside, over);
            }
        };
    }

    private static String embroidery(Garment garment, String hex) {
        String thread = luminance(hex) < 0.35 ? "#D8B969" : darken(hex, .45);
        StringBuilder s = new StringBuilder("<g fill=\"" + thread + "\" opacity=\".9\">");
        if (garment == Garment.PANJABI || garment == Garment.KIDS_PANJABI) {
            for (int y = 150; y <= 390; y += 14) {
                s.append(dot(280, y, 2.6)).append(dot(320, y, 2.6));
                if (y % 28 == 10) {
                    s.append(dot(272, y + 7, 1.8)).append(dot(328, y + 7, 1.8));
                }
            }
            for (int x = 244; x <= 356; x += 12) {
                double y = 116 + Math.pow((x - 300) / 56.0, 2) * -4 + 6;
                s.append(dot(x, y, 2.2));
            }
        } else {
            for (int x = 250; x <= 350; x += 10) {
                double t = (x - 300) / 50.0;
                s.append(dot(x, 152 - t * t * 26 + 14, 2.4));
            }
            for (int y = 170; y < 300; y += 12) {
                s.append(dot(300, y, 2.4));
            }
        }
        return s.append("</g>").toString();
    }

    private static String pattern(Fabric fabric, String hex, String id) {
        String accent = accent(hex);
        String open = "<pattern id=\"" + id + "p\" patternUnits=\"userSpaceOnUse\" ";
        return switch (fabric) {
            case PLAIN, EMBROIDERED -> "";
            case CHECK -> open + "width=\"44\" height=\"44\"><rect width=\"44\" height=\"44\" fill=\"" + hex + "\"/>"
                    + "<rect width=\"44\" height=\"14\" fill=\"" + accent + "\" opacity=\".45\"/>"
                    + "<rect width=\"14\" height=\"44\" fill=\"" + accent + "\" opacity=\".45\"/>"
                    + "<rect x=\"28\" width=\"2\" height=\"44\" fill=\"" + accent + "\" opacity=\".6\"/></pattern>";
            case STRIPE -> open + "width=\"16\" height=\"16\"><rect width=\"16\" height=\"16\" fill=\"" + hex + "\"/>"
                    + "<rect width=\"4\" height=\"16\" fill=\"" + accent + "\" opacity=\".75\"/></pattern>";
            case PRINT -> open + "width=\"56\" height=\"56\"><rect width=\"56\" height=\"56\" fill=\"" + hex + "\"/>"
                    + motif(14, 14, 7, accent) + motif(42, 42, 7, accent)
                    + "<circle cx=\"42\" cy=\"14\" r=\"2\" fill=\"" + accent + "\"/><circle cx=\"14\" cy=\"42\" r=\"2\" fill=\"" + accent + "\"/></pattern>";
            case FLORAL -> open + "width=\"110\" height=\"110\"><rect width=\"110\" height=\"110\" fill=\"" + hex + "\"/>"
                    + motif(30, 30, 13, accent) + motif(85, 82, 10, mix(accent, "#7B8F5A", .5))
                    + "<path d=\"M44 44 q14 10 26 4 M72 72 q-4 -12 4 -22\" stroke=\"" + mix(accent, "#5F7A48", .6) + "\" stroke-width=\"3\" fill=\"none\"/>"
                    + "<circle cx=\"82\" cy=\"24\" r=\"3\" fill=\"" + accent + "\"/></pattern>";
        };
    }

    private static String motif(double cx, double cy, double r, String color) {
        StringBuilder s = new StringBuilder("<g fill=\"" + color + "\">");
        for (int i = 0; i < 5; i++) {
            double a = Math.toRadians(i * 72 - 90);
            s.append(dot(cx + Math.cos(a) * r * .9, cy + Math.sin(a) * r * .9, r * .55));
        }
        return s.append("<circle cx=\"").append(fmt(cx)).append("\" cy=\"").append(fmt(cy))
                .append("\" r=\"").append(fmt(r * .38)).append("\" fill=\"#fff\" opacity=\".5\"/></g>").toString();
    }

    private static String buttons(int x, int firstY, int gap, int count, double r, String fill) {
        StringBuilder s = new StringBuilder();
        for (int i = 0; i < count; i++) {
            s.append("<circle cx=\"").append(x).append("\" cy=\"").append(firstY + i * gap).append("\" r=\"").append(fmt(r))
                    .append("\" fill=\"").append(fill).append("\" stroke=\"#000\" stroke-opacity=\".25\"/>");
        }
        return s.toString();
    }

    private static String ribs(int x1, int y1, int x2, int y2, int gap) {
        StringBuilder d = new StringBuilder();
        for (int x = x1; x <= x2; x += gap) {
            d.append("M").append(x).append(" ").append(y1 + 2).append(" L").append(x).append(" ").append(y2 - 2).append(" ");
        }
        return "<path d=\"" + d + "\" stroke=\"#000\" stroke-width=\"1.5\" opacity=\".12\"/>";
    }

    private static String gathers(int x1, int y, int x2, int gap) {
        StringBuilder d = new StringBuilder();
        for (int x = x1; x <= x2; x += gap) {
            d.append("M").append(x).append(" ").append(y + 4).append(" L").append(x + (x - 300) / 20).append(" ").append(y + 40).append(" ");
        }
        return "<path d=\"" + d + "\" stroke=\"#000\" stroke-width=\"2\" opacity=\".10\"/>";
    }

    private static String dot(double x, double y, double r) {
        return "<circle cx=\"" + fmt(x) + "\" cy=\"" + fmt(y) + "\" r=\"" + fmt(r) + "\"/>";
    }

    private static String stop(double offset, String color, double opacity) {
        return "<stop offset=\"" + fmt(offset) + "\" stop-color=\"" + color + "\" stop-opacity=\"" + fmt(opacity) + "\"/>";
    }

    private static String fmt(double v) {
        return String.format(Locale.ROOT, "%.1f", v).replace(".0", "");
    }

    // ---------------------------------------------------------------- colour helpers

    /** A colour that reads well on top of {@code hex}: cream on dark cloth, deep tone on light cloth. */
    static String accent(String hex) {
        double lum = luminance(hex);
        if (lum < 0.45) {
            return mix("#EFE3C8", hex, .12);
        }
        return darken(hex, .5);
    }

    static double luminance(String hex) {
        int[] c = rgb(hex);
        return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255.0;
    }

    static String darken(String hex, double amount) {
        return amount < 0 ? lighten(hex, -amount) : mix(hex, "#000000", amount);
    }

    static String lighten(String hex, double amount) {
        return mix(hex, "#FFFFFF", amount);
    }

    static String mix(String a, String b, double t) {
        int[] x = rgb(a);
        int[] y = rgb(b);
        return String.format("#%02X%02X%02X",
                Math.round(x[0] + (y[0] - x[0]) * t),
                Math.round(x[1] + (y[1] - x[1]) * t),
                Math.round(x[2] + (y[2] - x[2]) * t));
    }

    private static int[] rgb(String hex) {
        Matcher m = Pattern.compile("#?([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})").matcher(hex);
        if (!m.matches()) {
            throw new IllegalArgumentException(hex);
        }
        return new int[] {Integer.parseInt(m.group(1), 16), Integer.parseInt(m.group(2), 16), Integer.parseInt(m.group(3), 16)};
    }
}
