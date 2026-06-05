import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PointsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: points, error } = await supabase
    .from("mapping_points")
    .select("*")
    .eq("project_id", id)
    .order("point_code");

  if (error) {
    return <div className="p-6">Error: {error.message}</div>;
  }

  return (
    <div className="p-6">
      <Link href={`/projects/${id}`} className="text-sm underline">
        ← Back to Project
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Mapping Points</h1>

      <p className="text-gray-500 mb-6">
        Total: {points?.length ?? 0} points
      </p>

      <div className="grid gap-3">
        {(points ?? []).map((p) => {
          const thumbnail = p.outcrop_photo_url || p.sample_photo_url;

          return (
            <Link
              key={p.id}
              href={`/projects/${id}/points/${p.id}`}
              className="border rounded p-4 hover:bg-gray-50"
            >
              <div className="flex gap-4">
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={p.point_code}
                    className="h-24 w-24 rounded border object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded border bg-gray-100 text-xs text-gray-400">
                    No Photo
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-bold">{p.point_code}</div>

                    {p.sample_photo_url && (
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs">
                        Sample
                      </span>
                    )}

                    {p.outcrop_photo_url && (
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs">
                        Outcrop
                      </span>
                    )}
                  </div>

                  <div className="mt-1 text-sm text-gray-500">
                    Lat: {p.latitude}
                  </div>

                  <div className="text-sm text-gray-500">
                    Lon: {p.longitude}
                  </div>

                  <div className="mt-1 text-sm">Status: {p.status}</div>

                  <div className="mt-1 text-sm text-gray-600">
                    Rock Type: {p.rock_type ?? "-"}
                  </div>

                  <div className="text-sm text-gray-600">
                    Mineralization: {p.mineralization ?? "-"}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}