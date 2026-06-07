"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

function getStatusColor(status: string | null) {
  switch (status) {
    case "COMPLETED":
      return "#16a34a";
    case "SAMPLED":
      return "#f97316";
    case "VISITED":
      return "#eab308";
    case "NEED_REVISIT":
      return "#dc2626";
    case "PLANNED":
    default:
      return "#2563eb";
  }
}

function isMapSheet(poly: any) {
  const featureType = String(poly.feature_type ?? "").toUpperCase();
  const layerName = String(poly.layer_name ?? "").trim();
  const name = String(poly.name ?? "").trim();

  return (
    featureType === "MAP_SHEET" ||
    layerName === "ระวางแผนที่" ||
    /^[0-9]{4}\s*(I|II|III|IV)$/i.test(name)
  );
}

function getUnitFillColor(poly: any) {
  const name = String(poly.name ?? "");

  if (name === "หมวดหินรังนก") return "#00b464";

  return poly.fill_color || "#cccccc";
}

function getPolygonDrawOrder(poly: any) {
  const layerName = String(poly.layer_name ?? "");

  if (layerName === "INS_NRT_Explo") return 1;
  if (layerName === "SNI") return 2;
  if (layerName === "NRT") return 3;
  if (layerName.startsWith("TV")) return 4;
  if (layerName === "พื้นที่สำรวจ") return 5;
  if (layerName === "ระวางแผนที่") return 6;

  return 10;
}

