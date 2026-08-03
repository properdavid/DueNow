import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  route("auth/google", "routes/auth.google.tsx"),
  route("auth/google/callback", "routes/auth.google-callback.tsx"),
  route("auth/logout", "routes/auth.logout.tsx"),
  route("api/parents", "routes/api.parents.tsx"),
  route("api/work-items/create", "routes/api.work-items.create.tsx"),
  route("api/work-items/:id/assign", "routes/api.work-items.$id.assign.tsx"),
  route("api/work-items/:id/reparent", "routes/api.work-items.$id.reparent.tsx"),
  route("api/work-items/:id/settle", "routes/api.work-items.$id.settle.tsx"),
  route("api/work-items/:id/start", "routes/api.work-items.$id.start.tsx"),
  route("api/work-items/:id/unsettle", "routes/api.work-items.$id.unsettle.tsx"),
  route("api/work-items/:id/update-description", "routes/api.work-items.$id.update-description.tsx"),
  route("api/work-items/:id/update-due-date", "routes/api.work-items.$id.update-due-date.tsx"),
  route("api/work-items/:id/update-summary", "routes/api.work-items.$id.update-summary.tsx"),
  layout("routes/shell.tsx", [
    index("routes/home.tsx"),
    route("due", "routes/due.tsx", [route(":id", "routes/work-item.tsx", { id: "due-item" })]),
    route("items", "routes/items.tsx", [route(":id", "routes/work-item.tsx", { id: "items-item" })]),
    route("search", "routes/search.tsx", [route(":id", "routes/work-item.tsx", { id: "search-item" })]),
    route("settings", "routes/settings.tsx"),
  ]),
] satisfies RouteConfig;
