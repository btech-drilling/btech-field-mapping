"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Point = {
  id: number;
  point_code: string;
  latitude: number;
  longitude: number;
  elevation?: number | null;
  status?: string | null;
  rock_type?: string | null;
  alteration?: string | null;
  mineralization?: string | null;
  sample_photo_url?: string | null;
  outcrop_photo_url?: string | null;
};

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapClient({ points }: { points: Point[] }) {
  const validPoints = points.filter(
    (p) => p.latitude !== null && p.longitude !== null
  );

  const center =
    validPoints.length > 0
      ? [validPoints[0].latitude, validPoints[0].longitude]
      : [13.7563, 100.5018];

  return (
    <div className="h-[75vh] w-full overflow-hidden rounded border">
      <MapContainer
        center={center as [number, number]}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validPoints.map((p) => {
          const photo = p.outcrop_photo_url || p.sample_photo_url;

          return (
            <Marker
              key={p.id}
              position={[p.latitude, p.longitude]}
              icon={markerIcon}
            >
              <Popup>
                <div className="w-64">
                  <div className="font-bold">{p.point_code}</div>
                  <div>Status: {p.status ?? "-"}</div>
                  <div>Rock: {p.rock_type ?? "-"}</div>
                  <div>Alteration: {p.alteration ?? "-"}</div>
                  <div>Mineralization: {p.mineralization ?? "-"}</div>

                  {photo && (
                    <img
                      src={photo}
                      alt={p.point_code}
                      className="mt-2 max-h-40 w-full rounded object-contain"
                    />
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}