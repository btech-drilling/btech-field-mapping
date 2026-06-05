import proj4 from "proj4";

function getUtmBand(lat: number) {
  const bands = "CDEFGHJKLMNPQRSTUVWX";
  const index = Math.floor((lat + 80) / 8);
  return bands[Math.max(0, Math.min(index, bands.length - 1))];
}

export function latLonToUTM(lat: number, lon: number) {
  const zoneNumber = Math.floor((lon + 180) / 6) + 1;
  const hemisphere = lat >= 0 ? "north" : "south";
  const band = getUtmBand(lat);

  const epsg = lat >= 0 ? `EPSG:${32600 + zoneNumber}` : `EPSG:${32700 + zoneNumber}`;

  proj4.defs(
    epsg,
    `+proj=utm +zone=${zoneNumber} ${
      hemisphere === "south" ? "+south" : ""
    } +datum=WGS84 +units=m +no_defs`
  );

  const [easting, northing] = proj4("EPSG:4326", epsg, [lon, lat]);

  return {
    zone: `${zoneNumber}${band}`,
    easting,
    northing,
  };
}