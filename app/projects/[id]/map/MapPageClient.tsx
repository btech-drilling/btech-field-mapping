"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";

const MapWrapper = dynamic(() => import("./MapWrapper"), {
  ssr: false,
});

function getLayerLabel(layerName: string) {
  switch (layerName) {
    case "INS_NRT_Explo":
      return "Regional Geology";
    case "ระวางแผนที่":
      return "Map Sheets";
    case "พื้นที่สำรวจ":
      return "Survey Area";
    default:
      return layerName;
  }
}

function isTvLayer(layerName: string) {
  return /^TV\d+$/i.test(layerName);
}

function sortLayerNames(layers: string[]) {
  return [...layers].sort((a, b) => {
    const order = (x: string) => {
      if (x === "INS_NRT_Explo") return 1;
      if (x === "SNI") return 2;
      if (x === "NRT") return 3;
      if (isTvLayer(x)) return 4;
      if (x === "พื้นที่สำรวจ") return 5;
      if (x === "ระวางแผนที่") return 6;
      return 99;
    };

    const oa = order(a);
    const ob = order(b);

    if (oa !== ob) return oa - ob;

    if (isTvLayer(a) && isTvLayer(b)) {
      return Number(a.replace("TV", "")) - Number(b.replace("TV", ""));
    }

    return a.localeCompare(b);
  });
}

async function fetchLayerData(projectId: string, layerName: string) {
  const [linesRes, polygonsRes] = await Promise.all([
    supabase
      .from("mapping_lines")
      .select("id,name,feature_type,geojson,color,layer_name,folder_path")
      .eq("project_id", projectId)
      .eq("layer_name", layerName),

    supabase
      .from("mapping_polygons")
      .select(
        "id,name,feature_type,geojson,stroke_color,fill_color,fill_opacity,style_id,layer_name,folder_path,desc_t1"
      )
      .eq("project_id", projectId)
      .eq("layer_name", layerName),
  ]);

  if (linesRes.error) throw new Error(linesRes.error.message);
  if (polygonsRes.error) throw new Error(polygonsRes.error.message);

  return {
    lines: linesRes.data ?? [],
    polygons: polygonsRes.data ?? [],
  };
}

