"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DeleteProjectButton({
  projectId,
}: {
  projectId: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function deleteProject() {
    const ok = window.confirm(
      "ต้องการลบ Project นี้จริงไหม?\n\nข้อมูล Points, Lines, Polygons และข้อมูลบนแผนที่ทั้งหมดของ Project นี้จะถูกลบออกจากระบบ"
    );

    if (!ok) return;

    setDeleting(true);

    try {
      const { error: pointsError } = await supabase
        .from("mapping_points")
        .delete()
        .eq("project_id", projectId);

      if (pointsError) throw pointsError;

      const { error: linesError } = await supabase
        .from("mapping_lines")
        .delete()
        .eq("project_id", projectId);

      if (linesError) throw linesError;

      const { error: polygonsError } = await supabase
        .from("mapping_polygons")
        .delete()
        .eq("project_id", projectId);

      if (polygonsError) throw polygonsError;

      const { error: projectError } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (projectError) throw projectError;

      window.location.href = "/projects";
    } catch (error: any) {
      alert("Delete project error: " + error.message);
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={deleteProject}
      disabled={deleting}
      className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white shadow hover:bg-red-700 disabled:opacity-50"
    >
      {deleting ? "Deleting..." : "Delete Project"}
    </button>
  );
}