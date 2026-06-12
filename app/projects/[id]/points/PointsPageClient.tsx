"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type MorePhoto = {
  url: string;
  description?: string;
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

function getPointPhotos(p: any) {
  const photos: { url: string; label: string; description: string }[] = [];

  if (p.outcrop_photo_url) {
    photos.push({
      url: p.outcrop_photo_url,
      label: "Outcrop Photo",
      description: "",
    });
  }

  if (p.sample_photo_url) {
    photos.push({
      url: p.sample_photo_url,
      label: "Sample Photo",
      description: "",
    });
  }

  if (Array.isArray(p.more_photos)) {
    p.more_photos.forEach((photo: MorePhoto, index: number) => {
      if (photo?.url) {
        photos.push({
          url: String(photo.url),
          label: `More Photo ${index + 1}`,
          description: String(photo.description ?? ""),
        });
      }
    });
  } else if (Array.isArray(p.photo_urls)) {
    p.photo_urls.forEach((url: string, index: number) => {
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

export default function PointsPageClient({
  projectId,
  points,
}: {
  projectId: string;
  points: any[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sampleOnly, setSampleOnly] = useState(false);
  const [photoOnly, setPhotoOnly] = useState(false);

  const filteredPoints = useMemo(() => {
    const q = search.trim().toLowerCase();

    return points.filter((p) => {
      const photos = getPointPhotos(p);

      const matchSearch =
        !q ||
        String(p.point_code ?? "").toLowerCase().includes(q) ||
        String(p.sample_id ?? "").toLowerCase().includes(q) ||
        String(p.rock_type ?? "").toLowerCase().includes(q) ||
        photos.some((photo) =>
          photo.description.toLowerCase().includes(q)
        );

      const matchStatus = status === "ALL" || p.status === status;
      const matchSample = !sampleOnly || Boolean(p.sample_id);
      const matchPhoto = !photoOnly || photos.length > 0;

      return matchSearch && matchStatus && matchSample && matchPhoto;
    });
  }, [points, search, status, sampleOnly, photoOnly]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6 flex flex-wrap gap-2">
          <Link href={`/projects/${projectId}`} className="text-sm underline">
            ← Project Dashboard
          </Link>

          <Link
            href={`/projects/${projectId}/map`}
            className="text-sm underline"
          >
            Back to Map
          </Link>
        </div>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-8 shadow-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
                Field Records
              </div>

              <h1 className="text-4xl font-black">Mapping Points</h1>

              <p className="mt-2 text-slate-300">
                Showing {filteredPoints.length} / {points.length} points
              </p>
            </div>

            <Link
              href={`/projects/${projectId}/map`}
              className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 hover:bg-slate-100"
            >
              Open Map
            </Link>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_180px_120px_120px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search point / sample / rock type / photo description..."
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400"
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white"
            >
              <option value="ALL">All Status</option>
              <option value="PLANNED">PLANNED</option>
              <option value="VISITED">VISITED</option>
              <option value="SAMPLED">SAMPLED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="NEED_REVISIT">NEED_REVISIT</option>
            </select>

            <button
              type="button"
              onClick={() => setSampleOnly(!sampleOnly)}
              className={`rounded-xl border px-4 py-3 text-sm ${
                sampleOnly
                  ? "border-emerald-400 bg-emerald-400/20 text-emerald-200"
                  : "border-white/10 bg-white/10 text-white"
              }`}
            >
              Sample Only
            </button>

            <button
              type="button"
              onClick={() => setPhotoOnly(!photoOnly)}
              className={`rounded-xl border px-4 py-3 text-sm ${
                photoOnly
                  ? "border-emerald-400 bg-emerald-400/20 text-emerald-200"
                  : "border-white/10 bg-white/10 text-white"
              }`}
            >
              Photo Only
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-4">
          {filteredPoints.map((p) => {
            const photos = getPointPhotos(p);
            const mainPhoto = photos[0];
            const firstDescription = photos.find(
              (photo) => photo.description.trim() !== ""
            )?.description;

            return (
              <div
                key={p.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white text-slate-950 shadow-xl"
              >
                <div className="grid gap-0 md:grid-cols-[180px_1fr_auto]">
                  <Link
                    href={`/projects/${projectId}/points/${p.id}`}
                    className="block bg-slate-100"
                  >
                    {mainPhoto ? (
                      <div className="relative grid h-full min-h-40 grid-cols-2 gap-1 p-1">
                        {photos.slice(0, 4).map((photo, index) => (
                          <div
                            key={`${photo.url}-${index}`}
                            className={`relative overflow-hidden rounded-xl bg-slate-200 ${
                              photos.length === 1 ? "col-span-2 row-span-2" : ""
                            }`}
                          >
                            <img
                              src={photo.url}
                              alt={`${p.point_code ?? "point"} photo ${
                                index + 1
                              }`}
                              className="h-full min-h-20 w-full object-cover"
                            />

                            {index === 3 && photos.length > 4 && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-black text-white">
                                +{photos.length - 4}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-full min-h-40 items-center justify-center text-sm text-slate-400">
                        No Photo
                      </div>
                    )}
                  </Link>

                  <Link
                    href={`/projects/${projectId}/points/${p.id}`}
                    className="block p-5 hover:bg-slate-50"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black">{p.point_code}</h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                          p.status
                        )}`}
                      >
                        {p.status ?? "PLANNED"}
                      </span>

                      {p.sample_id && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          Sample: {p.sample_id}
                        </span>
                      )}

                      {photos.length > 0 && (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Photos: {photos.length}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid gap-1 text-sm text-slate-600 md:grid-cols-2">
                      <div>Rock Type: {p.rock_type ?? "-"}</div>
                      <div>Weathering: {p.weathering ?? "-"}</div>
                      <div>Alteration: {p.alteration ?? "-"}</div>
                      <div>Mineralization: {p.mineralization ?? "-"}</div>
                      <div>Lat: {p.latitude ?? "-"}</div>
                      <div>Lon: {p.longitude ?? "-"}</div>
                    </div>

                    {firstDescription && (
                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                        <div className="mb-1 font-semibold text-slate-500">
                          Photo Note
                        </div>
                        <div className="line-clamp-2">{firstDescription}</div>
                      </div>
                    )}
                  </Link>

                  <div className="grid gap-2 border-t bg-slate-50 p-4 md:w-44 md:border-l md:border-t-0">
                    <Link
                      href={`/projects/${projectId}/points/${p.id}`}
                      className="rounded-xl border bg-white px-4 py-2 text-center text-sm font-semibold hover:bg-slate-50"
                    >
                      View
                    </Link>

                    <Link
                      href={`/projects/${projectId}/points/${p.id}/edit`}
                      className="rounded-xl bg-slate-950 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredPoints.length === 0 && (
            <div className="rounded-3xl border border-dashed border-white/20 p-10 text-center text-slate-300">
              No matching points
            </div>
          )}
        </section>
      </div>
    </main>
  );
}