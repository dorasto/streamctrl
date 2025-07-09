import { type RouteConfig, layout, route } from "@react-router/dev/routes";

export default [
  // API
  route("/api/auth/*", "routes/api/auth.$.ts"),

  // Pages
  layout("routes/layout.tsx", [
    // Homepage
    route("/login", "routes/home.tsx"),
    layout("routes/admin/layout.tsx", [
      // Logged in pages
      route("/", "routes/admin/root.tsx"),
      // Admin pages
      route("/admin/users", "routes/admin/users.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
