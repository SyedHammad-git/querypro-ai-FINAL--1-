import { redirect } from "next/navigation";

/**
 * Deprecated route. SQL Studio has been retired in favor of the Manual
 * SQL Builder (`/builder`), which is now the app's sole flagship SQL
 * playground — having both a "Studio" and a "Builder" was redundant.
 *
 * This route is kept (rather than deleted outright) purely so any old
 * bookmarks, shared links, or hardcoded references still land somewhere
 * useful instead of hitting a 404.
 */
export default function StudioPage() {
  redirect("/builder");
}
