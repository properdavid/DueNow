import type { Route } from "./+types/home";
import { redirect } from "react-router";

export function meta(_: Route.MetaArgs) {
  return [{ title: "DueNow" }];
}

export function loader(_: Route.LoaderArgs) {
  return redirect("/due");
}

export default function Home(_: Route.ComponentProps) {
  return null;
}
