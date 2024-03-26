import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");

await build({
    entryPoints: ["./src/mod.ts"],
    outDir: "./npm",
    shims: {
        // see JS docs for overview and more options
        deno: true,
    },
    typeCheck: false,
    test: false,
    package: {
        // package.json properties
        name: "rpc-broker",
        version: "1.0.0",
        license: "GPL-3.0-or-later",
        repository: {
            type: "git",
            url: "git+https://github.com/hansSchall/rpc-broker.git",
        },
    },
    postBuild() {
        // steps to run after building and before running the tests
        Deno.copyFileSync("LICENSE", "npm/LICENSE");
        Deno.copyFileSync("README.md", "npm/README.md");
    },
});
