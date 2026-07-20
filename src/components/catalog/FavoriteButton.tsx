import { Heart } from "lucide-react";
import { useApp } from "../../store/AppStore";
import type { FavoritesState } from "../../types";

export function FavoriteButton({
  kind,
  id,
  className = "",
}: {
  kind: keyof FavoritesState;
  id: string;
  className?: string;
}) {
  const { isFavorite, toggleFavorite } = useApp();
  const fav = isFavorite(kind, id);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(kind, id);
      }}
      aria-label={fav ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={fav}
      className={`rounded-full p-2 transition ${fav ? "text-red-500" : "text-slate-300 hover:text-slate-400"} ${className}`}
    >
      <Heart className={`h-5 w-5 ${fav ? "fill-current" : ""}`} />
    </button>
  );
}
