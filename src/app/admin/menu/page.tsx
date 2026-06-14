import Link from "next/link";
import { requireRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { Badge, Button, Card, Input, Label } from "@/components/ui";
import {
  createCategory,
  deleteCategory,
  deleteItem,
  toggleItemAvailability,
} from "./actions";
import ItemEditor from "./item-editor";
import ImageUpload from "./image-upload";
import NewItemForm from "./new-item-form";

export const metadata = { title: "Carte — Ardoise" };

export default async function MenuPage() {
  const { restaurant } = await requireRestaurant();
  const supabase = await createClient();

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order"),
    supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order"),
  ]);

  const cats = (categories ?? []) as MenuCategory[];
  const allItems = (items ?? []) as MenuItem[];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-[28px] font-bold md:text-[42px]">
        Votre carte
      </h1>
      <p className="mt-2 text-ardoise-mid">
        Les modifications sont visibles immédiatement par vos clients. Une
        rupture&nbsp;? Un clic sur «&nbsp;En rupture&nbsp;».
      </p>

      {/* Import assisté par IA */}
      <Link
        href="/admin/menu/import"
        className="press mt-6 inline-flex h-11 items-center rounded-[4px] bg-terracotta px-5 font-semibold text-craie transition-colors duration-150 hover:bg-terracotta-dark"
      >
        Importer ma carte en photo (IA) →
      </Link>

      {/* Nouvelle catégorie */}
      <Card className="mt-8">
        <form action={createCategory} className="flex items-end gap-3">
          <div className="flex-1">
            <Label htmlFor="new-cat">Nouvelle catégorie</Label>
            <Input
              id="new-cat"
              name="name"
              placeholder="Entrées, Plats, Vins…"
              maxLength={60}
              required
            />
          </div>
          <Button type="submit" variant="secondary">
            Ajouter
          </Button>
        </form>
      </Card>

      {cats.length === 0 && (
        <p className="mt-8 text-ardoise-mid">
          Commencez par créer une catégorie ci-dessus.
        </p>
      )}

      {cats.map((cat) => {
        const catItems = allItems.filter((i) => i.category_id === cat.id);
        return (
          <section key={cat.id} className="mt-10">
            <div className="flex items-baseline justify-between border-b border-ardoise-deep/12 pb-2">
              <h2 className="font-display text-xl font-bold">{cat.name}</h2>
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={cat.id} />
                <button
                  type="submit"
                  className="text-sm text-[#a33b2e]/70 underline underline-offset-[3px] hover:text-[#a33b2e]"
                >
                  Supprimer la catégorie
                </button>
              </form>
            </div>

            <ul className="mt-4 space-y-3">
              {catItems.map((item) => (
                <li
                  key={item.id}
                  className={`border-l-[3px] py-2 pl-4 ${
                    item.is_available
                      ? "border-terracotta"
                      : "border-ardoise-mid/30 opacity-60"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-semibold">{item.name}</span>
                      {!item.is_available && (
                        <Badge tone="neutral" className="ml-2">
                          En rupture
                        </Badge>
                      )}
                      {item.description && (
                        <p className="mt-0.5 text-sm text-ardoise-mid">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono">
                        {item.price_cents === null
                          ? "—"
                          : formatPrice(item.price_cents, restaurant.currency)}
                      </span>
                      <form action={toggleItemAvailability}>
                        <input type="hidden" name="id" value={item.id} />
                        <input
                          type="hidden"
                          name="available"
                          value={String(!item.is_available)}
                        />
                        <button
                          type="submit"
                          className="text-sm text-ardoise-mid underline underline-offset-[3px] hover:text-encre"
                        >
                          {item.is_available ? "En rupture" : "Disponible"}
                        </button>
                      </form>
                      <ItemEditor item={item} currency={restaurant.currency} />
                      <form action={deleteItem}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          className="text-sm text-[#a33b2e]/70 underline underline-offset-[3px] hover:text-[#a33b2e]"
                        >
                          Supprimer
                        </button>
                      </form>
                    </div>
                  </div>
                  <div className="mt-2">
                    <ImageUpload
                      restaurantId={restaurant.id}
                      itemId={item.id}
                      currentUrl={item.image_url}
                    />
                  </div>
                </li>
              ))}
            </ul>

            {/* Nouveau plat dans cette catégorie */}
            <details className="mt-4">
              <summary className="cursor-pointer text-[15px] font-medium text-terracotta">
                + Ajouter un plat dans «&nbsp;{cat.name}&nbsp;»
              </summary>
              <NewItemForm restaurantId={restaurant.id} categoryId={cat.id} />
            </details>
          </section>
        );
      })}
    </div>
  );
}
