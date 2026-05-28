import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { search } from "~/lib/stations.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  if (q.trim().length < 2) return Response.json([]);
  const matches = await search(q, 10);
  return Response.json(
    matches.map((m) => ({ id: m.id, name: m.name })),
    {
      headers: { "Cache-Control": "public, max-age=300" },
    },
  );
}
