import { supabase } from "@/lib/supabase";
import MapPageClient from "./MapPageClient";

export const dynamic = "force-dynamic";

export default async function ProjectMapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: points, error: pointsError } = await supabase
    .from("mapping_points")
    .select(`
      id,
      point_code,
      latitude,
      longitude,
      elevation,
      status,
      rock_type,
      weathering,
      alteration,
      mineralization,
      structure_type,
      sample_id,
      sample_photo_url,
      outcrop_photo_url,
      layer_name
    `)
    .eq("project_id", id)
    .order("point_code");

  if (pointsError) {
    return <div className="p-6">Error: {pointsError.message}</div>;
  }

  const { data: polygonLayers, error: polygonLayerError } = await supabase
    .from("mapping_polygons")
    .select("layer_name")
    .eq("project_id", id);

  if (polygonLayerError) {
    return <div className="p-6">Error: {polygonLayerError.message}</div>;
  }

  const { data: lineLayers, error: lineLayerError } = await supabase
    .from("mapping_lines")
    .select("layer_name")
    .eq("project_id", id);

  if (lineLayerError) {
    return <div className="p-6">Error: {lineLayerError.message}</div>;
  }

  const layerNames = Array.from(
    new Set(
      [...(polygonLayers ?? []), ...(lineLayers ?? [])]
        .map((x) => x.layer_name)
        .filter(Boolean)
    )
  );

const { count: totalLines } = await supabase
  .from("mapping_lines")
  .select("*", { count: "exact", head: true })
  .eq("project_id", id);

const { count: totalPolygons } = await supabase
  .from("mapping_polygons")
  .select("*", { count: "exact", head: true })
  .eq("project_id", id);

  return (
<MapPageClient
  projectId={id}
  points={points ?? []}
  initialLayerNames={layerNames}
  totalLines={totalLines ?? 0}
  totalPolygons={totalPolygons ?? 0}
/>
  );
}