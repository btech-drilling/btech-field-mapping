// lib/utm.ts

import proj4 from "proj4";

function getUtmBand(lat: number) {
  const bands = "CDEFGHJKLMNPQRSTUVWX";
  const index = Math.floor((lat + 80) / 8);
  return bands[Math.max(0, Math.min(index, bands.length - 1))];
}

function parseUtmZone(zone: string | number) {
  const zoneText = String(zone).trim().toUpperCase();

  const match = zoneText.match(/^(\d{1,2})([C-HJ-NP-X])?$/);

  if (!match) {
    throw new Error("Invalid UTM zone. Example: 47P or 47");
  }

  const zoneNumber = Number(match[1]);
  const band = match[2] ?? "N";

  if (zoneNumber < 1 || zoneNumber > 60) {
    throw new Error("UTM zone number must be between 1 and 60.");
  }

  const northernHemisphere = band >= "N";

  return {
    zoneNumber,
    band,
    northernHemisphere,
  };
}

function getEpsg(zoneNumber: number, northernHemisphere: boolean) {
  return northernHemisphere
    ? `EPSG:${32600 + zoneNumber}`
    : `EPSG:${32700 + zoneNumber}`;
}

function defineUtmProjection(zoneNumber: number, northernHemisphere: boolean) {
  const epsg = getEpsg(zoneNumber, northernHemisphere);

  proj4.defs(
    epsg,
    `+proj=utm +zone=${zoneNumber} ${
      northernHemisphere ? "" : "+south"
    } +datum=WGS84 +units=m +no_defs`
  );

  return epsg;
}

export function latLonToUTM(lat: number, lon: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("Invalid latitude or longitude.");
  }

  const zoneNumber = Math.floor((lon + 180) / 6) + 1;
  const band = getUtmBand(lat);
  const northernHemisphere = lat >= 0;

  const epsg = defineUtmProjection(zoneNumber, northernHemisphere);

  const [easting, northing] = proj4("EPSG:4326", epsg, [lon, lat]);

  return {
    // ของเดิม ใช้ต่อได้
    zone: `${zoneNumber}${band}`,
    easting,
    northing,

    // ของใหม่ เผื่อใช้ในหน้า edit ง่ายขึ้น
    zoneNumber,
    band,
    hemisphere: northernHemisphere ? "N" : "S",
  };
}

export function utmToLatLon(
  easting: number,
  northing: number,
  zone: string | number
) {
  if (!Number.isFinite(easting) || !Number.isFinite(northing)) {
    throw new Error("Invalid UTM easting or northing.");
  }

  const { zoneNumber, northernHemisphere } = parseUtmZone(zone);

  const epsg = defineUtmProjection(zoneNumber, northernHemisphere);

  const [lon, lat] = proj4(epsg, "EPSG:4326", [easting, northing]);

  return {
    latitude: lat,
    longitude: lon,
  };
}

export function formatUTMFromLatLon(lat: number, lon: number) {
  const utm = latLonToUTM(lat, lon);

  return {
    zone: utm.zone,
    eastingText: Math.round(utm.easting).toString(),
    northingText: Math.round(utm.northing).toString(),
  };
}