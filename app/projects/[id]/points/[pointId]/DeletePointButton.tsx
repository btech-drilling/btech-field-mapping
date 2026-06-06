"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DeletePointButton({
  projectId,
  pointId,
  from = "point",
}: {
  projectId: string;
  pointId: string;
  from?: "point" | "map";
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function deletePoint() {
    const ok = window.confirm(
      "ต้องการลบ Point นี้จริงไหม? ข้อมูล Field Record ของจุดนี้จะถูกลบออกจากระบบ"
    );

    if (!ok) return;

    setDeleting(true);

    const { error } = await supabase
      .from("mapping_points")
      .delete()
      .eq("id", pointId)
      .eq("project_id", projectId);

    if (error) {
      alert("Delete error: " + error.message);
      setDeleting(false);
      return;
    }

    if (from === "map") {
      window.location.href = `/projects/${projectId}/map`;
    } else {
      router.push(`/projects/${projectId}/points`);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={deletePoint}
      disabled={deleting}
      className="rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
    >
      {deleting ? "Deleting..." : "Delete Point"}
    </button>
  );
}