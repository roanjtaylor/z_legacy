package com.craft;

import com.craft.audio.AudioEngine;
import com.craft.audio.Sfx;
import com.craft.core.Input;
import com.craft.core.Timer;
import com.craft.core.Window;
import com.craft.entity.Player;
import com.craft.entity.Raycast;
import com.craft.game.GameMode;
import com.craft.game.Interaction;
import com.craft.game.Inventory;
import com.craft.game.Survival;
import com.craft.mesh.BlockLayers;
import com.craft.render.BitmapFont;
import com.craft.render.BlockOutline;
import com.craft.render.Camera;
import com.craft.render.ChunkRenderer;
import com.craft.render.HudRenderer;
import com.craft.render.Screenshot;
import com.craft.render.Shader;
import com.craft.render.SkyRenderer;
import com.craft.render.TextureArray;
import com.craft.save.WorldStore;
import com.craft.ui.Menu;
import com.craft.world.BlockType;
import com.craft.world.Blocks;
import com.craft.world.Chunk;
import com.craft.world.Direction;
import com.craft.world.Sky;
import com.craft.world.World;
import com.craft.world.WorldGen;
import org.joml.Matrix4f;
import org.joml.Vector3f;

import java.nio.file.Path;
import java.util.List;

import static org.lwjgl.glfw.GLFW.*;
import static org.lwjgl.opengl.GL33.*;

/** Owns the window, the menus, the world and the frame loop. */
public class Game {

    private static final float MOUSE_SENSITIVITY = 0.12f;
    private static final float DOUBLE_TAP_WINDOW = 0.3f;
    private static final float AUTOSAVE_INTERVAL = 30f;

    private final Options options;

    // ------------------------------------------------------------------ persistent state
    private Window window;
    private Input input;
    private Timer timer;
    private Camera camera;

    private Shader chunkShader;
    private TextureArray textures;
    private BitmapFont font;
    private BlockLayers blockLayers;
    private SkyRenderer skyRenderer;
    private HudRenderer hud;
    private BlockOutline blockOutline;
    private Menu menu;
    private AudioEngine audio;
    private Sfx sfx;

    /** Blocks walked since the last footstep, and the state needed to spot new events. */
    private float stepDistance;
    private int previousHealth = Survival.MAX_HEALTH;
    private boolean wasInWater;

    // ----------------------------------------------------------------- per-world state
    private ChunkRenderer chunkRenderer;
    private World world;
    private Sky sky;
    private Player player;
    private WorldStore store;

    private GameMode mode = GameMode.SURVIVAL;
    private Inventory inventory;
    private Interaction interaction;
    private Survival survival;

    private boolean inWorld;
    private boolean paused;
    private boolean inventoryOpen;
    private boolean showDebug;
    private float autosaveTimer;

    private final Matrix4f projection = new Matrix4f();
    private final Matrix4f view = new Matrix4f();
    private final Vector3f fogColour = new Vector3f();
    private final Vector3f moveInput = new Vector3f();
    private final Vector3f scratch = new Vector3f();

    private float fogBrightness = 1f;
    private float lastSpaceTap = -1f;
    private float lastForwardTap = -1f;
    private float elapsed;
    private boolean sprinting;

    private int frame;
    private int settledFrame;
    private float titleTimer;

    /** Command line settings, parsed in {@link Main}. */
    public static class Options {
        public long seed = System.nanoTime();
        public int renderDistance = 8;
        public String screenshotPath;
        public float[] camera;
        public Float timeOfDay;
        public GameMode mode = GameMode.SURVIVAL;
        public String worldName;
        public boolean menuOnly;
        public boolean debugOverlay;
        /** Seconds after which to close cleanly, so automation exercises the real save path. */
        public float exitAfter;
    }

    public Game(Options options) {
        this.options = options;
        this.showDebug = options.debugOverlay;
    }

    public void run() {
        try {
            init();
            loop();
        } finally {
            if (inWorld) {
                saveWorld();
                // Clear the flag so the shutdown hook, which runs after this, does not save
                // a second time over the top of the save we just made.
                inWorld = false;
            }
            destroy();
        }
    }

    // ---------------------------------------------------------------------------- setup

