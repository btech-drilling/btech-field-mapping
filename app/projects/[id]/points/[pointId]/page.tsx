import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PointDetailPage({
  params,
}: {
  params: Promise<{ id: string; pointId: string }>;
}) {
  const { id, pointId } = await params;

  const { data: point, error } = await supabase
    .from("mapping_points")
    .select("*")
    .eq("id", pointId)
    .eq("project_id", id)
    .single();

  if (error || !point) {
    return <div className="p-6">Point not found</div>;
  }

  return (
    <div className="p-6 max-w-4xl">
      <Link href={`/projects/${id}/points`} className="text-sm underline">
        ← Back to Points
      </Link>

      <h1 className="mt-4 text-3xl font-bold">{point.point_code}</h1>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="border rounded p-4">
          <div className="font-bold">Coordinate</div>
          <div>Lat: {point.latitude}</div>
          <div>Lon: {point.longitude}</div>
          <div>Elevation: {point.elevation ?? "-"}</div>
        </div>

        <div className="border rounded p-4">
          <div className="font-bold">Status</div>
          <div>{point.status}</div>
          <div>Priority: {point.priority}</div>
          <div>Objective: {point.objective ?? "-"}</div>
        </div>
      </div>

      <div className="mt-6 border rounded p-4">
        <h2 className="font-bold mb-3">Field Mapping Record</h2>

        <div className="grid gap-2 md:grid-cols-2">
          <div>Rock Type: {point.rock_type ?? "-"}</div>
          <div>Weathering: {point.weathering ?? "-"}</div>
          <div>Alteration: {point.alteration ?? "-"}</div>
          <div>Mineralization: {point.mineralization ?? "-"}</div>
          <div>Structure: {point.structure_type ?? "-"}</div>
          <div>Strike: {point.strike ?? "-"}</div>
          <div>Dip: {point.dip ?? "-"}</div>
          <div>Sample ID: {point.sample_id ?? "-"}</div>
          <div>Sample Type: {point.sample_type ?? "-"}</div>
          <div className="md:col-span-2">Remark: {point.remark ?? "-"}</div>
        </div>
      </div>

      {(point.sample_photo_url || point.outcrop_photo_url) && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {point.sample_photo_url && (
            <div className="border rounded p-4">
              <div className="font-bold mb-3">Sample Photo</div>
              <img
                src={point.sample_photo_url}
                alt="Sample"
                className="w-full max-h-[420px] rounded border object-contain"
              />
            </div>
          )}

          {point.outcrop_photo_url && (
            <div className="border rounded p-4">
              <div className="font-bold mb-3">Outcrop Photo</div>
              <img
                src={point.outcrop_photo_url}
                alt="Outcrop"
                className="w-full max-h-[420px] rounded border object-contain"
              />
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Link
          href={`/projects/${id}/points/${point.id}/edit`}
          className="rounded bg-black px-4 py-2 text-white"
        >
          Edit Field Record
        </Link>
      </div>
    </div>
  );
}