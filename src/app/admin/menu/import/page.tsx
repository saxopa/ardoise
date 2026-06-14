import { requireRestaurant } from "@/lib/restaurant";
import ImportClient from "./import-client";

export const metadata = { title: "Importer une carte — Ardoise" };

export default async function ImportPage() {
  await requireRestaurant();
  return <ImportClient />;
}
