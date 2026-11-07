package com.craft.save;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * A very small JSON reader and writer, enough for {@code level.json}.
 *
 * <p>The project has no third-party dependencies beyond LWJGL and JOML, and save files are
 * deliberately plain text so a world can be inspected — or hand-edited — with nothing but a
 * text editor. Numbers all come back as {@code double}; there is no schema and no streaming.
 */
public final class Json {

    private Json() {
    }

    // ------------------------------------------------------------------------- writing

    /** Builds an object literal, preserving insertion order so files read sensibly. */
    public static class Writer {
        private final Map<String, Object> values = new LinkedHashMap<>();

        public Writer put(String key, Object value) {
            values.put(key, value);
            return this;
        }

        public Map<String, Object> map() {
            return values;
        }

        @Override
        public String toString() {
            return write(values, 0);
        }
    }

    public static String write(Object value, int indent) {
        StringBuilder out = new StringBuilder();
        writeValue(out, value, indent);
        return out.toString();
    }

    @SuppressWarnings("unchecked")
    private static void writeValue(StringBuilder out, Object value, int indent) {
        if (value == null) {
            out.append("null");
        } else if (value instanceof Map) {
            writeObject(out, (Map<String, Object>) value, indent);
        } else if (value instanceof List) {
            writeArray(out, (List<Object>) value, indent);
        } else if (value instanceof Json.Writer) {
            writeObject(out, ((Writer) value).map(), indent);
        } else if (value instanceof String) {
            writeString(out, (String) value);
        } else if (value instanceof Boolean) {
            out.append(value);
        } else if (value instanceof Number) {
            writeNumber(out, ((Number) value).doubleValue());
        } else {
            writeString(out, value.toString());
        }
    }

    private static void writeNumber(StringBuilder out, double number) {
        // Whole numbers as integers: "seed": 12345 rather than "seed": 12345.0.
        if (number == Math.rint(number) && !Double.isInfinite(number)
                && Math.abs(number) < 1e15) {
            out.append((long) number);
        } else {
            out.append((float) number);
        }
    }

