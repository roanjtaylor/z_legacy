package com.craft;

/**
 * Entry point. Parses the command line and hands off to {@link Game}.
 *
 * <pre>
 *   --seed=&lt;long&gt;              world seed; random if omitted
 *   --render-distance=&lt;n&gt;      chunks, 2..24
 *   --time=&lt;0..1&gt;              freeze the clock (0 dawn, 0.25 noon, 0.5 dusk, 0.75 midnight)
 *   --mode=survival|creative   starting game mode; F4 switches in game
 *   --world=&lt;name&gt;            skip the menu: load that saved world, or create it
 *   --camera=x,y,z,yaw,pitch   start the camera somewhere specific
 *   --menu                     stay on the main menu (used to photograph it)
 *   --debug                    start with the F3 overlay showing
 *   --exit-after=&lt;seconds&gt;     close cleanly after a while, saving on the way out
 *   --screenshot=&lt;path&gt;        save a PNG once the world has loaded, then exit
 * </pre>
 */
public class Main {

    public static void main(String[] args) {
        Game.Options options = new Game.Options();

        for (String arg : args) {
            try {
                if (arg.startsWith("--seed=")) {
                    options.seed = parseSeed(arg.substring("--seed=".length()));
                } else if (arg.startsWith("--render-distance=")) {
                    options.renderDistance =
                            Integer.parseInt(arg.substring("--render-distance=".length()));
                } else if (arg.startsWith("--time=")) {
                    options.timeOfDay = Float.parseFloat(arg.substring("--time=".length()));
                } else if (arg.startsWith("--exit-after=")) {
                    options.exitAfter = Float.parseFloat(arg.substring("--exit-after=".length()));
                } else if (arg.equals("--menu")) {
                    options.menuOnly = true;
                } else if (arg.equals("--debug")) {
                    options.debugOverlay = true;
                } else if (arg.startsWith("--world=")) {
                    options.worldName = arg.substring("--world=".length());
                } else if (arg.startsWith("--mode=")) {
                    options.mode = com.craft.game.GameMode.byName(
                            arg.substring("--mode=".length()));
                } else if (arg.startsWith("--screenshot=")) {
                    options.screenshotPath = arg.substring("--screenshot=".length());
                } else if (arg.startsWith("--camera=")) {
                    String[] parts = arg.substring("--camera=".length()).split(",");
                    options.camera = new float[5];
                    for (int i = 0; i < 5 && i < parts.length; i++) {
                        options.camera[i] = Float.parseFloat(parts[i].trim());
                    }
                } else {
                    System.err.println("Ignoring unrecognised argument: " + arg);
                }
            } catch (NumberFormatException e) {
                System.err.println("Could not parse " + arg + " - " + e.getMessage());
                System.exit(2);
            }
        }

        new Game(options).run();
    }

    /** Accepts a number, or hashes any other text the way Minecraft does with named seeds. */
    private static long parseSeed(String text) {
        try {
            return Long.parseLong(text.trim());
        } catch (NumberFormatException e) {
            return text.hashCode();
        }
    }
}
