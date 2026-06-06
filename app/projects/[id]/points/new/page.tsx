"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { latLonToUTM, utmToLatLon } from "@/lib/utm";

export default function NewPointPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const projectId = String(params.id);
  const from = searchParams.get("from");

  const latFromMap = searchParams.get("lat") ?? "";
  const lonFromMap = searchParams.get("lon") ?? "";

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [pointCode, setPointCode] = useState("");
  const [status, setStatus] = useState("PLANNED");
  const [targetObjective, setTargetObjective] = useState("");
const [layerOptions, setLayerOptions] = useState<string[]>([]);
const [layerName, setLayerName] = useState("");
const [useNewLayer, setUseNewLayer] = useState(false);
const [newLayerName, setNewLayerName] = useState("");

  const [latitude, setLatitude] = useState(latFromMap);
  const [longitude, setLongitude] = useState(lonFromMap);

  const [utmZone, setUtmZone] = useState("");
  const [utmEasting, setUtmEasting] = useState("");
  const [utmNorthing, setUtmNorthing] = useState("");

  const [rockType, setRockType] = useState("");
  const [weathering, setWeathering] = useState("");
  const [alteration, setAlteration] = useState("");
  const [mineralization, setMineralization] = useState("");
  const [structureType, setStructureType] = useState("");
  const [sampleId, setSampleId] = useState("");
  const [sampleType, setSampleType] = useState("");
  const [remark, setRemark] = useState("");

  useEffect(() => {
    const latNumber = Number(latFromMap);
    const lonNumber = Number(lonFromMap);

    if (Number.isFinite(latNumber) && Number.isFinite(lonNumber)) {
      try {
        const utm = latLonToUTM(latNumber, lonNumber);
        setUtmZone(utm.zone);
        setUtmEasting(Math.round(utm.easting).toString());
        setUtmNorthing(Math.round(utm.northing).toString());
      } catch {
        setUtmZone("");
        setUtmEasting("");
        setUtmNorthing("");
      }
    }
  }, [latFromMap, lonFromMap]);

