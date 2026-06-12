"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { latLonToUTM, utmToLatLon } from "@/lib/utm";
import DeletePointButton from "../DeletePointButton";

type MorePhoto = {
  url: string;
  description: string;
};

export default function EditPointPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const projectId = String(params.id);
  const pointId = String(params.pointId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSample, setUploadingSample] = useState(false);
  const [uploadingOutcrop, setUploadingOutcrop] = useState(false);
  const [uploadingMorePhotos, setUploadingMorePhotos] = useState(false);

  const [pointCode, setPointCode] = useState("");
  const [status, setStatus] = useState("PLANNED");
  const [targetObjective, setTargetObjective] = useState("");

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [utmZone, setUtmZone] = useState("");
  const [utmEasting, setUtmEasting] = useState("");
  const [utmNorthing, setUtmNorthing] = useState("");

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
  const [morePhotos, setMorePhotos] = useState<MorePhoto[]>([]);
  const [remark, setRemark] = useState("");
  const [message, setMessage] = useState("");

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  const cardClass =
    "rounded-3xl border border-slate-200 bg-white p-6 text-slate-950 shadow-xl";

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

      const latValue =
        data.latitude === null || data.latitude === undefined
          ? ""
          : String(data.latitude);

      const lonValue =
        data.longitude === null || data.longitude === undefined
          ? ""
          : String(data.longitude);

      setLatitude(latValue);
      setLongitude(lonValue);

      const latNumber = Number(data.latitude);
      const lonNumber = Number(data.longitude);

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

      if (Array.isArray(data.more_photos)) {
        setMorePhotos(
          data.more_photos
            .filter((photo: any) => photo?.url)
            .map((photo: any) => ({
              url: String(photo.url),
              description: String(photo.description ?? ""),
            }))
        );
      } else if (Array.isArray(data.photo_urls)) {
        setMorePhotos(
          data.photo_urls
            .filter(Boolean)
            .map((url: string) => ({
              url,
              description: "",
            }))
        );
      } else {
        setMorePhotos([]);
      }

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

  async function uploadMorePhotos(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploadingMorePhotos(true);
    setMessage("Uploading photos...");

    const uploadedPhotos: MorePhoto[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop() || "jpg";
      const filePath = `projects/${projectId}/points/${pointId}/more-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("mapping-photos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setMessage("Upload error: " + uploadError.message);
        continue;
      }

      const { data } = supabase.storage
        .from("mapping-photos")
        .getPublicUrl(filePath);

      if (data.publicUrl) {
        uploadedPhotos.push({
          url: data.publicUrl,
          description: "",
        });
      }
    }

    if (uploadedPhotos.length > 0) {
      setMorePhotos((prev) => [...prev, ...uploadedPhotos]);
      setMessage("Photos uploaded. Please add description and save field record.");
    } else {
      setMessage("No photos uploaded.");
    }

    setUploadingMorePhotos(false);
  }

  function updateMorePhotoDescription(index: number, description: string) {
    setMorePhotos((prev) =>
      prev.map((photo, i) =>
        i === index ? { ...photo, description } : photo
      )
    );
  }

  function removeMorePhoto(index: number) {
    setMorePhotos((prev) => prev.filter((_, i) => i !== index));
    setMessage("Photo removed. Please save field record.");
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
      finalLatitude !== null &&
      (Number.isNaN(finalLatitude) || finalLatitude < -90 || finalLatitude > 90)
    ) {
      setMessage("Latitude must be between -90 and 90.");
      setSaving(false);
      return;
    }

    if (
      finalLongitude !== null &&
      (Number.isNaN(finalLongitude) ||
        finalLongitude < -180 ||
        finalLongitude > 180)
    ) {
      setMessage("Longitude must be between -180 and 180.");
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
      structureType === "Other" ? structureTypeOther.trim() : structureType;

    const cleanMorePhotos = morePhotos
      .filter((photo) => photo.url)
      .map((photo) => ({
        url: photo.url,
        description: photo.description?.trim() ?? "",
      }));

    const { error } = await supabase
      .from("mapping_points")
      .update({
        status,
        latitude: finalLatitude,
        longitude: finalLongitude,
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
        more_photos: cleanMorePhotos,
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

    if (from === "map") {
      window.location.href = `/projects/${projectId}/map?refresh=${Date.now()}`;
    } else {
      router.push(`/projects/${projectId}/points/${pointId}`);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-6 flex flex-wrap gap-3 text-sm">
          <Link
            href={`/projects/${projectId}/map`}
            className="rounded-xl border border-white/20 px-4 py-2 font-semibold text-slate-200 hover:bg-white/10"
          >
            ← Back to Map
          </Link>

          <Link
            href={`/projects/${projectId}`}
            className="rounded-xl border border-white/20 px-4 py-2 font-semibold text-slate-200 hover:bg-white/10"
          >
            Back to Project
          </Link>

          <Link
            href={`/projects/${projectId}/points/${pointId}`}
            className="rounded-xl border border-white/20 px-4 py-2 font-semibold text-slate-200 hover:bg-white/10"
          >
            Back to Point
          </Link>
        </div>

        <section className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-8 shadow-2xl">
          <div className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
            Edit Field Observation
          </div>

          <h1 className="text-5xl font-black tracking-tight">{pointCode}</h1>

          <p className="mt-3 text-slate-300">
            Update field record, coordinate, UTM, photos and geological
            information
          </p>
        </section>

        <form
          onSubmit={savePoint}
          className="grid gap-6 rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-xl"
        >
          <section className={cardClass}>
            <h2 className="mb-4 text-2xl font-bold">Location / UTM</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="Latitude"
                className={inputClass}
              />

              <input
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="Longitude"
                className={inputClass}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <input
                value={utmZone}
                onChange={(e) => setUtmZone(e.target.value.toUpperCase())}
                placeholder="UTM Zone เช่น 47P"
                className={inputClass}
              />

              <input
                value={utmEasting}
                onChange={(e) => setUtmEasting(e.target.value)}
                placeholder="Easting"
                className={inputClass}
              />

              <input
                value={utmNorthing}
                onChange={(e) => setUtmNorthing(e.target.value)}
                placeholder="Northing"
                className={inputClass}
              />
            </div>

            <div className="mt-3 text-sm text-slate-500">
              ถ้าแก้ค่า UTM ระบบจะใช้ UTM แปลงกลับเป็น Latitude / Longitude
              ตอนกด Save
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="mb-4 text-2xl font-bold">Field Information</h2>

            <div className="grid gap-4">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass}
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
                className={inputClass}
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

              <select
                value={rockType}
                onChange={(e) => setRockType(e.target.value)}
                className={inputClass}
              >
                <option value="">Rock Type</option>
                {rockTypeOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>

              {rockType === "Other" && (
                <input
                  value={rockTypeOther}
                  onChange={(e) => setRockTypeOther(e.target.value)}
                  placeholder="Specify Rock Type"
                  className={inputClass}
                />
              )}

              <select
                value={weathering}
                onChange={(e) => setWeathering(e.target.value)}
                className={inputClass}
              >
                <option value="">Weathering</option>
                <option value="Fresh">Fresh</option>
                <option value="Slightly Weathered">Slightly Weathered</option>
                <option value="Moderately Weathered">
                  Moderately Weathered
                </option>
                <option value="Highly Weathered">Highly Weathered</option>
                <option value="Completely Weathered">
                  Completely Weathered
                </option>
              </select>

              <select
                value={alteration}
                onChange={(e) => setAlteration(e.target.value)}
                className={inputClass}
              >
                <option value="">Alteration</option>
                {alterationOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>

              {alteration === "Other" && (
                <input
                  value={alterationOther}
                  onChange={(e) => setAlterationOther(e.target.value)}
                  placeholder="Specify Alteration"
                  className={inputClass}
                />
              )}

              <select
                value={mineralization}
                onChange={(e) => setMineralization(e.target.value)}
                className={inputClass}
              >
                <option value="">Mineralization</option>
                {mineralizationOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>

              {mineralization === "Other" && (
                <input
                  value={mineralizationOther}
                  onChange={(e) => setMineralizationOther(e.target.value)}
                  placeholder="Specify Mineralization"
                  className={inputClass}
                />
              )}

              <select
                value={structureType}
                onChange={(e) => setStructureType(e.target.value)}
                className={inputClass}
              >
                <option value="">Structure</option>
                {structureOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>

              {structureType === "Other" && (
                <input
                  value={structureTypeOther}
                  onChange={(e) => setStructureTypeOther(e.target.value)}
                  placeholder="Specify Structure"
                  className={inputClass}
                />
              )}
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="mb-4 text-2xl font-bold">Structure / Sample</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                value={strike}
                onChange={(e) => setStrike(e.target.value)}
                placeholder="Strike"
                className={inputClass}
              />

              <input
                value={dip}
                onChange={(e) => setDip(e.target.value)}
                placeholder="Dip"
                className={inputClass}
              />

              <input
                value={sampleId}
                onChange={(e) => setSampleId(e.target.value)}
                placeholder="Sample ID"
                className={inputClass}
              />

              <select
                value={sampleType}
                onChange={(e) => setSampleType(e.target.value)}
                className={inputClass}
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
          </section>

          <section className={cardClass}>
            <h2 className="mb-4 text-2xl font-bold">Photos</h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 font-bold">Sample Photo</div>

                {samplePhotoUrl ? (
                  <>
                    <img
                      src={samplePhotoUrl}
                      alt="Sample"
                      className="mb-3 max-h-64 w-full rounded-xl border bg-white object-contain"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setSamplePhotoUrl("");
                        setMessage(
                          "Sample photo removed. Please save field record."
                        );
                      }}
                      className="mb-3 w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Remove Sample Photo
                    </button>
                  </>
                ) : (
                  <div className="mb-3 flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-400">
                    No Sample Photo
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPhoto(file, "sample");
                  }}
                />

                {uploadingSample && (
                  <div className="mt-2 text-sm text-slate-500">
                    Uploading sample photo...
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 font-bold">Outcrop Photo</div>

                {outcropPhotoUrl ? (
                  <>
                    <img
                      src={outcropPhotoUrl}
                      alt="Outcrop"
                      className="mb-3 max-h-64 w-full rounded-xl border bg-white object-contain"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setOutcropPhotoUrl("");
                        setMessage(
                          "Outcrop photo removed. Please save field record."
                        );
                      }}
                      className="mb-3 w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Remove Outcrop Photo
                    </button>
                  </>
                ) : (
                  <div className="mb-3 flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-400">
                    No Outcrop Photo
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPhoto(file, "outcrop");
                  }}
                />

                {uploadingOutcrop && (
                  <div className="mt-2 text-sm text-slate-500">
                    Uploading outcrop photo...
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 font-bold">More Photos</div>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => uploadMorePhotos(e.target.files)}
              />

              {uploadingMorePhotos && (
                <div className="mt-2 text-sm text-slate-500">
                  Uploading more photos...
                </div>
              )}

              {morePhotos.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {morePhotos.map((photo, index) => (
                    <div
                      key={`${photo.url}-${index}`}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                    >
                      <img
                        src={photo.url}
                        alt={`More photo ${index + 1}`}
                        className="h-48 w-full object-cover"
                      />

                      <div className="border-t p-3">
                        <label className="mb-2 block text-sm font-semibold text-slate-600">
                          Description
                        </label>

                        <textarea
                          value={photo.description}
                          onChange={(e) =>
                            updateMorePhotoDescription(index, e.target.value)
                          }
                          placeholder="เช่น Close-up quartz vein with pyrite / Outcrop overview looking north"
                          rows={3}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />

                        <button
                          type="button"
                          onClick={() => removeMorePhoto(index)}
                          className="mt-3 w-full rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="mb-4 text-2xl font-bold">Remark</h2>

            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Remark"
              rows={4}
              className={inputClass}
            />
          </section>

          <button
            type="submit"
            disabled={
              saving ||
              uploadingSample ||
              uploadingOutcrop ||
              uploadingMorePhotos
            }
            className="rounded-2xl bg-slate-950 px-5 py-4 font-bold text-white shadow-lg hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Field Record"}
          </button>

          <section className="rounded-3xl border border-red-200 bg-red-50 p-6 text-slate-950 shadow-xl">
            <div className="mb-2 text-xl font-bold text-red-700">
              Danger Zone
            </div>

            <div className="mb-4 text-sm text-red-600">
              ลบ Point นี้ออกจากระบบ หากลบแล้วจะไม่แสดงบน Map และ Points List
            </div>

            <DeletePointButton
              projectId={projectId}
              pointId={pointId}
              from={from === "map" ? "map" : "point"}
            />
          </section>

          {message && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
              {message}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}