import { supabase } from "@/lib/supabase";
import PointsPageClient from "./PointsPageClient";

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

  return <PointsPageClient projectId={id} points={points ?? []} />;
}