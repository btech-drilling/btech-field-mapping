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
}: {
  projectId: string;
  points: any[];
  lines: any[];
  polygons: any[];
  showPoints: boolean;
  showLines: boolean;
  showPolygons: boolean;
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
          <div style="width:260px">
            <b>${poly.name ?? "Polygon"}</b><br/>
            Layer: ${poly.layer_name ?? "-"}<br/>
            Type: ${sheet ? "Map Sheet" : "Geology Unit"}<br/>
            <small>${poly.folder_path ?? ""}</small>
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
            <b>${line.name ?? "Line"}</b><br/>
            Layer: ${line.layer_name ?? "-"}<br/>
            Type: ${line.feature_type ?? "-"}<br/>
            <small>${line.folder_path ?? ""}</small>
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

            <a
              href="/projects/${projectId}/points/${p.id}"
              style="display:block;margin-top:10px;padding:8px;background:black;color:white;text-align:center;border-radius:6px;text-decoration:none;font-weight:bold;"
            >
              Open Record
            </a>
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
      `}</style>

      <div ref={mapRef} className="h-full min-h-[420px] w-full rounded border" />
    </>
  );
}