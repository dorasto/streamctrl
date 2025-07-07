import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  // API
  route("/api/auth/*", "routes/api/auth.$.ts"),

  // Pages

  layout("routes/layout.tsx", [route("/", "routes/home.tsx")]),
] satisfies RouteConfig;
