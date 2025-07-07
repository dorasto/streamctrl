import { type RouteConfig, layout, route } from "@react-router/dev/routes";

export default [
  // API
  route("/api/auth/*", "routes/api/auth.$.ts"),

  // Pages
  layout("routes/layout.tsx", [
    // Homepage
    route("/", "routes/home.tsx"),
    layout("routes/admin/layout.tsx", [
      // Logged in pages
      route("/admin", "routes/admin/root.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