    private void init() {
        window = new Window("Craft", 1280, 720);
        window.create();

        input = new Input();
        input.attach(window);
        timer = new Timer();
        camera = new Camera();

        chunkShader = Shader.load("chunk");
        font = new BitmapFont();
        textures = new TextureArray(Blocks.textureNames(), font.render());
        font.setBaseLayer(textures.getExtraBaseLayer());
        blockLayers = new BlockLayers(textures);
        skyRenderer = new SkyRenderer();
        hud = new HudRenderer();
        blockOutline = new BlockOutline();
        menu = new Menu();

        audio = new AudioEngine();
        audio.init();
        sfx = new Sfx(audio);
        sfx.build();

        glEnable(GL_DEPTH_TEST);
        glEnable(GL_CULL_FACE);
        glCullFace(GL_BACK);

        // A last-resort save if the process is killed rather than closed.
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            if (inWorld && store != null) {
                saveWorld();
            }
        }, "save-on-exit"));

        // Automated runs skip the menu. A named world wins over a throwaway one, so that
        // --world and --screenshot can be combined to photograph a specific save.
        if (options.menuOnly) {
            window.setCursorGrabbed(false);
        } else if (options.worldName != null) {
            WorldStore named = new WorldStore(options.worldName);
            startWorld(named, options.seed, options.mode,
                    named.exists() ? null : options.worldName);
            if (!named.exists()) {
                saveWorld();
            }
        } else if (options.screenshotPath != null) {
            startWorld(null, options.seed, options.mode, null);
        }
    }

    /**
     * Enters a world, either restored from disk or freshly generated.
     *
     * @param existing a store to load from, or null for a throwaway world with no save folder
     */
    private void startWorld(WorldStore existing, long seed, GameMode newMode, String displayName) {
        WorldStore.LevelState state;
        if (existing != null && existing.exists()) {
            store = existing;
            state = store.loadLevel();
        } else {
            store = existing;
            state = new WorldStore.LevelState();
            state.name = displayName != null ? displayName : "Test World";
            state.seed = seed;
            state.mode = newMode != null ? newMode : GameMode.SURVIVAL;
            state.renderDistance = options.renderDistance;
            if (state.mode == GameMode.SURVIVAL) {
                state.inventory.giveStartingKit();
            } else {
                fillCreativeHotbar(state.inventory);
            }
        }

        mode = state.mode;
        inventory = state.inventory;
        interaction = new Interaction();
        survival = new Survival();
        survival.setHealth(state.health);

        sky = new Sky();
        sky.setTimeOfDay(state.timeOfDay);
        if (options.timeOfDay != null) {
            sky.setTimeOfDay(options.timeOfDay);
            sky.setFrozen(true);
        }

        world = new World(state.seed);
        world.setRenderDistance(options.renderDistance > 0
                ? options.renderDistance : state.renderDistance);
        if (store != null) {
            // Edited chunks come back from disk; everything else is regenerated from the seed.
            world.setChunkLoader(store::loadChunk);
            world.setUnloadListener(store::saveChunk);
        }

        chunkRenderer = new ChunkRenderer(blockLayers);

        System.out.println("World '" + state.name + "', seed " + state.seed
                + ", " + mode.displayName);
        long start = System.currentTimeMillis();
        world.loadInitialArea(World.chunkOf((int) state.playerX),
                World.chunkOf((int) state.playerZ), 2);
        System.out.println("Spawn area ready in " + (System.currentTimeMillis() - start) + " ms");

        boolean restored = existing != null && existing.exists();
        if (restored) {
            player = new Player(state.playerX, state.playerY, state.playerZ);
            player.setFlying(state.flying && mode.canFly);
            camera.setRotation(state.yaw, state.pitch);
        } else {
            spawnPlayer();
        }
        if (options.camera != null) {
            player.setPosition(options.camera[0], options.camera[1], options.camera[2]);
            camera.setRotation(options.camera[3], options.camera[4]);
            player.setFlying(true);
        }
        player.eyePosition(camera.position);

        inWorld = true;
        paused = false;
        inventoryOpen = false;
        autosaveTimer = 0;
        fogBrightness = 1f;
        window.setCursorGrabbed(true);
        input.resetMouseDelta();
    }

    private void fillCreativeHotbar(Inventory target) {
        BlockType[] starters = {
                Blocks.GRASS, Blocks.STONE, Blocks.COBBLESTONE, Blocks.OAK_PLANKS,
                Blocks.OAK_LOG, Blocks.GLASS, Blocks.SAND, Blocks.STONE_BRICKS, Blocks.AMETHYST};
        for (int i = 0; i < starters.length; i++) {
            target.setSlot(i, starters[i], 1);
        }
    }

    /**
     * Puts the player on solid ground near the origin. The generator's height function ignores
     * trees and caves, so the real chunk data is scanned for a gap tall enough to stand in;
     * spawning inside a canopy is otherwise easy to do and very confusing.
     */
    private void spawnPlayer() {
        for (int radius = 0; radius <= 24; radius += 2) {
            for (int dx = -radius; dx <= radius; dx += 2) {
                for (int dz = -radius; dz <= radius; dz += 2) {
                    if (radius > 0 && Math.max(Math.abs(dx), Math.abs(dz)) != radius) {
                        continue;
                    }
                    float y = Player.findSpawnY(world, dx, dz);
                    if (y > WorldGen.SEA_LEVEL && !world.getBlock(dx, (int) y - 1, dz).liquid) {
                        player = new Player(dx + 0.5f, y, dz + 0.5f);
                        camera.setRotation(-45f, -8f);
                        System.out.println("Spawned at " + dx + ", " + (int) y + ", " + dz);
                        return;
                    }
                }
            }
        }
        player = new Player(0.5f, WorldGen.SEA_LEVEL + 2f, 0.5f);
        camera.setRotation(-45f, -8f);
    }

    private void saveWorld() {
        if (store == null || world == null) {
            return;
        }
        store.saveLevel(WorldStore.capture(store.getName(), world, sky, player, camera,
                mode, inventory, survival));
        int chunks = store.saveAllChunks(world);
        System.out.println("Saved '" + store.getName() + "' (" + chunks + " edited chunks)");
    }

    private void exitToMenu() {
        saveWorld();
        inWorld = false;
        paused = false;
        inventoryOpen = false;
        if (chunkRenderer != null) {
            chunkRenderer.destroy();
            chunkRenderer = null;
        }
        if (world != null) {
            world.shutdown();
            world = null;
        }
        store = null;
        window.setCursorGrabbed(false);
        menu.setPage(Menu.Page.MAIN);
    }

    // ----------------------------------------------------------------------------- loop

    private void loop() {
        while (!window.shouldClose()) {
            frame++;
            float delta = timer.tick();
            window.pollEvents();
            input.beginFrame();

            if (inWorld && !paused) {
                updateWorld(delta);
            } else {
                updateMenu();
            }
            render();

            if (options.exitAfter > 0 && elapsed >= options.exitAfter) {
                window.requestClose();
            }

            handleScreenshot();
            window.swapBuffers();
            input.endFrame();
        }
    }

    private void updateMenu() {
        elapsed += timer.getDelta();
        Menu.Action action = menu.update(input, window.getWidth(), window.getHeight());
        switch (action) {
            case PLAY_SELECTED: {
                WorldStore.Summary summary = menu.getSelectedWorld();
                if (summary != null) {
                    startWorld(new WorldStore(summary.folder), summary.seed, summary.mode, null);
                }
                break;
            }
            case CREATE_WORLD: {
                String name = WorldStore.uniqueName(menu.getNameField());
                long seed = parseSeed(menu.getSeedField());
                startWorld(new WorldStore(name), seed, menu.getCreateMode(), menu.getNameField());
                saveWorld();
                break;
            }
            case DELETE_SELECTED: {
                WorldStore.Summary summary = menu.getSelectedWorld();
                if (summary != null) {
                    WorldStore.delete(summary.folder);
                    menu.setStatus("Deleted " + summary.name);
                    menu.refresh();
                }
                break;
            }
            case QUIT:
                window.requestClose();
                break;
            case RESUME:
                paused = false;
                window.setCursorGrabbed(true);
                input.resetMouseDelta();
                break;
            case SAVE_AND_EXIT:
                exitToMenu();
                break;
            default:
                break;
        }
    }

    private static long parseSeed(String text) {
        String trimmed = text.trim();
        if (trimmed.isEmpty()) {
            return System.nanoTime();
        }
        try {
            return Long.parseLong(trimmed);
        } catch (NumberFormatException e) {
            return trimmed.hashCode();
        }
    }

    private void updateWorld(float delta) {
        elapsed += delta;
        handleWorldKeys();

        boolean playing = window.isCursorGrabbed() && !inventoryOpen && !paused;
        if (playing) {
            camera.addRotation(
                    input.getDeltaX() * MOUSE_SENSITIVITY,
                    input.getDeltaY() * MOUSE_SENSITIVITY);
            handleHotbarKeys();
        }

        updatePlayer(delta, playing);
        survival.update(world, player, mode, delta);

        if (playing && !survival.isDead()) {
            interaction.update(world, player, camera.getFront(), inventory, mode,
                    input.isButtonDown(GLFW_MOUSE_BUTTON_LEFT),
                    input.isButtonPressed(GLFW_MOUSE_BUTTON_RIGHT),
                    input.isButtonPressed(GLFW_MOUSE_BUTTON_MIDDLE),
                    delta);
        }
        if (survival.isDead() && input.isKeyPressed(GLFW_KEY_ENTER)) {
            survival.respawn();
            spawnPlayer();
            player.eyePosition(camera.position);
        }

        updateSounds(delta);

        sky.update(delta);
        world.update(player.position.x, player.position.z);
        chunkRenderer.update(world);
        updateFogBrightness(delta);
        updateTitle(delta);

        autosaveTimer += delta;
        if (autosaveTimer >= AUTOSAVE_INTERVAL) {
            autosaveTimer = 0;
            saveWorld();
        }
    }

    private void handleWorldKeys() {
        if (input.isKeyPressed(GLFW_KEY_ESCAPE)) {
            if (inventoryOpen) {
                inventoryOpen = false;
                window.setCursorGrabbed(true);
                input.resetMouseDelta();
            } else {
                paused = true;
                menu.setPage(Menu.Page.PAUSED);
                window.setCursorGrabbed(false);
            }
        }
        if (input.isKeyPressed(GLFW_KEY_E) && (window.isCursorGrabbed() || inventoryOpen)) {
            inventoryOpen = !inventoryOpen;
            window.setCursorGrabbed(!inventoryOpen);
            input.resetMouseDelta();
        }
        if (!window.isCursorGrabbed() && !inventoryOpen
                && input.isButtonPressed(GLFW_MOUSE_BUTTON_LEFT)) {
            window.setCursorGrabbed(true);
            input.resetMouseDelta();
        }
        if (input.isKeyPressed(GLFW_KEY_F3)) {
            showDebug = !showDebug;
        }
        if (input.isKeyPressed(GLFW_KEY_F4)) {
            mode = mode.other();
            if (!mode.canFly) {
                player.setFlying(false);
            }
            if (mode == GameMode.CREATIVE) {
                survival.respawn();
            }
        }
        if (inventoryOpen && input.isButtonPressed(GLFW_MOUSE_BUTTON_LEFT)) {
            clickInventory();
        }
    }

    private void handleHotbarKeys() {
        for (int i = 0; i < Inventory.HOTBAR_SIZE; i++) {
            if (input.isKeyPressed(GLFW_KEY_1 + i)) {
                inventory.setSelected(i);
            }
        }
        float scroll = input.getScrollDelta();
        if (scroll != 0) {
            inventory.scrollSelection((int) Math.signum(scroll));
        }
    }

    private void updatePlayer(float delta, boolean playing) {
        moveInput.zero();
        if (playing && !survival.isDead()) {
            Vector3f forward = camera.getWalkForward(scratch);
            if (input.isKeyDown(GLFW_KEY_W)) {
                moveInput.add(forward.x, 0, forward.z);
            }
            if (input.isKeyDown(GLFW_KEY_S)) {
                moveInput.sub(forward.x, 0, forward.z);
            }
            Vector3f right = camera.getRight();
            if (input.isKeyDown(GLFW_KEY_D)) {
                moveInput.add(right.x, 0, right.z);
            }
            if (input.isKeyDown(GLFW_KEY_A)) {
                moveInput.sub(right.x, 0, right.z);
            }
            if (moveInput.lengthSquared() > 1e-6f) {
                moveInput.normalize();
            }
            handleDoubleTaps();
        } else {
            sprinting = false;
        }

        if (!(playing && input.isKeyDown(GLFW_KEY_W))) {
            sprinting = false;
        }

        boolean jump = playing && !survival.isDead() && input.isKeyDown(GLFW_KEY_SPACE);
        boolean sneak = playing && input.isKeyDown(GLFW_KEY_LEFT_SHIFT);
        boolean sprint = sprinting || (playing && input.isKeyDown(GLFW_KEY_LEFT_CONTROL));

        player.update(world, delta, moveInput.x, moveInput.z, jump, sneak, sprint, sneak);
        player.eyePosition(camera.position);
    }

    /** Double-tap space to toggle flight and double-tap W to sprint, as in Minecraft. */
    private void handleDoubleTaps() {
        if (input.isKeyPressed(GLFW_KEY_SPACE)) {
            if (elapsed - lastSpaceTap < DOUBLE_TAP_WINDOW) {
                if (mode.canFly) {
                    player.setFlying(!player.isFlying());
                }
                lastSpaceTap = -1f;
            } else {
                lastSpaceTap = elapsed;
            }
        }
        if (input.isKeyPressed(GLFW_KEY_W)) {
            if (elapsed - lastForwardTap < DOUBLE_TAP_WINDOW) {
                sprinting = true;
            }
            lastForwardTap = elapsed;
        }
    }

    /** Turns this frame's changes into sound: steps, breaks, placements, hits, splashes. */
    private void updateSounds(float delta) {
        if (interaction.getLastBroken() != null) {
            sfx.blockBroken(interaction.getLastBroken());
        }
        if (interaction.getLastPlaced() != null) {
            sfx.blockPlaced(interaction.getLastPlaced());
        }

        if (survival.getHealth() < previousHealth) {
            sfx.hurt();
        }
        previousHealth = survival.getHealth();

        if (player.isInWater() && !wasInWater) {
            sfx.splashSound();
        }
        wasInWater = player.isInWater();

        // Footsteps are paced by distance rather than time, so they keep step with the player
        // whether walking, sprinting or sneaking.
        if (player.isOnGround() && !player.isFlying()) {
            stepDistance += player.horizontalSpeed() * delta;
            if (stepDistance >= 2.1f) {
                stepDistance = 0;
                BlockType below = world.getBlock(
                        (int) Math.floor(player.position.x),
                        (int) Math.floor(player.position.y - 0.1f),
                        (int) Math.floor(player.position.z));
                if (!below.isAir()) {
                    sfx.footstep(below);
                }
            }
        } else {
            stepDistance = 0;
        }
    }

    private void updateFogBrightness(float delta) {
        int skyLight = world.getLightEngine().getSkyLight(
                (int) Math.floor(camera.position.x),
                (int) Math.floor(camera.position.y),
                (int) Math.floor(camera.position.z));

        float target = 0.03f + 0.97f * (skyLight / 15f);
        if (frame <= 1 || fogBrightness < 0) {
            fogBrightness = target;
        } else {
            fogBrightness += (target - fogBrightness) * Math.min(1f, delta * 3.5f);
        }
    }

    private void updateTitle(float delta) {
        titleTimer += delta;
        if (titleTimer < 0.5f) {
            return;
        }
        titleTimer = 0f;
        window.setTitle(String.format("Craft  |  %d fps  |  %.0f %.0f %.0f  |  %s  |  %s",
                timer.getFps(), player.position.x, player.position.y, player.position.z,
                mode.displayName, sky.clock()));
    }

    // --------------------------------------------------------------------------- render

    private void render() {
        glViewport(0, 0, window.getWidth(), window.getHeight());
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        if (inWorld) {
            renderWorld();
        }

        hud.begin(window.getWidth(), window.getHeight());
        if (inWorld && !paused) {
            drawGameHud();
        }
        if (!inWorld || paused) {
            menu.render(hud, font, window.getWidth(), window.getHeight(),
                    input.getMouseX(), input.getMouseY());
        }
        hud.end(textures);
    }

    private void renderWorld() {
        float fogEnd = world.getRenderDistance() * Chunk.SIZE_X * 0.92f;
        float fogStart = fogEnd * 0.55f;
        boolean underwater = player.isHeadUnderwater();
        camera.setFar(Math.max(96f, fogEnd) + 48f);
        if (underwater) {
            fogEnd = 22f;
            fogStart = 1f;
        }

        projection.set(camera.getProjectionMatrix(window.aspectRatio()));
        view.set(camera.getViewMatrix());

        skyRenderer.render(sky, projection, view);

        fogColour.set(sky.getFogColour()).mul(fogBrightness);
        if (underwater) {
            fogColour.set(0.10f, 0.26f, 0.44f).mul(Math.max(0.25f, sky.getSkyLightFactor()));
        }

        chunkShader.bind();
        textures.bind(0);
        chunkShader.setInt("uAtlas", 0);
        chunkShader.setMatrix4("uProjection", projection);
        chunkShader.setMatrix4("uView", view);
        chunkShader.setVector3("uFogColour", fogColour);
        chunkShader.setFloat("uFogStart", fogStart);
        chunkShader.setFloat("uFogEnd", fogEnd);
        chunkShader.setFloat("uAlphaCutoff", 0.25f);
        chunkShader.setFloat("uDaylight", sky.getSkyLightFactor());
        if (underwater) {
            chunkShader.setVector3("uTint", 0.55f, 0.75f, 1.0f);
        } else {
            chunkShader.setVector3("uTint", 1f, 1f, 1f);
        }

        chunkRenderer.render(chunkShader, camera, projection, view);
        Shader.unbind();

        Raycast.Hit target = interaction.getTarget();
        if (target != null && !inventoryOpen && !paused) {
            blockOutline.render(projection, view, target.x, target.y, target.z, 0.55f);
        }
    }

    // ------------------------------------------------------------------------------ hud

    private static final float SLOT_SIZE = 44f;
    private static final float SLOT_GAP = 2f;
    private static final int PALETTE_COLUMNS = 10;

    private void drawGameHud() {
        int width = window.getWidth();
        int height = window.getHeight();

        if (player.isHeadUnderwater()) {
            hud.rect(0, 0, width, height, 0.15f, 0.35f, 0.65f, 0.35f);
        }
        float flash = survival.getDamageFlash();
        if (flash > 0) {
            hud.rect(0, 0, width, height, 0.7f, 0.05f, 0.05f, 0.35f * flash);
        }

        if (!inventoryOpen && !survival.isDead()) {
            drawCrosshair(width, height);
        }
        drawHotbar(width, height);
        if (mode.takesDamage) {
            drawHealth(width, height);
        }
        if (inventoryOpen) {
            drawInventoryScreen(width, height);
        }
        if (survival.isDead()) {
            hud.rect(0, 0, width, height, 0.35f, 0f, 0f, 0.6f);
            font.drawCentred(hud, "You died", width / 2f, height / 2f - 40, 44, 1f, 1f, 1f, 1f);
            font.drawCentred(hud, "Press Enter to respawn", width / 2f, height / 2f + 16, 18,
                    0.9f, 0.9f, 0.9f, 1f);
        }
        if (showDebug) {
            drawDebugOverlay();
        }
    }

    private void drawCrosshair(int width, int height) {
        float cx = width / 2f;
        float cy = height / 2f;
        float arm = 9f;
        float thickness = 2f;
        hud.rect(cx - arm, cy - thickness / 2, arm * 2, thickness, 1f, 1f, 1f, 0.75f);
        hud.rect(cx - thickness / 2, cy - arm, thickness, arm * 2, 1f, 1f, 1f, 0.75f);

        float progress = interaction.getBreakProgress();
        if (progress > 0) {
            float barWidth = 60f;
            hud.rect(cx - barWidth / 2, cy + 20, barWidth, 5f, 0f, 0f, 0f, 0.5f);
            hud.rect(cx - barWidth / 2, cy + 20, barWidth * Math.min(1f, progress), 5f,
                    0.95f, 0.95f, 0.95f, 0.9f);
        }
    }

    private float hotbarLeft(int width) {
        return (width - (Inventory.HOTBAR_SIZE * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP)) / 2f;
    }

    private float hotbarTop(int height) {
        return height - SLOT_SIZE - 14f;
    }

    private void drawHotbar(int width, int height) {
        float left = hotbarLeft(width);
        float top = hotbarTop(height);

        for (int i = 0; i < Inventory.HOTBAR_SIZE; i++) {
            float x = left + i * (SLOT_SIZE + SLOT_GAP);
            drawSlot(x, top, inventory.slot(i), i == inventory.getSelected());
        }

        BlockType held = inventory.selectedBlock();
        if (held != null) {
            font.drawCentred(hud, held.displayName, width / 2f, top - (mode.takesDamage ? 46 : 24),
                    16, 1f, 1f, 1f, 0.9f);
        }
    }

    private void drawSlot(float x, float y, Inventory.Slot slot, boolean selected) {
        hud.rect(x, y, SLOT_SIZE, SLOT_SIZE, 0.08f, 0.08f, 0.10f, 0.62f);
        hud.outline(x, y, SLOT_SIZE, SLOT_SIZE, selected ? 3f : 1f,
                selected ? 1f : 0.6f, selected ? 1f : 0.6f, selected ? 1f : 0.6f,
                selected ? 0.95f : 0.35f);

        if (slot.isEmpty()) {
            return;
        }
        float inset = 7f;
        hud.icon(x + inset, y + inset, SLOT_SIZE - inset * 2,
                blockLayers.layer(slot.type.id, Direction.SOUTH), 1f);

        if (!mode.infiniteBlocks && slot.count > 1) {
            String count = String.valueOf(slot.count);
            font.drawShadowed(hud, count, x + SLOT_SIZE - font.width(count, 14) - 3,
                    y + SLOT_SIZE - 17, 14, 1f, 1f, 1f, 1f);
        }
    }

    private void drawHealth(int width, int height) {
        float left = hotbarLeft(width);
        float top = hotbarTop(height) - 22f;
        float pip = 14f;

        for (int i = 0; i < Survival.MAX_HEALTH / 2; i++) {
            float x = left + i * (pip + 2);
            int filled = survival.getHealth() - i * 2;
            hud.rect(x, top, pip, pip, 0.1f, 0.1f, 0.1f, 0.55f);
            if (filled >= 2) {
                hud.rect(x + 2, top + 2, pip - 4, pip - 4, 0.85f, 0.15f, 0.15f, 1f);
            } else if (filled == 1) {
                hud.rect(x + 2, top + 2, (pip - 4) / 2, pip - 4, 0.85f, 0.15f, 0.15f, 1f);
            }
        }

        if (survival.getAir() < Survival.MAX_AIR) {
            float airTop = top - 18f;
            for (int i = 0; i < survival.getAir(); i++) {
                hud.rect(left + i * (pip + 2) + 3, airTop + 3, pip - 6, pip - 6,
                        0.5f, 0.8f, 1f, 0.95f);
            }
        }
    }

    private void drawDebugOverlay() {
        String[] lines = {
                "Craft  " + timer.getFps() + " fps",
                String.format("xyz  %.2f  %.2f  %.2f", player.position.x, player.position.y,
                        player.position.z),
                String.format("block  %d %d %d", (int) Math.floor(player.position.x),
                        (int) Math.floor(player.position.y), (int) Math.floor(player.position.z)),
                "facing  " + camera.facing(),
                "biome  " + world.getGenerator().biomeAt((int) Math.floor(player.position.x),
                        (int) Math.floor(player.position.z)).displayName,
                "light  sky " + world.getLightEngine().getSkyLight(
                        (int) Math.floor(camera.position.x), (int) Math.floor(camera.position.y),
                        (int) Math.floor(camera.position.z))
                        + "  block " + world.getLightEngine().getBlockLight(
                        (int) Math.floor(camera.position.x), (int) Math.floor(camera.position.y),
                        (int) Math.floor(camera.position.z)),
                "chunks  " + world.loadedChunkCount() + " loaded, "
                        + chunkRenderer.getVisibleChunks() + " drawn",
                "tris  " + chunkRenderer.getDrawnTriangles(),
                "time  " + sky.clock() + "   seed  " + world.getSeed(),
                "mode  " + mode.displayName + (player.isFlying() ? "  (flying)" : ""),
        };

        float lineHeight = 19f;
        hud.rect(6, 6, 340, lines.length * lineHeight + 12, 0f, 0f, 0f, 0.45f);
        for (int i = 0; i < lines.length; i++) {
            font.drawShadowed(hud, lines[i], 14, 12 + i * lineHeight, 16, 1f, 1f, 1f, 1f);
        }
    }

    // ------------------------------------------------------------------ inventory screen

    private void drawInventoryScreen(int width, int height) {
        hud.rect(0, 0, width, height, 0f, 0f, 0f, 0.55f);

        List<BlockType> entries = paletteEntries();
        int rows = Math.max(1, (entries.size() + PALETTE_COLUMNS - 1) / PALETTE_COLUMNS);
        float gridWidth = PALETTE_COLUMNS * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;
        float left = (width - gridWidth) / 2f;
        float top = gridTop(height, rows);

        hud.rect(left - 12, top - 12, gridWidth + 24,
                rows * (SLOT_SIZE + SLOT_GAP) + 24, 0.12f, 0.12f, 0.14f, 0.92f);
        font.drawCentred(hud, mode.infiniteBlocks ? "All Blocks" : "Backpack",
                width / 2f, top - 46, 24, 1f, 1f, 1f, 1f);
        font.drawCentred(hud, "Click a block to put it in the selected hotbar slot",
                width / 2f, top + rows * (SLOT_SIZE + SLOT_GAP) + 22, 15,
                0.72f, 0.75f, 0.78f, 1f);

        BlockType hoveredType = null;
        for (int i = 0; i < entries.size(); i++) {
            float x = left + (i % PALETTE_COLUMNS) * (SLOT_SIZE + SLOT_GAP);
            float y = top + (i / PALETTE_COLUMNS) * (SLOT_SIZE + SLOT_GAP);
            boolean hovered = hitTest(x, y, input.getMouseX(), input.getMouseY());
            if (hovered) {
                hoveredType = entries.get(i);
            }

            hud.rect(x, y, SLOT_SIZE, SLOT_SIZE,
                    hovered ? 0.30f : 0.18f, hovered ? 0.30f : 0.18f, 0.22f, 0.9f);
            float inset = 7f;
            hud.icon(x + inset, y + inset, SLOT_SIZE - inset * 2,
                    blockLayers.layer(entries.get(i).id, Direction.SOUTH), 1f);
        }

        if (hoveredType != null) {
            font.drawCentred(hud, hoveredType.displayName, width / 2f, top - 22, 18,
                    1f, 0.95f, 0.7f, 1f);
        }
    }

    private float gridTop(int height, int rows) {
        return Math.max(80f, height / 2f - rows * (SLOT_SIZE + SLOT_GAP) / 2f - 40f);
    }

    /** Creative offers everything; survival shows what is actually in the backpack. */
    private List<BlockType> paletteEntries() {
        if (mode.infiniteBlocks) {
            return Blocks.palette();
        }
        List<BlockType> carried = new java.util.ArrayList<>();
        for (int i = Inventory.HOTBAR_SIZE; i < inventory.size(); i++) {
            Inventory.Slot slot = inventory.slot(i);
            if (!slot.isEmpty()) {
                carried.add(slot.type);
            }
        }
        return carried;
    }

    /** Clicking a block in the grid assigns it to the currently selected hotbar slot. */
    private void clickInventory() {
        List<BlockType> entries = paletteEntries();
        int rows = Math.max(1, (entries.size() + PALETTE_COLUMNS - 1) / PALETTE_COLUMNS);
        float gridWidth = PALETTE_COLUMNS * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;
        float left = (window.getWidth() - gridWidth) / 2f;
        float top = gridTop(window.getHeight(), rows);

        for (int i = 0; i < entries.size(); i++) {
            float x = left + (i % PALETTE_COLUMNS) * (SLOT_SIZE + SLOT_GAP);
            float y = top + (i / PALETTE_COLUMNS) * (SLOT_SIZE + SLOT_GAP);
            if (hitTest(x, y, input.getMouseX(), input.getMouseY())) {
                inventory.setSlot(inventory.getSelected(), entries.get(i),
                        mode.infiniteBlocks ? 1 : Inventory.MAX_STACK);
                return;
            }
        }
    }

    private boolean hitTest(float x, float y, float mouseX, float mouseY) {
        return mouseX >= x && mouseX < x + SLOT_SIZE && mouseY >= y && mouseY < y + SLOT_SIZE;
    }

    // ----------------------------------------------------------------------- screenshots

    private void handleScreenshot() {
        if (input.isKeyPressed(GLFW_KEY_F2)) {
            Screenshot.capture(window.getWidth(), window.getHeight(), Screenshot.defaultPath());
        }
        if (options.screenshotPath == null) {
            return;
        }
        if (!inWorld) {
            // Nothing streaming to wait for on a menu screen; a few frames is plenty.
            if (frame > 20) {
                Screenshot.capture(window.getWidth(), window.getHeight(),
                        Path.of(options.screenshotPath));
                window.requestClose();
            }
            return;
        }

        boolean settled = frame > 40
                && world.pendingChunkCount() == 0
                && world.chunksAwaitingLight() == 0
                && chunkRenderer.getPendingMeshJobs() == 0;

        if (settledFrame == 0 && (settled || frame > 900)) {
            settledFrame = frame;
            System.out.println("Loaded in " + frame + " frames; measuring steady state...");
        }
        if (settledFrame > 0 && frame >= settledFrame + 150) {
            System.out.println("Steady state: " + timer.getFps() + " fps, "
                    + world.loadedChunkCount() + " chunks loaded, "
                    + chunkRenderer.getVisibleChunks() + " visible, "
                    + chunkRenderer.getDrawnTriangles() + " triangles");
            Screenshot.capture(window.getWidth(), window.getHeight(),
                    Path.of(options.screenshotPath));
            window.requestClose();
        }
    }

    private void destroy() {
        if (audio != null) {
            audio.destroy();
        }
        if (chunkRenderer != null) {
            chunkRenderer.destroy();
        }
        if (world != null) {
            world.shutdown();
        }
        if (blockOutline != null) {
            blockOutline.destroy();
        }
        if (hud != null) {
            hud.destroy();
        }
        if (skyRenderer != null) {
            skyRenderer.destroy();
        }
        if (textures != null) {
            textures.destroy();
        }
        if (chunkShader != null) {
            chunkShader.destroy();
        }
        if (window != null) {
            window.destroy();
        }
    }
}
