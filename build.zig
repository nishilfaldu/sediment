//! This build belongs to Sediment (`native eject`).
//!
//! Standard `addApp` stages the SDK's stock `ts_core_main.zig`, which only
//! exposes `theme` / `theme_accent`. We need full DesignTokens for the
//! field-guide palette, so at configure time we:
//!   1. Stage src/wire.zig + src/theme.zig + rt + markup into `.native/gen/`
//!   2. Transpile src/core.ts → `.native/gen/core.zig`
//!   3. Build with `.main = ".native/gen/main.zig"` (skips dual-core check;
//!      core.ts remains the logic source of truth)
//!   4. Attach `app_manifest_zon` — Zig-shaped mains don't get it from
//!      addApp (only the stock TS stage does), but our wire needs it.

const std = @import("std");
const native_sdk = @import("native_sdk");

pub fn build(b: *std.Build) void {
    const dep = b.dependency("native_sdk", .{});
    syncGenWiring(b, dep) catch |err| {
        std.debug.print("failed to stage .native/gen wiring: {s}\n", .{@errorName(err)});
        @panic("stage failed");
    };
    transpileCoreNow(b, dep) catch |err| {
        std.debug.print("failed to transpile src/core.ts: {s}\n", .{@errorName(err)});
        @panic("transpile failed");
    };

    const artifacts = native_sdk.addAppArtifacts(b, dep, .{
        .name = "sediment",
        .main = ".native/gen/main.zig",
    });

    // Wire needs app.zon; Zig-shaped mains don't get it from addApp.
    // Reuse each module's own runner import so we don't duplicate the file.
    attachManifestImport(artifacts.exe.root_module);
    attachManifestImport(artifacts.tests.root_module);
}

fn attachManifestImport(mod: *std.Build.Module) void {
    if (mod.import_table.get("app_manifest_zon") != null) return;
    const runner_mod = mod.import_table.get("runner") orelse
        @panic("expected runner import on app module");
    const manifest_mod = runner_mod.import_table.get("app_manifest_zon") orelse
        @panic("expected app_manifest_zon on runner module");
    mod.addImport("app_manifest_zon", manifest_mod);
}

/// Copy app-owned wire/theme/markup + SDK rt into `.native/gen/` so the
/// custom main can `@import` them like the stock staged layout.
fn syncGenWiring(b: *std.Build, dep: *std.Build.Dependency) !void {
    const cwd = std.Io.Dir.cwd();
    const io = b.graph.io;
    try cwd.createDirPath(io, ".native/gen");

    try copyFile(io, "src/wire.zig", ".native/gen/main.zig");
    try copyFile(io, "src/theme.zig", ".native/gen/theme.zig");
    try copyFile(io, "src/app.native", ".native/gen/app.native");

    // Fonts are @embedFile'd from beside the staged main.
    try cwd.createDirPath(io, ".native/gen/fonts");
    try copyFile(io, "assets/fonts/Archivo.ttf", ".native/gen/fonts/Archivo.ttf");
    try copyFile(io, "assets/fonts/IBMPlexMono-Regular.ttf", ".native/gen/fonts/IBMPlexMono-Regular.ttf");
    try copyFile(io, "assets/fonts/Besley-Bold.ttf", ".native/gen/fonts/Besley-Bold.ttf");

    const sdk_root = dep.builder.build_root.path orelse ".";
    const rt_src = try std.fs.path.join(b.allocator, &.{ sdk_root, "packages/core/rt/rt.zig" });
    defer b.allocator.free(rt_src);
    try copyFile(io, rt_src, ".native/gen/rt.zig");
}

fn copyFile(io: std.Io, src: []const u8, dest: []const u8) !void {
    const cwd = std.Io.Dir.cwd();
    const data = try cwd.readFileAlloc(io, src, std.heap.page_allocator, .limited(8 * 1024 * 1024));
    defer std.heap.page_allocator.free(data);
    try cwd.writeFile(io, .{ .sub_path = dest, .data = data });
}

fn transpileCoreNow(b: *std.Build, dep: *std.Build.Dependency) !void {
    const node = b.findProgram(&.{"node"}, &.{}) catch {
        @panic("\nbuilding Sediment needs node on PATH (the @native-sdk/core transpiler).\n");
    };
    const sdk_root = dep.builder.build_root.path orelse ".";
    const ts_run = try std.fs.path.join(b.allocator, &.{ sdk_root, "build/ts_run.mjs" });
    defer b.allocator.free(ts_run);
    const cli = try std.fs.path.join(b.allocator, &.{ sdk_root, "packages/core/src/cli.ts" });
    defer b.allocator.free(cli);

    const result = try std.process.run(b.allocator, b.graph.io, .{
        .argv = &.{ node, ts_run, cli, "src/core.ts", "-o", ".native/gen/core.zig" },
        .stdout_limit = .limited(1024 * 1024),
        .stderr_limit = .limited(1024 * 1024),
    });
    defer b.allocator.free(result.stdout);
    defer b.allocator.free(result.stderr);

    switch (result.term) {
        .exited => |code| {
            if (code != 0) {
                std.debug.print("{s}", .{result.stderr});
                return error.TranspileFailed;
            }
        },
        else => {
            std.debug.print("{s}", .{result.stderr});
            return error.TranspileFailed;
        },
    }
}
