# Asset and library licences

## Block textures

**16x16 Block Texture Set** — by *ARoachIFoundOnMyPillow*, released under
[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) (public domain
dedication). No attribution is required; it is recorded here because credit is the decent thing
and because it documents where the files came from.

- Source: https://opengameart.org/content/16x16-block-texture-set
- Files: `assets/textures/blocks/` (148 PNGs, all 16x16 except a few 16x32 plants)
- Palette: Comfy52

A handful of tiles the pack does not include — water and the four ore variants — are generated
in code at startup by `render/ProceduralTextures.java`. The ores are drawn over the pack's own
stone tile so they sit in the same palette as everything else rather than looking pasted on.

## Font

No font file ships with the project. Printable ASCII is rasterised at startup from the JDK's
logical `MONOSPACED` font into 16x16 cells and uploaded as extra layers of the block texture
array (`render/BitmapFont.java`).

## Sound

No audio files ship with the project. Every sound — footsteps, block breaks and placements,
hurt, splash — is synthesised from filtered noise and swept tones at startup
(`audio/Sfx.java`).

## Libraries

| Library | Version | Licence |
|---|---|---|
| [LWJGL](https://www.lwjgl.org/) — core, GLFW, OpenGL, OpenAL, STB | 3.3.6 | BSD-3-Clause |
| [JOML](https://github.com/JOML-CI/JOML) | 1.10.9 | MIT |

Both are downloaded from Maven Central into `libs/` on first build and are not committed to
this repository.

## Not used

No Minecraft code, textures, sounds or other assets are used in this project, including
decompiled or reverse-engineered sources. Minecraft is a trademark of Mojang Studios; this is
an independent piece of work, not affiliated with or endorsed by them.