export default function MapPageClient({
  projectId,
  points,
  initialLayerNames,
  totalLines,
  totalPolygons,
}: {
  projectId: string;
  points: any[];
  initialLayerNames: string[];
  totalLines: number;
  totalPolygons: number;
}) {
  const [search, setSearch] = useState("");
  const [showPoints, setShowPoints] = useState(true);
  const [showLines, setShowLines] = useState(true);
  const [showPolygons, setShowPolygons] = useState(true);
  const [addPointMode, setAddPointMode] = useState(false);

  const [visibleLayers, setVisibleLayers] = useState<string[]>([]);
  const [loadedLayers, setLoadedLayers] = useState<Record<string, boolean>>({});
  const [loadingLayers, setLoadingLayers] = useState<Record<string, boolean>>(
    {}
  );
  const [lines, setLines] = useState<any[]>([]);
  const [polygons, setPolygons] = useState<any[]>([]);

  const layerNames = useMemo(
    () => sortLayerNames(initialLayerNames),
    [initialLayerNames]
  );

  const geologyLayers = useMemo(
    () =>
      layerNames.filter((layer) =>
        ["INS_NRT_Explo", "SNI", "NRT"].includes(layer)
      ),
    [layerNames]
  );

  const tvLayers = useMemo(
    () => layerNames.filter((layer) => isTvLayer(layer)),
    [layerNames]
  );

  const utilityLayers = useMemo(
    () =>
      layerNames.filter((layer) =>
        ["พื้นที่สำรวจ", "ระวางแผนที่"].includes(layer)
      ),
    [layerNames]
  );

  async function loadLayer(layerName: string) {
    if (loadedLayers[layerName] || loadingLayers[layerName]) return;

    setLoadingLayers((prev) => ({ ...prev, [layerName]: true }));

    try {
      const data = await fetchLayerData(projectId, layerName);

      setLines((prev) => [...prev, ...data.lines]);
      setPolygons((prev) => [...prev, ...data.polygons]);
      setLoadedLayers((prev) => ({ ...prev, [layerName]: true }));
    } finally {
      setLoadingLayers((prev) => ({ ...prev, [layerName]: false }));
    }
  }

  async function toggleLayer(layerName: string) {
    if (visibleLayers.includes(layerName)) {
      setVisibleLayers((prev) => prev.filter((x) => x !== layerName));
      return;
    }

    await loadLayer(layerName);
    setVisibleLayers((prev) => [...prev, layerName]);
  }

  async function toggleGroup(group: string[]) {
    const allOn = group.every((layer) => visibleLayers.includes(layer));

    if (allOn) {
      setVisibleLayers((prev) =>
        prev.filter((layer) => !group.includes(layer))
      );
      return;
    }

    await Promise.all(group.map((layer) => loadLayer(layer)));

    setVisibleLayers((prev) => Array.from(new Set([...prev, ...group])));
  }

  async function selectAllLayers() {
    await Promise.all(layerNames.map((layer) => loadLayer(layer)));
    setVisibleLayers(layerNames);
  }

  function clearAllLayers() {
    setVisibleLayers([]);
  }

  function resetDefaultLayers() {
    setVisibleLayers([]);
    setAddPointMode(false);
  }

  const filteredPoints = useMemo(() => {
    const q = search.trim().toLowerCase();

    return points.filter((p) => {
      const matchSearch = !q
        ? true
        : String(p.point_code ?? "").toLowerCase().includes(q);

      const matchLayer = p.layer_name
        ? visibleLayers.includes(p.layer_name)
        : false;

      return matchSearch && matchLayer;
    });
  }, [points, search, visibleLayers]);

  const filteredLines = useMemo(() => {
    return lines.filter((l) =>
      l.layer_name ? visibleLayers.includes(l.layer_name) : false
    );
  }, [lines, visibleLayers]);

  const filteredPolygons = useMemo(() => {
    return polygons.filter((p) =>
      p.layer_name ? visibleLayers.includes(p.layer_name) : false
    );
  }, [polygons, visibleLayers]);

  function renderLayerGroup(title: string, layers: string[]) {
    if (layers.length === 0) return null;

    const allOn = layers.every((layer) => visibleLayers.includes(layer));
    const activeCount = layers.filter((layer) =>
      visibleLayers.includes(layer)
    ).length;

    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3 shadow-lg">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <div className="font-bold text-white">{title}</div>
            <div className="mt-0.5 text-xs text-slate-400">
              {activeCount} / {layers.length} active
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggleGroup(layers)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              allOn
                ? "border-red-400 bg-red-950 text-red-200 hover:bg-red-900"
                : "border-emerald-400 bg-emerald-950 text-emerald-200 hover:bg-emerald-900"
            }`}
          >
            {allOn ? "Hide" : "Show"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          {layers.map((layer) => {
            const active = visibleLayers.includes(layer);

            return (
              <label
                key={layer}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-emerald-400 bg-emerald-950 text-emerald-100 ring-1 ring-emerald-400/30"
                    : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleLayer(layer)}
                  className="accent-emerald-500"
                />
                <span>{getLayerLabel(layer)}</span>
                {loadingLayers[layer] ? (
                  <span className="text-slate-400">...</span>
                ) : null}
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex flex-col">
        <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 px-4 py-4 shadow-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href={`/projects/${projectId}`}
                className="text-sm font-semibold text-emerald-300 underline underline-offset-4 hover:text-emerald-200"
              >
                ← Back to Project
              </Link>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-white">
                Field Mapping Map
              </h1>

              <p className="mt-1 text-sm text-slate-300">
                Points: {showPoints ? filteredPoints.length : 0}/{points.length} |
                Lines: {showLines ? filteredLines.length : 0}/{totalLines} |
                Polygons: {showPolygons ? filteredPolygons.length : 0}/
                {totalPolygons}
              </p>

              {addPointMode && (
                <p className="mt-1 text-sm font-semibold text-emerald-300">
                  Add Point Mode is ON — click anywhere on the map to add a point.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search point code..."
                className="w-64 rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Clear
                </button>
              )}

              <button
                type="button"
                onClick={() => setAddPointMode((prev) => !prev)}
                className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                  addPointMode
                    ? "border-emerald-400 bg-emerald-950 text-emerald-200 ring-1 ring-emerald-400/40 hover:bg-emerald-900"
                    : "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
                }`}
              >
                {addPointMode ? "Add Point Mode: ON" : "Add Point Mode: OFF"}
              </button>

              <Link
                href={`/projects/${projectId}/points`}
                className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
              >
                Points List
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 p-3 lg:grid-cols-[320px_1fr]">
          <aside className="order-2 rounded-3xl border border-slate-700 bg-slate-900 p-3 shadow-2xl lg:order-1">
            <div className="mb-3 rounded-2xl border border-slate-700 bg-slate-950 p-3">
              <div className="mb-2 font-bold text-white">Display</div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <label
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-2 py-2 text-xs font-bold transition ${
                    showPoints
                      ? "border-emerald-400 bg-emerald-950 text-emerald-100"
                      : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={showPoints}
                    onChange={(e) => setShowPoints(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  Points
                </label>

                <label
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-2 py-2 text-xs font-bold transition ${
                    showLines
                      ? "border-emerald-400 bg-emerald-950 text-emerald-100"
                      : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={showLines}
                    onChange={(e) => setShowLines(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  Lines
                </label>

                <label
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-2 py-2 text-xs font-bold transition ${
                    showPolygons
                      ? "border-emerald-400 bg-emerald-950 text-emerald-100"
                      : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={showPolygons}
                    onChange={(e) => setShowPolygons(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  Polygons
                </label>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAllLayers}
                className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-bold text-white hover:bg-slate-700"
              >
                Select All
              </button>

              <button
                type="button"
                onClick={clearAllLayers}
                className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-bold text-white hover:bg-slate-700"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={resetDefaultLayers}
                className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-bold text-white hover:bg-slate-700"
              >
                Default
              </button>
            </div>

            <div className="grid gap-3">
              {renderLayerGroup("Geology", geologyLayers)}
              {renderLayerGroup("Survey / Map", utilityLayers)}
              {renderLayerGroup("TV Layers", tvLayers)}
            </div>
          </aside>

          <main className="order-1 overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 p-3 shadow-2xl lg:order-2">
            <MapWrapper
              projectId={projectId}
              points={filteredPoints}
              lines={filteredLines}
              polygons={filteredPolygons}
              showPoints={showPoints}
              showLines={showLines}
              showPolygons={showPolygons}
              addPointMode={addPointMode}
            />
          </main>
        </div>
      </div>
    </div>
  );
}