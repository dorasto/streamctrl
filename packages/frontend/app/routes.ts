import { type RouteConfig, layout, route } from "@react-router/dev/routes";

export default [
  // API
  route("/api/auth/*", "routes/api/auth.$.ts"),

  // Pages
  layout("routes/layout.tsx", [
    // Homepage
    route("/login", "routes/home.tsx"),
    layout("routes/root/layout.tsx", [
      // Logged in pages
      route("/", "routes/root/root.tsx"),
      // OBS
      route("/group/:groupId", "routes/root/obs/index.tsx"),
      // Admin pages
      route("/admin/users", "routes/root/users.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
