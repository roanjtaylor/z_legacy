package com.craft.ui;

import com.craft.core.Input;
import com.craft.game.GameMode;
import com.craft.render.BitmapFont;
import com.craft.render.HudRenderer;
import com.craft.save.WorldStore;

import java.util.ArrayList;
import java.util.List;

import static org.lwjgl.glfw.GLFW.*;

/**
 * The screens outside play: world list, world creation, and the pause menu.
 *
 * <p>Layout is computed once per frame into a list of rectangles that both drawing and hit
 * testing read, so a button can never be drawn somewhere other than where it can be clicked.
 */
public class Menu {

    public enum Page { MAIN, CREATE, PAUSED }

    public enum Action { NONE, PLAY_SELECTED, CREATE_WORLD, DELETE_SELECTED, QUIT, RESUME,
        SAVE_AND_EXIT }

    private static final float ROW_HEIGHT = 46f;
    private static final float BUTTON_HEIGHT = 40f;
    private static final float PANEL_WIDTH = 460f;
    private static final int VISIBLE_ROWS = 5;

    private static final class Widget {
        final float x;
        final float y;
        final float width;
        final float height;
        final String label;
        final String detail;
        final int id;

        Widget(float x, float y, float width, float height, String label, String detail, int id) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.label = label;
            this.detail = detail;
            this.id = id;
        }