function createPointIcon(p: any) {
  const color = p.marker_color || getStatusColor(p.status);
  const iconUrl = p.marker_icon_url;
  const scale = Number(p.marker_scale ?? 1);
  const size = Math.max(20, Math.min(42, Math.round(28 * scale)));

  if (iconUrl) {
    return L.icon({
      iconUrl,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size],
      tooltipAnchor: [0, -size],
    });
  }

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:22px;
        height:22px;
        background:${color};
        border:3px solid white;
        border-radius:50%;
        box-shadow:0 1px 6px rgba(0,0,0,0.7);
      "></div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export default function MapWrapper({
  projectId,
  points,
  lines,
  polygons,
  showPoints,
  showLines,
  showPolygons,
  addPointMode,
}: {
  projectId: string;
  points: any[];
  lines: any[];
  polygons: any[];
  showPoints: boolean;
  showLines: boolean;
  showPolygons: boolean;
  addPointMode: boolean;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const validPoints = points.filter(
      (p) =>
        p.latitude !== null &&
        p.longitude !== null &&
        !Number.isNaN(Number(p.latitude)) &&
        !Number.isNaN(Number(p.longitude))
    );

    const map = L.map(mapRef.current, {
      preferCanvas: false,
    });

    mapInstance.current = map;

    if (addPointMode) {
      map.getContainer().classList.add("add-point-mode-map");
    } else {
      map.getContainer().classList.remove("add-point-mode-map");
    }

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles © Esri", maxZoom: 19 }
    ).addTo(map);

    L.tileLayer(
      "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Labels © Esri", maxZoom: 19 }
    ).addTo(map);

    const boundsItems: [number, number][] = [];

    if (showPolygons) {
      const sortedPolygons = [...polygons].sort(
        (a, b) => getPolygonDrawOrder(a) - getPolygonDrawOrder(b)
      );

      sortedPolygons.forEach((poly) => {
        if (!poly.geojson) return;

        const sheet = isMapSheet(poly);

        const rawOpacity =
          typeof poly.fill_opacity === "number" ? poly.fill_opacity : 0.45;

        const fillOpacity = sheet
          ? 0
          : Math.max(Math.min(rawOpacity, 0.75), 0.35);

        const layer = L.geoJSON(poly.geojson, {
          style: {
            color: sheet ? "#ffff00" : "#444444",
            weight: sheet ? 2 : 0.5,
            opacity: sheet ? 1 : 0.3,
            fillColor: getUnitFillColor(poly),
            fillOpacity,
            dashArray: sheet ? "6,4" : undefined,
          },
        }).addTo(map);

layer.bindPopup(`
  <div style="width:300px">
    <div style="font-size:15px;font-weight:bold;margin-bottom:6px;">
      ${poly.name ?? "Polygon"}
    </div>

    <div><b>Layer:</b> ${poly.layer_name ?? "-"}</div>
    <div><b>Type:</b> ${sheet ? "Map Sheet" : "Geology Unit"}</div>
    <div><b>Feature:</b> ${poly.feature_type ?? "-"}</div>
    <div><b>Style ID:</b> ${poly.style_id ?? "-"}</div>

    ${
      poly.desc_t1
        ? `
          <div style="margin-top:10px;padding:8px;border-radius:6px;background:#f3f4f6;color:#111827;font-size:12px;line-height:1.45;">
            <div style="font-weight:bold;margin-bottom:4px;">Description</div>
            ${poly.desc_t1}
          </div>
        `
        : ""
    }

    <div style="margin-top:6px;color:#555;font-size:12px;">
      ${poly.folder_path ?? ""}
    </div>
  </div>
`);

        layer.eachLayer((l: any) => {
          if (l.getLatLngs) {
            const latLngs = l.getLatLngs().flat(2);
            latLngs.forEach((ll: any) => {
              if (ll?.lat !== undefined && ll?.lng !== undefined) {
                boundsItems.push([ll.lat, ll.lng]);
              }
            });
          }
        });
      });
    }

    if (showLines) {
      lines.forEach((line) => {
        if (!line.geojson) return;

        const layer = L.geoJSON(line.geojson, {
          style: {
            color: line.color || "#ff0000",
            weight: 3,
            opacity: 0.95,
          },
        }).addTo(map);

        layer.bindPopup(`
          <div style="width:260px">
            <div style="font-size:15px;font-weight:bold;margin-bottom:6px;">
              ${line.name ?? "Line"}
            </div>
            <div><b>Layer:</b> ${line.layer_name ?? "-"}</div>
            <div><b>Type:</b> ${line.feature_type ?? "-"}</div>
            <div style="margin-top:6px;color:#555;font-size:12px;">
              ${line.folder_path ?? ""}
            </div>
          </div>
        `);

        layer.eachLayer((l: any) => {
          if (l.getLatLngs) {
            const latLngs = l.getLatLngs().flat(2);
            latLngs.forEach((ll: any) => {
              if (ll?.lat !== undefined && ll?.lng !== undefined) {
                boundsItems.push([ll.lat, ll.lng]);
              }
            });
          }
        });
      });
    }

    if (showPoints) {
      const clusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 45,
        spiderfyOnMaxZoom: true,
      });

      validPoints.forEach((p) => {
        const samplePhoto = p.sample_photo_url;
        const outcropPhoto = p.outcrop_photo_url;
        const icon = createPointIcon(p);

        const popup = `
          <div style="width:260px">
            <div style="font-size:16px;font-weight:bold;margin-bottom:6px;">
              ${p.point_code ?? "-"}
            </div>

            <div><b>Status:</b> ${p.status ?? "-"}</div>
            <div><b>Layer:</b> ${p.layer_name ?? "-"}</div>
            <div><b>Rock:</b> ${p.rock_type ?? "-"}</div>
            <div><b>Weathering:</b> ${p.weathering ?? "-"}</div>
            <div><b>Alteration:</b> ${p.alteration ?? "-"}</div>
            <div><b>Mineralization:</b> ${p.mineralization ?? "-"}</div>
            <div><b>Structure:</b> ${p.structure_type ?? "-"}</div>
            <div><b>Sample ID:</b> ${p.sample_id ?? "-"}</div>

            ${
              outcropPhoto
                ? `
                <div style="margin-top:8px;font-weight:bold;">Outcrop Photo</div>
                <img src="${outcropPhoto}" style="width:100%;max-height:110px;object-fit:contain;border-radius:6px;border:1px solid #ddd;" />
              `
                : ""
            }

            ${
              samplePhoto
                ? `
                <div style="margin-top:8px;font-weight:bold;">Sample Photo</div>
                <img src="${samplePhoto}" style="width:100%;max-height:110px;object-fit:contain;border-radius:6px;border:1px solid #ddd;" />
              `
                : ""
            }

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;">
              <a
                href="/projects/${projectId}/points/${p.id}"
                style="display:block;padding:8px;background:black;color:white;text-align:center;border-radius:6px;text-decoration:none;font-weight:bold;"
              >
                Open
              </a>

              <a
                href="/projects/${projectId}/points/${p.id}/edit?from=map"
                style="display:block;padding:8px;background:#2563eb;color:white;text-align:center;border-radius:6px;text-decoration:none;font-weight:bold;"
              >
                Edit
              </a>
            </div>
          </div>
        `;

        const marker = L.marker([Number(p.latitude), Number(p.longitude)], {
          icon,
        })
          .bindTooltip(p.point_code ?? "-", {
            permanent: false,
            direction: "top",
            offset: [0, -12],
            className: "mapping-point-label",
          })
          .bindPopup(popup);

        clusterGroup.addLayer(marker);
        boundsItems.push([Number(p.latitude), Number(p.longitude)]);
      });

      map.addLayer(clusterGroup);
    }

    if (addPointMode) {
      map.on("click", (e) => {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;

        const popupContent = `
          <div style="width:240px">
            <div style="font-size:15px;font-weight:bold;margin-bottom:6px;">
              Add New Point
            </div>

            <div style="font-size:12px;color:#374151;margin-bottom:8px;">
              Lat: ${lat.toFixed(6)}<br/>
              Lon: ${lon.toFixed(6)}
            </div>

            <a
              href="/projects/${projectId}/points/new?lat=${lat}&lon=${lon}&from=map"
              style="display:block;padding:8px;background:#16a34a;color:white;text-align:center;border-radius:6px;text-decoration:none;font-weight:bold;"
            >
              Add Point Here
            </a>
          </div>
        `;

        L.popup()
          .setLatLng(e.latlng)
          .setContent(popupContent)
          .openOn(map);
      });
    }

    if (boundsItems.length > 0) {
      map.fitBounds(L.latLngBounds(boundsItems), { padding: [40, 40] });
    } else {
      map.setView([13.7563, 100.5018], 6);
    }

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [
    points,
    lines,
    polygons,
    projectId,
    showPoints,
    showLines,
    showPolygons,
    addPointMode,
  ]);

  return (
    <>
      <style jsx global>{`
        .mapping-point-label {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #111;
          border-radius: 4px;
          color: #000;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 5px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
        }

        .mapping-point-label::before {
          display: none;
        }

        .add-point-mode-map .leaflet-overlay-pane svg path {
          pointer-events: none !important;
        }
      `}</style>

      <div
        ref={mapRef}
        className="h-[60vh] min-h-[380px] w-full rounded border lg:h-[75vh]"
      />
    </>
  );
}