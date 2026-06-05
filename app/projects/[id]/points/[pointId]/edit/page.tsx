"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function EditPointPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = String(params.id);
  const pointId = String(params.pointId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSample, setUploadingSample] = useState(false);
  const [uploadingOutcrop, setUploadingOutcrop] = useState(false);

  const [pointCode, setPointCode] = useState("");
  const [status, setStatus] = useState("PLANNED");
  const [targetObjective, setTargetObjective] = useState("");

  const [rockType, setRockType] = useState("");
  const [rockTypeOther, setRockTypeOther] = useState("");
  const [weathering, setWeathering] = useState("");

  const [alteration, setAlteration] = useState("");
  const [alterationOther, setAlterationOther] = useState("");

  const [mineralization, setMineralization] = useState("");
  const [mineralizationOther, setMineralizationOther] = useState("");

  const [structureType, setStructureType] = useState("");
  const [structureTypeOther, setStructureTypeOther] = useState("");

  const [strike, setStrike] = useState("");
  const [dip, setDip] = useState("");
  const [sampleId, setSampleId] = useState("");
  const [sampleType, setSampleType] = useState("");
  const [samplePhotoUrl, setSamplePhotoUrl] = useState("");
  const [outcropPhotoUrl, setOutcropPhotoUrl] = useState("");
  const [remark, setRemark] = useState("");
  const [message, setMessage] = useState("");

  const rockTypeOptions = [
    "Granite",
    "Granodiorite",
    "Diorite",
    "Andesite",
    "Basalt",
    "Rhyolite",
    "Tuff",
    "Sandstone",
    "Siltstone",
    "Shale",
    "Limestone",
    "Chert",
    "Slate",
    "Phyllite",
    "Schist",
    "Quartzite",
    "Marble",
    "Quartz Vein",
    "Skarn",
  ];

  const alterationOptions = [
    "Silicification",
    "Argillic",
    "Advanced Argillic",
    "Propylitic",
    "Chloritization",
    "Sericitization",
    "Potassic",
    "Kaolinization",
    "Carbonatization",
    "Oxidation",
    "No Alteration",
  ];

  const mineralizationOptions = [
    "Pyrite",
    "Chalcopyrite",
    "Galena",
    "Sphalerite",
    "Magnetite",
    "Hematite",
    "Malachite",
    "Quartz Vein",
    "Sulfide Veinlet",
    "Disseminated Sulfide",
    "No Mineralization",
  ];

  const structureOptions = [
    "Fault",
    "Joint",
    "Fracture",
    "Vein",
    "Contact",
    "Bedding",
    "Foliation",
    "Shear Zone",
    "Breccia Zone",
    "Fold",
    "No Structure",
  ];

  useEffect(() => {
    async function loadPoint() {
      setLoading(true);

      const { data, error } = await supabase
        .from("mapping_points")
        .select("*")
        .eq("id", pointId)
        .eq("project_id", projectId)
        .single();

      if (error || !data) {
        setMessage("Point not found");
        setLoading(false);
        return;
      }

      setPointCode(data.point_code ?? "");
      setStatus(data.status ?? "PLANNED");
      setTargetObjective(data.objective ?? "");

      setRockType(
        data.rock_type
          ? rockTypeOptions.includes(data.rock_type)
            ? data.rock_type
            : "Other"
          : ""
      );
      setRockTypeOther(
        data.rock_type && !rockTypeOptions.includes(data.rock_type)
          ? data.rock_type
          : ""
      );

      setWeathering(data.weathering ?? "");

      setAlteration(
        data.alteration
          ? alterationOptions.includes(data.alteration)
            ? data.alteration
            : "Other"
          : ""
      );
      setAlterationOther(
        data.alteration && !alterationOptions.includes(data.alteration)
          ? data.alteration
          : ""
      );

      setMineralization(
        data.mineralization
          ? mineralizationOptions.includes(data.mineralization)
            ? data.mineralization
            : "Other"
          : ""
      );
      setMineralizationOther(
        data.mineralization &&
          !mineralizationOptions.includes(data.mineralization)
          ? data.mineralization
          : ""
      );

      setStructureType(
        data.structure_type
          ? structureOptions.includes(data.structure_type)
            ? data.structure_type
            : "Other"
          : ""
      );
      setStructureTypeOther(
        data.structure_type && !structureOptions.includes(data.structure_type)
          ? data.structure_type
          : ""
      );

      setStrike(data.strike?.toString() ?? "");
      setDip(data.dip?.toString() ?? "");
      setSampleId(data.sample_id ?? "");
      setSampleType(data.sample_type ?? "");
      setSamplePhotoUrl(data.sample_photo_url ?? "");
      setOutcropPhotoUrl(data.outcrop_photo_url ?? "");
      setRemark(data.remark ?? "");

      setLoading(false);
    }

    loadPoint();
  }, [pointId, projectId]);

  async function uploadPhoto(file: File, type: "sample" | "outcrop") {
    if (type === "sample") setUploadingSample(true);
    if (type === "outcrop") setUploadingOutcrop(true);

    setMessage("Uploading photo...");

    const fileExt = file.name.split(".").pop() || "jpg";
    const filePath = `projects/${projectId}/points/${pointId}/${type}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("mapping-photos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      setMessage("Upload error: " + uploadError.message);
      setUploadingSample(false);
      setUploadingOutcrop(false);
      return;
    }

    const { data } = supabase.storage
      .from("mapping-photos")
      .getPublicUrl(filePath);

    if (type === "sample") setSamplePhotoUrl(data.publicUrl);
    if (type === "outcrop") setOutcropPhotoUrl(data.publicUrl);

    setMessage("Photo uploaded. Please save field record.");
    setUploadingSample(false);
    setUploadingOutcrop(false);
  }

  async function savePoint(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("Saving...");

    const strikeValue = strike.trim() === "" ? null : Number(strike);
    const dipValue = dip.trim() === "" ? null : Number(dip);

    if (
      (strike.trim() !== "" && Number.isNaN(strikeValue)) ||
      (dip.trim() !== "" && Number.isNaN(dipValue))
    ) {
      setMessage("Strike / Dip must be number");
      setSaving(false);
      return;
    }

    const finalRockType =
      rockType === "Other" ? rockTypeOther.trim() : rockType;

    const finalAlteration =
      alteration === "Other" ? alterationOther.trim() : alteration;

    const finalMineralization =
      mineralization === "Other"
        ? mineralizationOther.trim()
        : mineralization;

    const finalStructureType =
      structureType === "Other"
        ? structureTypeOther.trim()
        : structureType;

    const { error } = await supabase
      .from("mapping_points")
      .update({
        status,
        objective: targetObjective || null,
        rock_type: finalRockType || null,
        weathering: weathering || null,
        alteration: finalAlteration || null,
        mineralization: finalMineralization || null,
        structure_type: finalStructureType || null,
        strike: strikeValue,
        dip: dipValue,
        sample_id: sampleId || null,
        sample_type: sampleType || null,
        sample_photo_url: samplePhotoUrl || null,
        outcrop_photo_url: outcropPhotoUrl || null,
        remark: remark || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pointId)
      .eq("project_id", projectId);

    if (error) {
      setMessage("Error: " + error.message);
      setSaving(false);
      return;
    }

  router.push(
  `/projects/${projectId}/points/${pointId}`
);

  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
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

    <Link
      href={`/projects/${projectId}/points/${pointId}`}
      className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
    >
      Back to Point
    </Link>
  </div>

      <h1 className="mt-4 text-2xl font-bold">Edit Field Record</h1>
      <p className="text-gray-500 mb-6">{pointCode}</p>

      <form onSubmit={savePoint} className="grid gap-4">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded p-3">
          <option value="PLANNED">PLANNED</option>
          <option value="VISITED">VISITED</option>
          <option value="SAMPLED">SAMPLED</option>
          <option value="NEED_REVISIT">NEED_REVISIT</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>

        <select value={targetObjective} onChange={(e) => setTargetObjective(e.target.value)} className="border rounded p-3">
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

        <select value={rockType} onChange={(e) => setRockType(e.target.value)} className="border rounded p-3">
          <option value="">Rock Type</option>
          {rockTypeOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          <option value="Other">Other</option>
        </select>

        {rockType === "Other" && (
          <input value={rockTypeOther} onChange={(e) => setRockTypeOther(e.target.value)} placeholder="Specify Rock Type" className="border rounded p-3" />
        )}

        <select value={weathering} onChange={(e) => setWeathering(e.target.value)} className="border rounded p-3">
          <option value="">Weathering</option>
          <option value="Fresh">Fresh</option>
          <option value="Slightly Weathered">Slightly Weathered</option>
          <option value="Moderately Weathered">Moderately Weathered</option>
          <option value="Highly Weathered">Highly Weathered</option>
          <option value="Completely Weathered">Completely Weathered</option>
        </select>

        <select value={alteration} onChange={(e) => setAlteration(e.target.value)} className="border rounded p-3">
          <option value="">Alteration</option>
          {alterationOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          <option value="Other">Other</option>
        </select>

        {alteration === "Other" && (
          <input value={alterationOther} onChange={(e) => setAlterationOther(e.target.value)} placeholder="Specify Alteration" className="border rounded p-3" />
        )}

        <select value={mineralization} onChange={(e) => setMineralization(e.target.value)} className="border rounded p-3">
          <option value="">Mineralization</option>
          {mineralizationOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          <option value="Other">Other</option>
        </select>

        {mineralization === "Other" && (
          <input value={mineralizationOther} onChange={(e) => setMineralizationOther(e.target.value)} placeholder="Specify Mineralization" className="border rounded p-3" />
        )}

        <select value={structureType} onChange={(e) => setStructureType(e.target.value)} className="border rounded p-3">
          <option value="">Structure</option>
          {structureOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          <option value="Other">Other</option>
        </select>

        {structureType === "Other" && (
          <input value={structureTypeOther} onChange={(e) => setStructureTypeOther(e.target.value)} placeholder="Specify Structure" className="border rounded p-3" />
        )}

        <div className="grid grid-cols-2 gap-4">
          <input value={strike} onChange={(e) => setStrike(e.target.value)} placeholder="Strike" className="border rounded p-3" />
          <input value={dip} onChange={(e) => setDip(e.target.value)} placeholder="Dip" className="border rounded p-3" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input value={sampleId} onChange={(e) => setSampleId(e.target.value)} placeholder="Sample ID" className="border rounded p-3" />

          <select value={sampleType} onChange={(e) => setSampleType(e.target.value)} className="border rounded p-3">
            <option value="">Sample Type</option>
            <option value="Grab">Grab</option>
            <option value="Rock Chip">Rock Chip</option>
            <option value="Channel">Channel</option>
            <option value="Float">Float</option>
            <option value="Soil">Soil</option>
            <option value="Stream Sediment">Stream Sediment</option>
          </select>
        </div>

        <div className="border rounded p-4">
          <div className="font-semibold mb-2">Sample Photo</div>
          {samplePhotoUrl && <img src={samplePhotoUrl} alt="Sample" className="mb-3 max-h-64 rounded border object-cover" />}
          <input type="file" accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadPhoto(file, "sample");
          }} />
          {uploadingSample && <div className="mt-2 text-sm text-gray-500">Uploading sample photo...</div>}
        </div>

        <div className="border rounded p-4">
          <div className="font-semibold mb-2">Outcrop Photo</div>
          {outcropPhotoUrl && <img src={outcropPhotoUrl} alt="Outcrop" className="mb-3 max-h-64 rounded border object-cover" />}
          <input type="file" accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadPhoto(file, "outcrop");
          }} />
          {uploadingOutcrop && <div className="mt-2 text-sm text-gray-500">Uploading outcrop photo...</div>}
        </div>

        <textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Remark" rows={4} className="border rounded p-3" />

        <button type="submit" disabled={saving || uploadingSample || uploadingOutcrop} className="rounded bg-black px-4 py-3 text-white disabled:opacity-50">
          {saving ? "Saving..." : "Save Field Record"}
        </button>

        {message && <div className="border rounded p-3">{message}</div>}
      </form>
    </div>
  );
}