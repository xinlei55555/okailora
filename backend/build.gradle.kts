plugins {
    kotlin("jvm") version "1.9.25"
    kotlin("plugin.spring") version "1.9.25"
    id("org.springframework.boot") version "3.5.3"
    id("io.spring.dependency-management") version "1.1.7"
    id("org.openapi.generator") version "7.5.0"
}

group = "ca.kailo"
version = "1.0.0"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

configurations {
    compileOnly {
        extendsFrom(configurations.annotationProcessor.get())
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    implementation("org.slf4j:slf4j-api:2.0.13")
    runtimeOnly("org.slf4j:slf4j-simple:2.0.13")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.5.0")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}

tasks.bootJar {
    mainClass = "ca.kailo.berkeley.Application"
}

tasks.openApiGenerate {
    generatorName.set("kotlin-spring") // or "java" if you prefer
    inputSpec.set("$rootDir/src/main/resources/openapi.yml") // adjust as needed
    outputDir.set("$buildDir/generated") // destination of generated sources
    apiPackage.set("ca.kailo.berkeley.api")
    modelPackage.set("ca.kailo.berkeley.model")
    invokerPackage.set("ca.kailo.berkeleyinvoker")
    configOptions.set(
        mapOf(
            "interfaceOnly" to "true",     // only generate the interface stubs
            "useSpringBoot3" to "true",
            "useTags" to "true",           // group operations by their tag :contentReference[oaicite:0]{index=0}
            "apiSuffix" to "API"           // change "AppApi" → "AppAPI" :contentReference[oaicite:1]{index=1}
        )
    )
}

sourceSets["main"].java {
    srcDir("$buildDir/generated/src/main/kotlin")
}

tasks.named("compileKotlin") {
    dependsOn("openApiGenerate")
}