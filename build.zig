const std = @import("std");

pub fn build(b: *std.Build) void {
    const optimize = b.standardOptimizeOption(.{});

    const liblaghari_dep = b.dependency("laghari", .{
        .target = @as([]const u8, "wasm32-freestanding"),
        .optimize = optimize,
    });
    const liblaghari = liblaghari_dep.artifact("laghari");

    const install_liblaghari = b.addInstallFile(liblaghari.getEmittedBin(), "laghari.wasm");
    const copy_site = b.addInstallDirectory(.{
        .source_dir = b.path("src"),
        .install_dir = .prefix,
        .install_subdir = ".",
    });

    b.getInstallStep().dependOn(&install_liblaghari.step);
    b.getInstallStep().dependOn(&copy_site.step);

    const serve_command = b.addSystemCommand(&.{ "npx", "http-server", "-p", "8080", "-c-1" });
    serve_command.setCwd(.{ .cwd_relative = b.getInstallPath(.prefix, ".") });

    const serve_step = b.step("serve", "Serve the result and open in browser");
    serve_step.dependOn(b.getInstallStep());
    serve_step.dependOn(&serve_command.step);
}