        boolean contains(float px, float py) {
            return px >= x && px < x + width && py >= y && py < y + height;
        }
    }

    // Widget ids. Non-negative ids below WORLD_ROW_BASE are fixed buttons.
    private static final int ID_CREATE = 1;
    private static final int ID_QUIT = 2;
    private static final int ID_NAME_FIELD = 3;
    private static final int ID_SEED_FIELD = 4;
    private static final int ID_MODE_TOGGLE = 5;
    private static final int ID_CONFIRM_CREATE = 6;
    private static final int ID_BACK = 7;
    private static final int ID_RESUME = 8;
    private static final int ID_SAVE_EXIT = 9;
    private static final int ID_SCROLL_UP = 10;
    private static final int ID_SCROLL_DOWN = 11;
    private static final int WORLD_ROW_BASE = 100;
    private static final int DELETE_ROW_BASE = 200;

    private final List<Widget> widgets = new ArrayList<>();

    private Page page = Page.MAIN;
    private List<WorldStore.Summary> worlds = new ArrayList<>();
    private int scroll;
    private int selectedWorld = -1;

    private String nameField = "New World";
    private String seedField = "";
    private GameMode createMode = GameMode.SURVIVAL;
    private int focusedField = ID_NAME_FIELD;

    private String status = "";

    public Menu() {
        refresh();
    }

    public void refresh() {
        worlds = WorldStore.list();
        scroll = 0;
        selectedWorld = -1;
    }

    public Page getPage() {
        return page;
    }

    public void setPage(Page page) {
        this.page = page;
        this.status = "";
        if (page == Page.MAIN) {
            refresh();
        }
    }

    public WorldStore.Summary getSelectedWorld() {
        return selectedWorld >= 0 && selectedWorld < worlds.size()
                ? worlds.get(selectedWorld) : null;
    }

    public String getNameField() {
        return nameField;
    }

    public String getSeedField() {
        return seedField;
    }

    public GameMode getCreateMode() {
        return createMode;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    // ------------------------------------------------------------------------- layout

    private void layout(int width, int height) {
        widgets.clear();
        float centreX = width / 2f;
        float left = centreX - PANEL_WIDTH / 2f;

        switch (page) {
            case MAIN: layoutMain(left, height); break;
            case CREATE: layoutCreate(left, height); break;
            default: layoutPaused(left, height); break;
        }
    }

    private void layoutMain(float left, int height) {
        float y = 150f;
        int shown = Math.min(VISIBLE_ROWS, Math.max(0, worlds.size() - scroll));

        for (int i = 0; i < shown; i++) {
            int index = scroll + i;
            WorldStore.Summary world = worlds.get(index);
            widgets.add(new Widget(left, y, PANEL_WIDTH - 54, ROW_HEIGHT, world.name,
                    world.mode.displayName + "   seed " + world.seed,
                    WORLD_ROW_BASE + index));
            widgets.add(new Widget(left + PANEL_WIDTH - 46, y, 46, ROW_HEIGHT, "X", "",
                    DELETE_ROW_BASE + index));
            y += ROW_HEIGHT + 6;
        }

        if (worlds.size() > VISIBLE_ROWS) {
            widgets.add(new Widget(left + PANEL_WIDTH + 10, 150f, 34, 34, "^", "", ID_SCROLL_UP));
            widgets.add(new Widget(left + PANEL_WIDTH + 10, 190f, 34, 34, "v", "",
                    ID_SCROLL_DOWN));
        }

        y = Math.max(y, 150f + VISIBLE_ROWS * (ROW_HEIGHT + 6)) + 16;
        widgets.add(new Widget(left, y, PANEL_WIDTH, BUTTON_HEIGHT, "Create New World", "",
                ID_CREATE));
        widgets.add(new Widget(left, y + BUTTON_HEIGHT + 8, PANEL_WIDTH, BUTTON_HEIGHT, "Quit", "",
                ID_QUIT));
    }

    private void layoutCreate(float left, int height) {
        float y = 190f;
        widgets.add(new Widget(left, y, PANEL_WIDTH, BUTTON_HEIGHT, "Name", nameField,
                ID_NAME_FIELD));
        y += BUTTON_HEIGHT + 14;
        widgets.add(new Widget(left, y, PANEL_WIDTH, BUTTON_HEIGHT, "Seed",
                seedField.isEmpty() ? "(random)" : seedField, ID_SEED_FIELD));
        y += BUTTON_HEIGHT + 14;
        widgets.add(new Widget(left, y, PANEL_WIDTH, BUTTON_HEIGHT, "Mode",
                createMode.displayName, ID_MODE_TOGGLE));
        y += BUTTON_HEIGHT + 26;
        widgets.add(new Widget(left, y, PANEL_WIDTH, BUTTON_HEIGHT, "Create World", "",
                ID_CONFIRM_CREATE));
        widgets.add(new Widget(left, y + BUTTON_HEIGHT + 8, PANEL_WIDTH, BUTTON_HEIGHT, "Back", "",
                ID_BACK));
    }

    private void layoutPaused(float left, int height) {
        float y = height / 2f - 50f;
        widgets.add(new Widget(left, y, PANEL_WIDTH, BUTTON_HEIGHT, "Back to Game", "",
                ID_RESUME));
        widgets.add(new Widget(left, y + BUTTON_HEIGHT + 10, PANEL_WIDTH, BUTTON_HEIGHT,
                "Save and Exit to Menu", "", ID_SAVE_EXIT));
    }

    // -------------------------------------------------------------------------- input

    public Action update(Input input, int width, int height) {
        layout(width, height);

        if (page == Page.CREATE) {
            handleTyping(input);
        }
        if (page == Page.PAUSED && input.isKeyPressed(GLFW_KEY_ESCAPE)) {
            return Action.RESUME;
        }
        if (page == Page.CREATE && input.isKeyPressed(GLFW_KEY_ESCAPE)) {
            setPage(Page.MAIN);
            return Action.NONE;
        }
        if (page == Page.MAIN && worlds.size() > VISIBLE_ROWS) {
            float scrollDelta = input.getScrollDelta();
            if (scrollDelta != 0) {
                scroll = clamp(scroll - (int) Math.signum(scrollDelta),
                        0, worlds.size() - VISIBLE_ROWS);
            }
        }

        if (!input.isButtonPressed(GLFW_MOUSE_BUTTON_LEFT)) {
            return Action.NONE;
        }

        for (Widget widget : widgets) {
            if (!widget.contains(input.getMouseX(), input.getMouseY())) {
                continue;
            }
            return activate(widget);
        }
        return Action.NONE;
    }

    private Action activate(Widget widget) {
        if (widget.id >= DELETE_ROW_BASE) {
            selectedWorld = widget.id - DELETE_ROW_BASE;
            return Action.DELETE_SELECTED;
        }
        if (widget.id >= WORLD_ROW_BASE) {
            selectedWorld = widget.id - WORLD_ROW_BASE;
            return Action.PLAY_SELECTED;
        }

        switch (widget.id) {
            case ID_CREATE:
                nameField = WorldStore.uniqueName("New World");
                seedField = "";
                setPage(Page.CREATE);
                return Action.NONE;
            case ID_QUIT:
                return Action.QUIT;
            case ID_NAME_FIELD:
            case ID_SEED_FIELD:
                focusedField = widget.id;
                return Action.NONE;
            case ID_MODE_TOGGLE:
                createMode = createMode.other();
                return Action.NONE;
            case ID_CONFIRM_CREATE:
                if (nameField.trim().isEmpty()) {
                    status = "Give the world a name first.";
                    return Action.NONE;
                }
                return Action.CREATE_WORLD;
            case ID_BACK:
                setPage(Page.MAIN);
                return Action.NONE;
            case ID_RESUME:
                return Action.RESUME;
            case ID_SAVE_EXIT:
                return Action.SAVE_AND_EXIT;
            case ID_SCROLL_UP:
                scroll = Math.max(0, scroll - 1);
                return Action.NONE;
            case ID_SCROLL_DOWN:
                scroll = Math.min(Math.max(0, worlds.size() - VISIBLE_ROWS), scroll + 1);
                return Action.NONE;
            default:
                return Action.NONE;
        }
    }

    private void handleTyping(Input input) {
        if (input.isKeyPressed(GLFW_KEY_TAB)) {
            focusedField = focusedField == ID_NAME_FIELD ? ID_SEED_FIELD : ID_NAME_FIELD;
        }

        boolean nameFocused = focusedField == ID_NAME_FIELD;
        String current = nameFocused ? nameField : seedField;

        if (input.isKeyRepeated(GLFW_KEY_BACKSPACE) && !current.isEmpty()) {
            current = current.substring(0, current.length() - 1);
        }
        String typed = input.getTypedCharacters();
        if (!typed.isEmpty() && current.length() < 32) {
            current += typed;
            if (current.length() > 32) {
                current = current.substring(0, 32);
            }
        }

        if (nameFocused) {
            nameField = current;
        } else {
            seedField = current;
        }
    }

    // ------------------------------------------------------------------------- render

    public void render(HudRenderer hud, BitmapFont font, int width, int height, float mouseX,
                       float mouseY) {
        layout(width, height);
        hud.rect(0, 0, width, height, 0.05f, 0.06f, 0.09f, page == Page.PAUSED ? 0.75f : 1f);

        float centreX = width / 2f;
        if (page == Page.MAIN) {
            font.drawCentred(hud, "CRAFT", centreX, 56, 52, 1f, 1f, 1f, 1f);
            font.drawCentred(hud, "a small Minecraft", centreX, 110, 18, 0.7f, 0.75f, 0.8f, 1f);
            if (worlds.isEmpty()) {
                font.drawCentred(hud, "No worlds yet - create one below", centreX, 190, 18,
                        0.65f, 0.68f, 0.72f, 1f);
            }
        } else if (page == Page.CREATE) {
            font.drawCentred(hud, "Create a World", centreX, 100, 34, 1f, 1f, 1f, 1f);
            font.drawCentred(hud, "Tab switches field. A blank seed is random.",
                    centreX, 148, 16, 0.65f, 0.68f, 0.72f, 1f);
        } else {
            font.drawCentred(hud, "Paused", centreX, height / 2f - 110f, 40, 1f, 1f, 1f, 1f);
        }

        for (Widget widget : widgets) {
            boolean hovered = widget.contains(mouseX, mouseY);
            boolean focused = page == Page.CREATE && widget.id == focusedField;
            boolean danger = widget.id >= DELETE_ROW_BASE;

            float shade = hovered ? 0.30f : 0.18f;
            hud.rect(widget.x, widget.y, widget.width, widget.height,
                    danger ? shade + 0.16f : shade, shade, shade + 0.04f, 0.95f);
            hud.outline(widget.x, widget.y, widget.width, widget.height, focused ? 2f : 1f,
                    focused ? 0.95f : 0.45f, focused ? 0.85f : 0.45f, 0.45f, 0.9f);

            float textY = widget.y + widget.height / 2f - 9f;
            if (widget.detail.isEmpty()) {
                font.drawCentred(hud, widget.label, widget.x + widget.width / 2f, textY, 18,
                        1f, 1f, 1f, 1f);
            } else {
                font.drawShadowed(hud, widget.label, widget.x + 14, textY, 18, 1f, 1f, 1f, 1f);
                font.drawShadowed(hud, widget.detail,
                        widget.x + widget.width - 14 - font.width(widget.detail, 15), textY + 2,
                        15, 0.72f, 0.76f, 0.8f, 1f);
            }
        }

        if (!status.isEmpty()) {
            font.drawCentred(hud, status, centreX, height - 46f, 16, 1f, 0.7f, 0.4f, 1f);
        }
    }

    private static int clamp(int value, int min, int max) {
        return value < min ? min : Math.min(value, max);
    }
}
