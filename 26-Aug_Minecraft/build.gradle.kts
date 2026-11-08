// Optional: for importing the project into IntelliJ or Eclipse.
//
// Nothing depends on this file. The project's real build is build.ps1, which downloads the
// same dependencies into libs/ and compiles with javac, so no build tool has to be installed
// to play. This exists purely so an IDE can resolve the classpath and offer completion.

plugins {
    java
    application
}

repositories {
    mavenCentral()
}

val lwjglVersion = "3.3.6"
val jomlVersion = "1.10.9"

// Natives for the machine doing the importing. build.ps1 always fetches the Windows ones.
val lwjglNatives = when {
    org.gradle.internal.os.OperatingSystem.current().isWindows -> "natives-windows"
    org.gradle.internal.os.OperatingSystem.current().isMacOsX -> "natives-macos"
    else -> "natives-linux"
}

dependencies {
    implementation(platform("org.lwjgl:lwjgl-bom:$lwjglVersion"))

    for (module in listOf("lwjgl", "lwjgl-glfw", "lwjgl-opengl", "lwjgl-stb", "lwjgl-openal")) {
        implementation("org.lwjgl:$module")
        runtimeOnly("org.lwjgl:$module::$lwjglNatives")
    }
    implementation("org.joml:joml:$jomlVersion")
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(17))
    }
}

sourceSets {
    main {
        java.setSrcDirs(listOf("src"))
        resources.setSrcDirs(emptyList<String>())
    }
}

application {
    mainClass.set("com.craft.Main")
    // Shaders, textures and saves are all resolved relative to the project directory.
    applicationDefaultJvmArgs = listOf()
}

tasks.named<JavaExec>("run") {
    workingDir = projectDir
}

// ./gradlew check runs the same headless assertions as check.bat.
tasks.register<JavaExec>("selfCheck") {
    group = "verification"
    description = "Headless checks over world generation, collision, lighting and saving."
    classpath = sourceSets["main"].runtimeClasspath
    mainClass.set("com.craft.dev.SelfCheck")
    workingDir = projectDir
}
