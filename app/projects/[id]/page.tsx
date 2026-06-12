import { supabase } from "@/lib/supabase";
import Link from "next/link";
import DeleteProjectButton from "./DeleteProjectButton";

export const dynamic = "force-dynamic";

function getStatusStyle(status: string | null) {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-700";
    case "SAMPLED":
      return "bg-orange-100 text-orange-700";
    case "VISITED":
      return "bg-yellow-100 text-yellow-700";
    case "NEED_REVISIT":
      return "bg-red-100 text-red-700";
    case "PLANNED":
    default:
      return "bg-blue-100 text-blue-700";
  }
}

function getPointPhotoCount(point: any) {
  let count = 0;

  if (point.sample_photo_url) count += 1;
  if (point.outcrop_photo_url) count += 1;

  if (Array.isArray(point.more_photos)) {
    count += point.more_photos.filter((photo: any) => photo?.url).length;
  } else if (Array.isArray(point.photo_urls)) {
    count += point.photo_urls.filter(Boolean).length;
  }

  return count;
}

function formatDate(value: string | null) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Bangkok",
    });
  } catch {
    return value;
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) {
    return <div className="p-6">Project not found</div>;
  }

  const { data: points } = await supabase
    .from("mapping_points")
    .select(
      `
      id,
      point_code,
      status,
      sample_id,
      sample_photo_url,
      outcrop_photo_url,
      photo_urls,
      more_photos,
      rock_type,
      weathering,
      alteration,
      mineralization,
      structure_type,
      strike,
      dip,
      remark,
      updated_at
    `
    )
    .eq("project_id", id)
    .order("updated_at", { ascending: false });

  const pointList = points ?? [];
  const totalPoints = pointList.length;

  const planned = pointList.filter((p) => p.status === "PLANNED").length;
  const visited = pointList.filter((p) => p.status === "VISITED").length;
  const sampled = pointList.filter((p) => p.status === "SAMPLED").length;
  const completed = pointList.filter((p) => p.status === "COMPLETED").length;
  const needRevisit = pointList.filter(
    (p) => p.status === "NEED_REVISIT"
  ).length;

  const sampleCount = pointList.filter((p) => p.sample_id).length;
  const photoPointCount = pointList.filter((p) => getPointPhotoCount(p) > 0)
    .length;

  const noPhotoCount = pointList.filter((p) => getPointPhotoCount(p) === 0)
    .length;

  const noSampleCount = pointList.filter((p) => !p.sample_id).length;

  const geologyCompleteCount = pointList.filter(
    (p) => p.rock_type || p.weathering || p.alteration || p.mineralization
  ).length;

  const missingGeologyCount = pointList.filter(
    (p) => !p.rock_type && !p.weathering && !p.alteration && !p.mineralization
  ).length;

  const fieldProgressCount = visited + sampled + completed;
  const fieldProgress =
    totalPoints > 0 ? Math.round((fieldProgressCount / totalPoints) * 100) : 0;

  const completeProgress =
    totalPoints > 0 ? Math.round((completed / totalPoints) * 100) : 0;

  const statusRows = [
    ["COMPLETED", completed, "bg-green-600"],
    ["SAMPLED", sampled, "bg-orange-500"],
    ["VISITED", visited, "bg-yellow-500"],
    ["NEED_REVISIT", needRevisit, "bg-red-600"],
    ["PLANNED", planned, "bg-blue-600"],
  ] as const;

  const recentPoints = pointList
    .filter((p) => p.status && p.status !== "PLANNED")
    .slice(0, 6);

  const followUpPoints = pointList
    .filter((p) => {
      const photoCount = getPointPhotoCount(p);

      return (
        p.status === "NEED_REVISIT" ||
        !p.rock_type ||
        photoCount === 0 ||
        (p.status === "SAMPLED" && !p.sample_id)
      );
    })
    .slice(0, 12);

  const plannedPoints = pointList
    .filter((p) => p.status === "PLANNED" || !p.status)
    .slice(0, 8);

  const readyForReviewPoints = pointList
    .filter((p) => {
      const photoCount = getPointPhotoCount(p);

      return (
        p.status === "COMPLETED" &&
        photoCount > 0 &&
        (p.rock_type || p.remark)
      );
    })
    .slice(0, 8);

  function getFollowUpReason(point: any) {
    const reasons: string[] = [];

    if (point.status === "NEED_REVISIT") {
      reasons.push("Need revisit");
    }

    if (getPointPhotoCount(point) === 0) {
      reasons.push("No photo");
    }

    if (!point.rock_type) {
      reasons.push("No rock type");
    }

    if (point.status === "SAMPLED" && !point.sample_id) {
      reasons.push("Sample ID missing");
    }

    if (!point.remark) {
      reasons.push("No remark");
    }

    return reasons.length > 0 ? reasons.join(" / ") : "Check record";
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6">
          <Link href="/projects" className="text-sm text-slate-300 underline">
            ← Back to Projects
          </Link>
        </div>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-8 shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
                Project Dashboard
              </div>

              <h1 className="text-4xl font-black tracking-tight">
                {project.project_code}
              </h1>

              <p className="mt-2 text-xl text-slate-200">
                {project.project_name}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                  {project.status}
                </span>

                {project.description && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-300">
                    {project.description}
                  </span>
                )}

                <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-300">
                  Field Progress {fieldProgress}%
                </span>

                {needRevisit > 0 && (
                  <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm font-semibold text-red-200">
                    {needRevisit} Need Revisit
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/projects/${project.id}/map`}
                className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 shadow hover:bg-slate-100"
              >
                Open Map
              </Link>

              <Link
                href={`/projects/${project.id}/points`}
                className="rounded-xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/10"
              >
                Points List
              </Link>

              <Link
                href={`/projects/${project.id}/import`}
                className="rounded-xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/10"
              >
                Import KML
              </Link>

              <DeleteProjectButton projectId={id} />
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              ["Total Points", totalPoints],
              ["Field Progress", `${fieldProgress}%`],
              ["Ready Review", readyForReviewPoints.length],
              ["Need Revisit", needRevisit],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur"
              >
                <div className="text-sm text-slate-300">{label}</div>
                <div className="mt-2 text-4xl font-black">{value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["Samples", sampleCount, `${noSampleCount} no sample`, "🧪"],
            ["Photo Points", photoPointCount, `${noPhotoCount} no photo`, "📷"],
            [
              "Geology Records",
              geologyCompleteCount,
              `${missingGeologyCount} missing`,
              "🪨",
            ],
            ["Completed", completed, `${completeProgress}% accepted`, "✅"],
          ].map(([label, value, subLabel, icon]) => (
            <div
              key={label}
              className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-xl"
            >
              <div className="mb-3 text-3xl">{icon}</div>
              <div className="text-sm font-semibold text-slate-500">
                {label}
              </div>
              <div className="mt-1 text-4xl font-black">{value}</div>
              <div className="mt-2 text-sm text-slate-500">{subLabel}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Project Progress</h2>
                <p className="text-sm text-slate-500">
                  Field progress counts VISITED, SAMPLED and COMPLETED points
                </p>
              </div>

              <div className="text-4xl font-black">{fieldProgress}%</div>
            </div>

            <div className="h-5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${fieldProgress}%` }}
              />
            </div>

            <div className="mt-6 grid gap-4">
              {statusRows.map(([label, value, color]) => {
                const percent =
                  totalPoints > 0
                    ? Math.round((Number(value) / totalPoints) * 100)
                    : 0;

                return (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{label}</span>
                      <span className="text-slate-500">
                        {value} / {totalPoints} ({percent}%)
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded bg-slate-200">
                      <div
                        className={`h-full ${color}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Quick Actions</h2>
            </div>

            <div className="grid gap-3">
              <Link
                href={`/projects/${project.id}/map`}
                className="rounded-2xl border p-4 hover:bg-slate-50"
              >
                <div className="font-bold">🗺 Open Map</div>
                <div className="text-sm text-slate-500">
                  View field points by location and status
                </div>
              </Link>

              <Link
                href={`/projects/${project.id}/points`}
                className="rounded-2xl border p-4 hover:bg-slate-50"
              >
                <div className="font-bold">📍 Mapping Points</div>
                <div className="text-sm text-slate-500">
                  Review records, status, samples and photos
                </div>
              </Link>

              <Link
                href={`/projects/${project.id}/import`}
                className="rounded-2xl border p-4 hover:bg-slate-50"
              >
                <div className="font-bold">⬆ Import KML / KMZ</div>
                <div className="text-sm text-slate-500">
                  Upload planned points, geology polygons and map layers
                </div>
              </Link>

              <Link
                href={`/projects/${project.id}/points?status=NEED_REVISIT`}
                className="rounded-2xl border border-red-200 bg-red-50 p-4 hover:bg-red-100"
              >
                <div className="font-bold text-red-700">
                  🔁 Check Need Revisit
                </div>
                <div className="text-sm text-red-600">
                  Points requiring additional field verification
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">Need Revisit / Follow-up</h2>
                <p className="text-sm text-slate-500">
                  จุดที่ควรกลับไปตรวจซ้ำ หรือยังมีข้อมูลไม่ครบ
                </p>
              </div>

              <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                {followUpPoints.length}
              </span>
            </div>

            <div className="grid gap-3">
              {followUpPoints.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${project.id}/points/${p.id}`}
                  className="rounded-2xl border p-4 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold">{p.point_code}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {getFollowUpReason(p)}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        Updated: {formatDate(p.updated_at)}
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                        p.status
                      )}`}
                    >
                      {p.status ?? "PLANNED"}
                    </span>
                  </div>
                </Link>
              ))}

              {followUpPoints.length === 0 && (
                <div className="rounded-2xl border border-dashed p-6 text-center text-slate-500">
                  No follow-up points
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">Ready for Review</h2>
                <p className="text-sm text-slate-500">
                  จุดที่สถานะ COMPLETED และมีรูป/ข้อมูลหลักแล้ว
                </p>
              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                {readyForReviewPoints.length}
              </span>
            </div>

            <div className="grid gap-3">
              {readyForReviewPoints.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${project.id}/points/${p.id}`}
                  className="rounded-2xl border p-4 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold">{p.point_code}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {p.rock_type || "No rock type"} ·{" "}
                        {getPointPhotoCount(p)} photos
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        Updated: {formatDate(p.updated_at)}
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      READY
                    </span>
                  </div>
                </Link>
              ))}

              {readyForReviewPoints.length === 0 && (
                <div className="rounded-2xl border border-dashed p-6 text-center text-slate-500">
                  No completed review-ready points yet
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Recent Field Updates</h2>
              <p className="text-sm text-slate-500">
                Latest non-planned mapping records
              </p>
            </div>

            <Link
              href={`/projects/${project.id}/points`}
              className="text-sm underline"
            >
              View all
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recentPoints.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${project.id}/points/${p.id}`}
                className="rounded-2xl border p-4 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold">{p.point_code}</div>
                    <div className="text-sm text-slate-500">
                      {p.sample_id ? `Sample: ${p.sample_id}` : "No sample"} ·{" "}
                      {getPointPhotoCount(p)} photos
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {formatDate(p.updated_at)}
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                      p.status
                    )}`}
                  >
                    {p.status}
                  </span>
                </div>
              </Link>
            ))}

            {recentPoints.length === 0 && (
              <div className="rounded-2xl border border-dashed p-6 text-center text-slate-500">
                No field updates yet
              </div>
            )}
          </div>
        </section>

        {plannedPoints.length > 0 && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Remaining Planned Points</h2>
                <p className="text-sm text-slate-500">
                  จุดที่ยังไม่ได้เริ่มเก็บข้อมูลภาคสนาม
                </p>
              </div>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                {planned}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {plannedPoints.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${project.id}/points/${p.id}`}
                  className="rounded-2xl border p-4 hover:bg-slate-50"
                >
                  <div className="font-bold">{p.point_code}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Waiting for field visit
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}