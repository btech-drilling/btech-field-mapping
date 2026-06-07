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

    return (
      <div className="rounded-lg border bg-white p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="font-semibold">{title}</div>

          <button
            type="button"
            onClick={() => toggleGroup(layers)}
            className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
          >
            {allOn ? "Hide" : "Show"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          {layers.map((layer) => (
            <label
              key={layer}
              className={`flex items-center gap-2 rounded border px-2 py-1 ${
                visibleLayers.includes(layer)
                  ? "bg-gray-100"
                  : "bg-white text-gray-500"
              }`}
            >
              <input
                type="checkbox"
                checked={visibleLayers.includes(layer)}
                onChange={() => toggleLayer(layer)}
              />
              {getLayerLabel(layer)}
              {loadingLayers[layer] ? "..." : ""}
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex flex-col">
        <div className="border-b bg-white px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link href={`/projects/${projectId}`} className="text-sm underline">
                ← Back to Project
              </Link>

              <h1 className="mt-1 text-xl font-bold">Field Mapping Map</h1>

              <p className="text-sm text-gray-500">
                Points: {showPoints ? filteredPoints.length : 0}/{points.length} |
                Lines: {showLines ? filteredLines.length : 0}/{totalLines} |
                Polygons: {showPolygons ? filteredPolygons.length : 0}/
                {totalPolygons}
              </p>

              {addPointMode && (
                <p className="mt-1 text-sm font-semibold text-emerald-700">
                  Add Point Mode is ON — click anywhere on the map to add a point.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search point code..."
                className="w-64 rounded border px-3 py-2 text-sm"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="rounded border px-3 py-2 text-sm"
                >
                  Clear
                </button>
              )}

              <button
                type="button"
                onClick={() => setAddPointMode((prev) => !prev)}
                className={`rounded px-4 py-2 text-sm font-semibold ${
                  addPointMode
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "border bg-white hover:bg-gray-50"
                }`}
              >
                {addPointMode ? "Add Point Mode: ON" : "Add Point Mode: OFF"}
              </button>

              <Link
                href={`/projects/${projectId}/points`}
                className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Points List
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 p-3 lg:grid-cols-[320px_1fr]">
          <aside className="order-2 rounded-lg border bg-white p-3 lg:order-1">
            <div className="mb-3">
              <div className="mb-2 font-bold">Display</div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <label className="flex items-center gap-2 rounded border px-2 py-2">
                  <input
                    type="checkbox"
                    checked={showPoints}
                    onChange={(e) => setShowPoints(e.target.checked)}
                  />
                  Points
                </label>

                <label className="flex items-center gap-2 rounded border px-2 py-2">
                  <input
                    type="checkbox"
                    checked={showLines}
                    onChange={(e) => setShowLines(e.target.checked)}
                  />
                  Lines
                </label>

                <label className="flex items-center gap-2 rounded border px-2 py-2">
                  <input
                    type="checkbox"
                    checked={showPolygons}
                    onChange={(e) => setShowPolygons(e.target.checked)}
                  />
                  Polygons
                </label>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAllLayers}
                className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Select All
              </button>

              <button
                type="button"
                onClick={clearAllLayers}
                className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={resetDefaultLayers}
                className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
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

          <main className="order-1 overflow-hidden rounded-lg border bg-white lg:order-2">
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