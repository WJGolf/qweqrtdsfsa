"use client";
import { useTransition } from "react";
import { toggleFavorite } from "@/app/actions";

export default function FavoriteButton({ characterId, isFav }: { characterId: string; isFav: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button className="btn-ghost" disabled={pending} aria-pressed={isFav}
      onClick={() => start(() => toggleFavorite(characterId, isFav))}>
      {isFav ? "★ Favorited" : "☆ Favorite"}
    </button>
  );
}
