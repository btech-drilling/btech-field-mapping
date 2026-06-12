import { latLonToUTM } from "@/lib/utm";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import DeletePointButton from "./DeletePointButton";

export const dynamic = "force-dynamic";

type GalleryPhoto = {
  url: string;
  label: string;
  description: string;
};

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

function displayValue(value: any) {
  return value === null || value === undefined || value === "" ? "-" : value;
}

function getPointPhotos(point: any): GalleryPhoto[] {
  const photos: GalleryPhoto[] = [];

  if (point.sample_photo_url) {
    photos.push({
      url: point.sample_photo_url,
      label: "Sample Photo",
      description: "",
    });
  }

  if (point.outcrop_photo_url) {
    photos.push({
      url: point.outcrop_photo_url,
      label: "Outcrop Photo",
      description: "",
    });
  }

  if (Array.isArray(point.more_photos)) {
    point.more_photos.forEach((photo: any, index: number) => {
      if (photo?.url) {
        photos.push({
          url: String(photo.url),
          label: `More Photo ${index + 1}`,
          description: String(photo.description ?? ""),
        });
      }
    });
  } else if (Array.isArray(point.photo_urls)) {
    point.photo_urls.forEach((url: string, index: number) => {
      if (url) {
        photos.push({
          url,
          label: `More Photo ${index + 1}`,
          description: "",
        });
      }
    });
  }

  const seen = new Set<string>();

  return photos.filter((photo) => {
    if (seen.has(photo.url)) return false;
    seen.add(photo.url);
    return true;
  });
}

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

  const photos = getPointPhotos(point);

  const hasSample = Boolean(point.sample_id);
  const hasPhotos = photos.length > 0;
  const hasStructure = Boolean(
    point.structure_type || point.strike || point.dip
  );

  const googleMapsUrl =
    point.latitude && point.longitude
      ? `https://www.google.com/maps?q=${point.latitude},${point.longitude}`
      : "#";

  const lat = Number(point.latitude);
  const lon = Number(point.longitude);

  const utm =
    Number.isFinite(lat) && Number.isFinite(lon)
      ? latLonToUTM(lat, lon)
      : null;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6 flex flex-wrap gap-3 text-sm">
          <Link
            href={`/projects/${id}/points`}
            className="text-slate-300 underline"
          >
            ← Back to Points
          </Link>

          <Link
            href={`/projects/${id}/map`}
            className="text-slate-300 underline"
          >
            Back to Map
          </Link>

          <Link href={`/projects/${id}`} className="text-slate-300 underline">
            Project Dashboard
          </Link>
        </div>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-8 shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
                Field Observation
              </div>

              <h1 className="text-5xl font-black tracking-tight">
                {point.point_code}
              </h1>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusStyle(
                    point.status
                  )}`}
                >
                  {point.status ?? "PLANNED"}
                </span>

                {hasSample && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">
                    🧪 Sample: {point.sample_id}
                  </span>
                )}

                {point.rock_type && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">
                    🪨 {point.rock_type}
                  </span>
                )}

                {point.mineralization && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">
                    ⛏ {point.mineralization}
                  </span>
                )}

                {hasPhotos && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">
                    📷 {photos.length} Photos
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/projects/${id}/points/${point.id}/edit`}
                className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 shadow hover:bg-slate-100"
              >
                Edit Record
              </Link>

              <Link
                href={`/projects/${id}/map`}
                className="rounded-xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/10"
              >
                Open Map
              </Link>

              <Link
                href={googleMapsUrl}
                target="_blank"
                className="rounded-xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/10"
              >
                Google Maps
              </Link>

              <DeletePointButton
                projectId={id}
                pointId={point.id}
                from="point"
              />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="grid gap-6">
            <div className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-xl">
              <h2 className="mb-4 text-2xl font-bold">Coordinate</h2>

              <div className="grid gap-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">Latitude</div>
                  <div className="text-xl font-bold">
                    {displayValue(point.latitude)}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">Longitude</div>
                  <div className="text-xl font-bold">
                    {displayValue(point.longitude)}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">UTM Zone</div>
                  <div className="text-xl font-bold">{utm?.zone ?? "-"}</div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">Easting</div>
                  <div className="text-xl font-bold">
                    {utm ? `${utm.easting.toFixed(2)} mE` : "-"}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">Northing</div>
                  <div className="text-xl font-bold">
                    {utm ? `${utm.northing.toFixed(2)} mN` : "-"}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">Elevation</div>
                  <div className="text-xl font-bold">
                    {point.elevation !== null && point.elevation !== undefined
                      ? `${Number(point.elevation).toFixed(2)} m`
                      : "-"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-xl">
              <h2 className="mb-4 text-2xl font-bold">Sample</h2>

              <div className="grid gap-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">Sample ID</div>
                  <div className="text-xl font-bold">
                    {displayValue(point.sample_id)}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">Sample Type</div>
                  <div className="text-xl font-bold">
                    {displayValue(point.sample_type)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-xl">
            <h2 className="mb-5 text-2xl font-bold">Field Summary</h2>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Rock Type", point.rock_type],
                ["Weathering", point.weathering],
                ["Alteration", point.alteration],
                ["Mineralization", point.mineralization],
                ["Structure", point.structure_type],
                ["Objective", point.objective],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">{label}</div>
                  <div className="mt-1 text-lg font-bold">
                    {displayValue(value)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <div className="mb-3 text-sm font-semibold text-slate-500">
                Structural Data
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-sm text-slate-500">Strike</div>
                  <div className="text-lg font-bold">
                    {point.strike !== null && point.strike !== undefined
                      ? `${point.strike}°`
                      : "-"}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-500">Dip</div>
                  <div className="text-lg font-bold">
                    {point.dip !== null && point.dip !== undefined
                      ? `${point.dip}°`
                      : "-"}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-500">Priority</div>
                  <div className="text-lg font-bold">
                    {displayValue(point.priority)}
                  </div>
                </div>
              </div>

              {!hasStructure && (
                <div className="mt-3 text-sm text-slate-400">
                  No structural data recorded
                </div>
              )}
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Field Notes</div>
              <div className="mt-2 whitespace-pre-wrap text-slate-800">
                {displayValue(point.remark)}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Photo Gallery</h2>
              <p className="text-sm text-slate-500">
                Sample, outcrop and additional photos for field verification
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {photos.length} photos
            </span>
          </div>

          {hasPhotos ? (
            <div className="grid gap-5 md:grid-cols-2">
              {photos.map((photo, index) => (
                <a
                  key={`${photo.url}-${index}`}
                  href={photo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-2xl border bg-slate-50"
                >
                  <div className="border-b px-4 py-3 font-bold">
                    {photo.label}
                  </div>

                  <img
                    src={photo.url}
                    alt={photo.label}
                    className="h-[420px] w-full object-contain transition group-hover:scale-[1.01]"
                  />

{photo.description && (
  <div className="border-t bg-white px-4 py-3 text-sm leading-relaxed text-slate-700">
    {photo.description}
  </div>
)}
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-10 text-center text-slate-500">
              No photos uploaded yet
            </div>
          )}
        </section>
      </div>
    </main>
  );
}