useEffect(() => {
  async function loadLayerOptions() {
    const { data, error } = await supabase
      .from("mapping_points")
      .select("layer_name")
      .eq("project_id", projectId)
      .not("layer_name", "is", null);

    if (error) {
      console.error("Load layer options error:", error.message);
      return;
    }

    const uniqueLayers = Array.from(
      new Set(
        (data ?? [])
          .map((item) => String(item.layer_name ?? "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => {
      const getTvNumber = (value: string) => {
        const match = value.match(/^TV(\d+)$/i);
        return match ? Number(match[1]) : null;
      };

      const aTv = getTvNumber(a);
      const bTv = getTvNumber(b);

      if (aTv !== null && bTv !== null) return aTv - bTv;
      if (aTv !== null) return -1;
      if (bTv !== null) return 1;

      return a.localeCompare(b);
    });

    setLayerOptions(uniqueLayers);
  }

  loadLayerOptions();
}, [projectId]);


  async function savePoint(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("Saving...");

    if (!pointCode.trim()) {
      setMessage("Point Code is required.");
      setSaving(false);
      return;
    }
const finalLayerName = useNewLayer
  ? newLayerName.trim().toUpperCase()
  : layerName.trim();

if (!finalLayerName) {
  setMessage("Please select or create Layer / Group.");
  setSaving(false);
  return;
}

    const eastingValue = Number(utmEasting);
    const northingValue = Number(utmNorthing);
    const zoneValue = utmZone.trim().toUpperCase();

    let finalLatitude = latitude.trim() === "" ? null : Number(latitude);
    let finalLongitude = longitude.trim() === "" ? null : Number(longitude);

    if (zoneValue || utmEasting.trim() || utmNorthing.trim()) {
      if (
        !zoneValue ||
        Number.isNaN(eastingValue) ||
        Number.isNaN(northingValue)
      ) {
        setMessage("UTM Zone / Easting / Northing must be valid.");
        setSaving(false);
        return;
      }

      try {
        const converted = utmToLatLon(eastingValue, northingValue, zoneValue);
        finalLatitude = converted.latitude;
        finalLongitude = converted.longitude;
      } catch (error: any) {
        setMessage("UTM error: " + error.message);
        setSaving(false);
        return;
      }
    }

    if (
      finalLatitude === null ||
      Number.isNaN(finalLatitude) ||
      finalLatitude < -90 ||
      finalLatitude > 90
    ) {
      setMessage("Latitude must be valid.");
      setSaving(false);
      return;
    }

    if (
      finalLongitude === null ||
      Number.isNaN(finalLongitude) ||
      finalLongitude < -180 ||
      finalLongitude > 180
    ) {
      setMessage("Longitude must be valid.");
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("mapping_points")
.insert({
  project_id: projectId,
  point_code: pointCode.trim(),
  status,
  objective: targetObjective || null,
  latitude: finalLatitude,
  longitude: finalLongitude,
  layer_name: finalLayerName,
  rock_type: rockType || null,
  weathering: weathering || null,
  alteration: alteration || null,
  mineralization: mineralization || null,
  structure_type: structureType || null,
  sample_id: sampleId || null,
  sample_type: sampleType || null,
  remark: remark || null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})
      .select("id")
      .single();

    if (error) {
      setMessage("Error: " + error.message);
      setSaving(false);
      return;
    }

if (from === "map") {
  window.location.href = `/projects/${projectId}/map?refresh=${Date.now()}`;
} else {
  router.push(`/projects/${projectId}/points/${data.id}`);
}
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={`/projects/${projectId}/map`}
          className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
        >
          ← Back to Map
        </Link>

        <Link
          href={`/projects/${projectId}`}
          className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Back to Project
        </Link>
      </div>

      <h1 className="mt-4 text-2xl font-bold">Add New Point</h1>
      <p className="mb-6 text-gray-500">Create new field observation point</p>

      <form onSubmit={savePoint} className="grid gap-4">
        <input
          value={pointCode}
          onChange={(e) => setPointCode(e.target.value)}
          placeholder="Point Code เช่น P001"
          className="border rounded p-3"
           />

<div className="rounded border bg-gray-50 p-4">
  <div className="mb-3 font-semibold">Layer / Group</div>

  <select
    value={useNewLayer ? "__NEW__" : layerName}
    onChange={(e) => {
      if (e.target.value === "__NEW__") {
        setUseNewLayer(true);
        setLayerName("");
      } else {
        setUseNewLayer(false);
        setLayerName(e.target.value);
        setNewLayerName("");
      }
    }}
    className="w-full border rounded p-3"
  >
    <option value="">Select Layer / Group</option>

    {layerOptions.map((layer) => (
      <option key={layer} value={layer}>
        {layer}
      </option>
    ))}

    <option value="__NEW__">+ Create New Layer</option>
  </select>

  {useNewLayer && (
    <input
      value={newLayerName}
      onChange={(e) => setNewLayerName(e.target.value.toUpperCase())}
      placeholder="New Layer Name เช่น TV28"
      className="mt-3 w-full border rounded p-3"
    />
  )}

  <div className="mt-2 text-xs text-gray-500">
    เลือก layer ที่มีอยู่ หรือสร้าง layer ใหม่ เช่น TV28
  </div>
</div>

        <div className="rounded border bg-gray-50 p-4">
          <div className="mb-3 font-semibold">Location / UTM</div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="Latitude"
              className="border rounded p-3"
            />

            <input
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="Longitude"
              className="border rounded p-3"
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              value={utmZone}
              onChange={(e) => setUtmZone(e.target.value.toUpperCase())}
              placeholder="UTM Zone เช่น 47P"
              className="border rounded p-3"
            />

            <input
              value={utmEasting}
              onChange={(e) => setUtmEasting(e.target.value)}
              placeholder="Easting"
              className="border rounded p-3"
            />

            <input
              value={utmNorthing}
              onChange={(e) => setUtmNorthing(e.target.value)}
              placeholder="Northing"
              className="border rounded p-3"
            />
          </div>

          <div className="mt-2 text-xs text-gray-500">
            ถ้าแก้ค่า UTM ระบบจะใช้ UTM แปลงกลับเป็น Latitude / Longitude ตอนกด Save
          </div>
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded p-3"
        >
          <option value="PLANNED">PLANNED</option>
          <option value="VISITED">VISITED</option>
          <option value="SAMPLED">SAMPLED</option>
          <option value="NEED_REVISIT">NEED_REVISIT</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>

        <select
          value={targetObjective}
          onChange={(e) => setTargetObjective(e.target.value)}
          className="border rounded p-3"
        >
          <option value="">Target Objective</option>
          <option value="Normal">Normal</option>
          <option value="Fault">Fault</option>
          <option value="Boundary + Contact">Boundary + Contact</option>
          <option value="Fault + Boundary">Fault + Boundary</option>
          <option value="Mineralization">Mineralization</option>
          <option value="Alteration">Alteration</option>
          <option value="Lithology">Lithology</option>
          <option value="Follow-up">Follow-up</option>
          <option value="Verification">Verification</option>
        </select>

        <input
          value={rockType}
          onChange={(e) => setRockType(e.target.value)}
          placeholder="Rock Type"
          className="border rounded p-3"
        />

        <select
          value={weathering}
          onChange={(e) => setWeathering(e.target.value)}
          className="border rounded p-3"
        >
          <option value="">Weathering</option>
          <option value="Fresh">Fresh</option>
          <option value="Slightly Weathered">Slightly Weathered</option>
          <option value="Moderately Weathered">Moderately Weathered</option>
          <option value="Highly Weathered">Highly Weathered</option>
          <option value="Completely Weathered">Completely Weathered</option>
        </select>

        <input
          value={alteration}
          onChange={(e) => setAlteration(e.target.value)}
          placeholder="Alteration"
          className="border rounded p-3"
        />

        <input
          value={mineralization}
          onChange={(e) => setMineralization(e.target.value)}
          placeholder="Mineralization"
          className="border rounded p-3"
        />

        <input
          value={structureType}
          onChange={(e) => setStructureType(e.target.value)}
          placeholder="Structure Type"
          className="border rounded p-3"
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            value={sampleId}
            onChange={(e) => setSampleId(e.target.value)}
            placeholder="Sample ID"
            className="border rounded p-3"
          />

          <select
            value={sampleType}
            onChange={(e) => setSampleType(e.target.value)}
            className="border rounded p-3"
          >
            <option value="">Sample Type</option>
            <option value="Grab">Grab</option>
            <option value="Rock Chip">Rock Chip</option>
            <option value="Channel">Channel</option>
            <option value="Float">Float</option>
            <option value="Soil">Soil</option>
            <option value="Stream Sediment">Stream Sediment</option>
          </select>
        </div>

        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Remark"
          rows={4}
          className="border rounded p-3"
        />

        <button
          type="submit"
          disabled={saving}
          className="rounded bg-black px-4 py-3 text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save New Point"}
        </button>

        {message && <div className="border rounded p-3">{message}</div>}
      </form>
    </div>
  );
}