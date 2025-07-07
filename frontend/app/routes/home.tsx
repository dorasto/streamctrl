import type { Route } from "./+types/home";
import Welcome from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "streamCTRL" },
    { name: "description", content: "Welcome to StreamCTRL!" },
  ];
}

export default function Home() {
  return <Welcome />;
}