    private static void writeObject(StringBuilder out, Map<String, Object> map, int indent) {
        if (map.isEmpty()) {
            out.append("{}");
            return;
        }
        out.append("{\n");
        int i = 0;
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            indent(out, indent + 1);
            writeString(out, entry.getKey());
            out.append(": ");
            writeValue(out, entry.getValue(), indent + 1);
            if (++i < map.size()) {
                out.append(',');
            }
            out.append('\n');
        }
        indent(out, indent);
        out.append('}');
    }

    private static void writeArray(StringBuilder out, List<Object> list, int indent) {
        if (list.isEmpty()) {
            out.append("[]");
            return;
        }
        // Arrays of scalars stay on one line; arrays of objects get a line each.
        boolean nested = list.get(0) instanceof Map || list.get(0) instanceof Writer
                || list.get(0) instanceof List;
        out.append('[');
        for (int i = 0; i < list.size(); i++) {
            if (nested) {
                out.append('\n');
                indent(out, indent + 1);
            } else if (i > 0) {
                out.append(' ');
            }
            writeValue(out, list.get(i), indent + 1);
            if (i < list.size() - 1) {
                out.append(',');
            }
        }
        if (nested) {
            out.append('\n');
            indent(out, indent);
        }
        out.append(']');
    }

    private static void writeString(StringBuilder out, String text) {
        out.append('"');
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            switch (c) {
                case '"': out.append("\\\""); break;
                case '\\': out.append("\\\\"); break;
                case '\n': out.append("\\n"); break;
                case '\r': out.append("\\r"); break;
                case '\t': out.append("\\t"); break;
                default:
                    if (c < 0x20) {
                        out.append(String.format("\\u%04x", (int) c));
                    } else {
                        out.append(c);
                    }
            }
        }
        out.append('"');
    }

    private static void indent(StringBuilder out, int depth) {
        for (int i = 0; i < depth; i++) {
            out.append("  ");
        }
    }

    // ------------------------------------------------------------------------- reading

    public static Object parse(String text) {
        Parser parser = new Parser(text);
        parser.skipWhitespace();
        Object value = parser.readValue();
        parser.skipWhitespace();
        if (!parser.atEnd()) {
            throw new IllegalArgumentException("Trailing content at index " + parser.index);
        }
        return value;
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> parseObject(String text) {
        Object value = parse(text);
        if (!(value instanceof Map)) {
            throw new IllegalArgumentException("Expected a JSON object at the top level");
        }
        return (Map<String, Object>) value;
    }

    private static final class Parser {
        private final String text;
        private int index;

        Parser(String text) {
            this.text = text;
        }

        boolean atEnd() {
            return index >= text.length();
        }

        void skipWhitespace() {
            while (index < text.length() && Character.isWhitespace(text.charAt(index))) {
                index++;
            }
        }

        Object readValue() {
            skipWhitespace();
            if (atEnd()) {
                throw new IllegalArgumentException("Unexpected end of JSON");
            }
            char c = text.charAt(index);
            switch (c) {
                case '{': return readObject();
                case '[': return readArray();
                case '"': return readString();
                case 't': expect("true"); return Boolean.TRUE;
                case 'f': expect("false"); return Boolean.FALSE;
                case 'n': expect("null"); return null;
                default: return readNumber();
            }
        }

        Map<String, Object> readObject() {
            Map<String, Object> map = new LinkedHashMap<>();
            index++;
            skipWhitespace();
            if (peek() == '}') {
                index++;
                return map;
            }
            while (true) {
                skipWhitespace();
                String key = readString();
                skipWhitespace();
                if (peek() != ':') {
                    throw new IllegalArgumentException("Expected ':' at index " + index);
                }
                index++;
                map.put(key, readValue());
                skipWhitespace();
                char c = peek();
                index++;
                if (c == '}') {
                    return map;
                }
                if (c != ',') {
                    throw new IllegalArgumentException("Expected ',' or '}' at index " + index);
                }
            }
        }

        List<Object> readArray() {
            List<Object> list = new ArrayList<>();
            index++;
            skipWhitespace();
            if (peek() == ']') {
                index++;
                return list;
            }
            while (true) {
                list.add(readValue());
                skipWhitespace();
                char c = peek();
                index++;
                if (c == ']') {
                    return list;
                }
                if (c != ',') {
                    throw new IllegalArgumentException("Expected ',' or ']' at index " + index);
                }
            }
        }

        String readString() {
            if (peek() != '"') {
                throw new IllegalArgumentException("Expected a string at index " + index);
            }
            index++;
            StringBuilder out = new StringBuilder();
            while (true) {
                char c = text.charAt(index++);
                if (c == '"') {
                    return out.toString();
                }
                if (c != '\\') {
                    out.append(c);
                    continue;
                }
                char escape = text.charAt(index++);
                switch (escape) {
                    case 'n': out.append('\n'); break;
                    case 'r': out.append('\r'); break;
                    case 't': out.append('\t'); break;
                    case 'b': out.append('\b'); break;
                    case 'f': out.append('\f'); break;
                    case 'u':
                        out.append((char) Integer.parseInt(text.substring(index, index + 4), 16));
                        index += 4;
                        break;
                    default: out.append(escape);
                }
            }
        }

        Double readNumber() {
            int start = index;
            while (index < text.length() && "+-.eE0123456789".indexOf(text.charAt(index)) >= 0) {
                index++;
            }
            return Double.parseDouble(text.substring(start, index));
        }

        char peek() {
            if (atEnd()) {
                throw new IllegalArgumentException("Unexpected end of JSON");
            }
            return text.charAt(index);
        }

        void expect(String literal) {
            if (!text.startsWith(literal, index)) {
                throw new IllegalArgumentException("Expected '" + literal + "' at index " + index);
            }
            index += literal.length();
        }
    }

    // ------------------------------------------------------------------------ accessors

    public static double number(Map<String, Object> map, String key, double fallback) {
        Object value = map.get(key);
        return value instanceof Number ? ((Number) value).doubleValue() : fallback;
    }

    public static int integer(Map<String, Object> map, String key, int fallback) {
        return (int) number(map, key, fallback);
    }

    public static long longValue(Map<String, Object> map, String key, long fallback) {
        return (long) number(map, key, fallback);
    }

    public static float floatValue(Map<String, Object> map, String key, float fallback) {
        return (float) number(map, key, fallback);
    }

    public static String string(Map<String, Object> map, String key, String fallback) {
        Object value = map.get(key);
        return value instanceof String ? (String) value : fallback;
    }

    public static boolean bool(Map<String, Object> map, String key, boolean fallback) {
        Object value = map.get(key);
        return value instanceof Boolean ? (Boolean) value : fallback;
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> object(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value instanceof Map ? (Map<String, Object>) value : new LinkedHashMap<>();
    }

    @SuppressWarnings("unchecked")
    public static List<Object> array(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value instanceof List ? (List<Object>) value : new ArrayList<>();
    }
}
