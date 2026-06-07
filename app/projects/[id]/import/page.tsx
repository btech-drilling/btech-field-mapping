"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type KmlStyle = {
  styleId: string;
  lineColor: string | null;
  polyColor: string | null;
  fillOpacity: number | null;
  iconColor: string | null;
  iconUrl: string | null;
  iconScale: number | null;
};

type MappingPoint = {
  project_id: number;
  point_code: string;
  longitude: number;
  latitude: number;
  elevation: number | null;
  status: string;
  priority: string;
  layer_name: string | null;
  folder_path: string | null;
  marker_color: string | null;
  marker_icon_url: string | null;
  marker_scale: number | null;
  marker_style_id: string | null;
};

type MappingLine = {
  project_id: number;
  name: string;
  feature_type: string;
  geojson: any;
  color: string | null;
  style_id: string | null;
  layer_name: string | null;
  folder_path: string | null;
  remark: string | null;
};

type MappingPolygon = {
  project_id: number;
  name: string;
  feature_type: string;
  geojson: any;
  stroke_color: string | null;
  fill_color: string | null;
  fill_opacity: number;
  style_id: string | null;
  layer_name: string | null;
  folder_path: string | null;
  desc_t1: string | null;
  remark: string | null;
};

function cleanText(value: string) {
  return value
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function getDirectChildText(el: Element, tagName: string) {
  const children = Array.from(el.children);
  const child = children.find((c) => c.tagName === tagName);
  return child?.textContent ? cleanText(child.textContent) : "";
}

function getStyleUrlFromPlacemark(pm: Element) {
  const raw = getDirectChildText(pm, "styleUrl");
  return raw.replace("#", "").trim() || null;
}
function getExtendedDataValue(pm: Element, fieldName: string) {
  const target = fieldName.trim().toLowerCase();

  const simpleDataEls = Array.from(pm.getElementsByTagName("SimpleData"));

  for (const el of simpleDataEls) {
    const name = el.getAttribute("name")?.trim().toLowerCase();
    if (name === target) {
      return el.textContent ? cleanText(el.textContent) : null;
    }
  }

  const dataEls = Array.from(pm.getElementsByTagName("Data"));

  for (const el of dataEls) {
    const name = el.getAttribute("name")?.trim().toLowerCase();

    if (name === target) {
      const valueEl = el.getElementsByTagName("value")[0];
      return valueEl?.textContent ? cleanText(valueEl.textContent) : null;
    }
  }

  return null;
}

function getDescriptionHtmlValue(pm: Element, fieldName: string) {
  const target = fieldName.trim().toLowerCase();

  const descriptionEl = pm.getElementsByTagName("description")[0];
  if (!descriptionEl) return null;

  const serializer = new XMLSerializer();

  let rawDescription = "";

  // กรณี description มี HTML/XML child จริง ๆ เช่น <table><tr><td>desc_t1</td>...
  if (descriptionEl.children.length > 0) {
    rawDescription = Array.from(descriptionEl.childNodes)
      .map((node) => serializer.serializeToString(node))
      .join("");
  } else {
    // กรณี description เป็น CDATA หรือ escaped HTML
    rawDescription = descriptionEl.textContent ?? "";
  }

  if (!rawDescription.trim()) return null;

  rawDescription = rawDescription
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(rawDescription, "text/html");

  const rows = Array.from(htmlDoc.querySelectorAll("tr"));

  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll("td, th")).map((cell) =>
      cleanText(cell.textContent ?? "")
    );

    if (cells.length >= 2 && cells[0].trim().toLowerCase() === target) {
      return cells
        .slice(1)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  // fallback regex เผื่อ DOMParser ไม่เจอ table
  const escapedTarget = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const regex = new RegExp(
    `<td[^>]*>\\s*${escapedTarget}\\s*<\\/td>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`,
    "i"
  );

  const match = rawDescription.match(regex);

  if (match?.[1]) {
    return cleanText(
      match[1]
        .replace(/<br\\s*\\/?>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
    );
  }

  return null;
}

// KML color = aabbggrr
function kmlColorToCss(kmlColor: string | null) {
  if (!kmlColor || kmlColor.length < 8) {
    return { color: null, opacity: null };
  }

  const aa = kmlColor.slice(0, 2);
  const bb = kmlColor.slice(2, 4);
  const gg = kmlColor.slice(4, 6);
  const rr = kmlColor.slice(6, 8);

  const opacity = Math.round((parseInt(aa, 16) / 255) * 100) / 100;

  return {
    color: `#${rr}${gg}${bb}`,
    opacity,
  };
}

function parseStyles(doc: Document) {
  const styles: Record<string, KmlStyle> = {};
  const styleEls = Array.from(doc.getElementsByTagName("Style"));

  for (const styleEl of styleEls) {
    const styleId = styleEl.getAttribute("id");
    if (!styleId) continue;

    const lineStyle = styleEl.getElementsByTagName("LineStyle")[0];
    const polyStyle = styleEl.getElementsByTagName("PolyStyle")[0];
    const iconStyle = styleEl.getElementsByTagName("IconStyle")[0];

    const lineColorRaw =
      lineStyle?.getElementsByTagName("color")[0]?.textContent?.trim() ?? null;

    const polyColorRaw =
      polyStyle?.getElementsByTagName("color")[0]?.textContent?.trim() ?? null;

    const iconColorRaw =
      iconStyle?.getElementsByTagName("color")[0]?.textContent?.trim() ?? null;

    const iconHref =
      iconStyle?.getElementsByTagName("href")[0]?.textContent?.trim() ?? null;

    const iconScaleText =
      iconStyle?.getElementsByTagName("scale")[0]?.textContent?.trim() ?? null;

    const iconScale = iconScaleText ? Number(iconScaleText) : null;

    const line = kmlColorToCss(lineColorRaw);
    const poly = kmlColorToCss(polyColorRaw);
    const icon = kmlColorToCss(iconColorRaw);

    styles[styleId] = {
      styleId,
      lineColor: line.color,
      polyColor: poly.color,
      fillOpacity: poly.opacity,
      iconColor: icon.color,
      iconUrl: iconHref,
      iconScale: Number.isFinite(iconScale) ? iconScale : null,
    };
  }

  return styles;
}

function parseCoordinates(coordText: string) {
  return coordText
    .trim()
    .split(/\s+/)
    .map((item) => {
      const [lon, lat, ele] = item.split(",").map(Number);
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;

      return [lon, lat, Number.isFinite(ele) ? ele : 0] as [
        number,
        number,
        number
      ];
    })
    .filter(Boolean) as [number, number, number][];
}

function getFirstCoordinates(parent: Element) {
  const coordEl = parent.getElementsByTagName("coordinates")[0];
  return coordEl?.textContent ? parseCoordinates(coordEl.textContent) : [];
}

function isMapSheetName(name: string) {
  return /^[0-9]{4}\s*(I|II|III|IV)$/i.test(name.trim());
}

function getLayerType(name: string, layerName: string | null) {
  if (isMapSheetName(name)) return "MAP_SHEET";
  if (layerName === "ระวางแผนที่") return "MAP_SHEET";
  return "GEOLOGY";
}

function traverseFolders(
  el: Element,
  folderPath: string[],
  styles: Record<string, KmlStyle>,
  projectId: number,
  points: MappingPoint[],
  lines: MappingLine[],
  polygons: MappingPolygon[]
) {
  const children = Array.from(el.children);

  for (const child of children) {
    if (child.tagName === "Folder" || child.tagName === "Document") {
      const folderName = getDirectChildText(child, "name");
      const nextPath = folderName ? [...folderPath, folderName] : folderPath;

      traverseFolders(
        child,
        nextPath,
        styles,
        projectId,
        points,
        lines,
        polygons
      );
    }

    if (child.tagName !== "Placemark") continue;

const name = getDirectChildText(child, "name") || "Unnamed Feature";
const styleId = getStyleUrlFromPlacemark(child);
const style = styleId ? styles[styleId] : null;
const descT1 =
  getExtendedDataValue(child, "desc_t1") ||
  getDescriptionHtmlValue(child, "desc_t1");

    const layerName =
      folderPath.length > 0 ? folderPath[folderPath.length - 1] : null;
    const folderPathText = folderPath.join(" > ");

    const pointEl = child.getElementsByTagName("Point")[0];

    if (pointEl) {
      const coords = getFirstCoordinates(pointEl);
      const first = coords[0];

      if (first) {
        points.push({
          project_id: projectId,
          point_code: name,
          longitude: first[0],
          latitude: first[1],
          elevation: Number.isFinite(first[2]) ? first[2] : null,
          status: "PLANNED",
          priority: "NORMAL",
          layer_name: layerName,
          folder_path: folderPathText,
          marker_color: style?.iconColor || null,
          marker_icon_url: style?.iconUrl || null,
          marker_scale: style?.iconScale || null,
          marker_style_id: styleId,
        });
      }

      continue;
    }

    const lineEl = child.getElementsByTagName("LineString")[0];

    if (lineEl) {
      const coords = getFirstCoordinates(lineEl);

      if (coords.length >= 2) {
        lines.push({
          project_id: projectId,
          name,
          feature_type: "LineString",
          geojson: {
            type: "LineString",
            coordinates: coords.map(([lon, lat, ele]) => [lon, lat, ele]),
          },
          color: style?.lineColor || "#ff0000",
          style_id: styleId,
          layer_name: layerName,
          folder_path: folderPathText,
          remark: null,
        });
      }

      continue;
    }

    const polygonEls = Array.from(child.getElementsByTagName("Polygon"));

    if (polygonEls.length > 0) {
      const layerType = getLayerType(name, layerName);

      const multiPolygonCoordinates = polygonEls
        .map((polygonEl) => {
          const outerEl = polygonEl.getElementsByTagName("outerBoundaryIs")[0];
          const outerCoords = outerEl ? getFirstCoordinates(outerEl) : [];

          if (outerCoords.length < 3) return null;

          const innerEls = Array.from(
            polygonEl.getElementsByTagName("innerBoundaryIs")
          );

          const innerRings = innerEls
            .map((innerEl) => getFirstCoordinates(innerEl))
            .filter((coords) => coords.length >= 3)
            .map((coords) => coords.map(([lon, lat, ele]) => [lon, lat, ele]));

          return [
            outerCoords.map(([lon, lat, ele]) => [lon, lat, ele]),
            ...innerRings,
          ];
        })
        .filter(Boolean) as number[][][][];

      if (multiPolygonCoordinates.length > 0) {
polygons.push({
  project_id: projectId,
  name,
  feature_type: layerType,
  geojson:
    multiPolygonCoordinates.length === 1
      ? {
          type: "Polygon",
          coordinates: multiPolygonCoordinates[0],
        }
      : {
          type: "MultiPolygon",
          coordinates: multiPolygonCoordinates,
        },
  stroke_color: style?.lineColor || style?.polyColor || "#ffff00",
  fill_color: style?.polyColor || "#cccccc",
  fill_opacity:
    layerType === "MAP_SHEET" ? 0 : style?.fillOpacity ?? 0.25,
  style_id: styleId,
  layer_name: layerName,
  folder_path: folderPathText,
  desc_t1: descT1,
  remark: null,
});
      }
    }
  }
}

async function insertInChunks(table: string, rows: any[], chunkSize = 500) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).insert(chunk);

    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }
  }
}

async function deleteExistingLayers(projectId: number, layerNames: string[]) {
  const cleanLayerNames = layerNames
    .map((x) => String(x ?? "").trim())
    .filter(Boolean);

  if (cleanLayerNames.length === 0) return;

  const { error: pointsError } = await supabase
    .from("mapping_points")
    .delete()
    .eq("project_id", projectId)
    .in("layer_name", cleanLayerNames);

  if (pointsError) {
    throw new Error(`mapping_points delete: ${pointsError.message}`);
  }

  const { error: linesError } = await supabase
    .from("mapping_lines")
    .delete()
    .eq("project_id", projectId)
    .in("layer_name", cleanLayerNames);

  if (linesError) {
    throw new Error(`mapping_lines delete: ${linesError.message}`);
  }

  const { error: polygonsError } = await supabase
    .from("mapping_polygons")
    .delete()
    .eq("project_id", projectId)
    .in("layer_name", cleanLayerNames);

  if (polygonsError) {
    throw new Error(`mapping_polygons delete: ${polygonsError.message}`);
  }
}

export default function ImportKmlPage() {
  const params = useParams();
  const projectId = Number(params.id);
  const [message, setMessage] = useState("");

  async function importFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage("Reading KML...");

    let text = await file.text();

    if (text.includes("xsi:schemaLocation") && !text.includes("xmlns:xsi")) {
      text = text.replace(
        "<kml ",
        '<kml xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
      );
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/xml");

    console.log(
      "Folders:",
      Array.from(doc.getElementsByTagName("Folder"))
        .slice(0, 100)
        .map((f) => f.getElementsByTagName("name")[0]?.textContent)
    );

    const parseError = doc.getElementsByTagName("parsererror")[0];
    if (parseError) {
      console.warn("KML parse warning:", parseError.textContent);
    }

    const styles = parseStyles(doc);

    const points: MappingPoint[] = [];
    const lines: MappingLine[] = [];
    const polygons: MappingPolygon[] = [];

    traverseFolders(
      doc.documentElement,
      [],
      styles,
      projectId,
      points,
      lines,
      polygons
    );

    setMessage(
      `Found Point=${points.length}, Line=${lines.length}, Polygon=${polygons.length}\nStyles=${Object.keys(styles).length}\nImporting...`
    );

try {
  const layerNames = Array.from(
    new Set(
      [
        ...points.map((p) => p.layer_name),
        ...lines.map((l) => l.layer_name),
        ...polygons.map((p) => p.layer_name),
      ].filter(Boolean)
    )
  ) as string[];

  setMessage(
    `Found Point=${points.length}, Line=${lines.length}, Polygon=${polygons.length}
Styles=${Object.keys(styles).length}
Layers=${layerNames.join(", ")}

Replacing existing data in these layers...`
  );

  await deleteExistingLayers(projectId, layerNames);

  if (points.length > 0) {
    await insertInChunks("mapping_points", points, 500);
  }

  if (lines.length > 0) {
    await insertInChunks("mapping_lines", lines, 300);
  }

  if (polygons.length > 0) {
    await insertInChunks("mapping_polygons", polygons, 300);
  }

      setMessage(
        `Import completed.\nPoint=${points.length}\nLine=${lines.length}\nPolygon=${polygons.length}\nStyles=${Object.keys(styles).length}\nLayers=${layerNames.join(", ")}`
      );
    } catch (err: any) {
      setMessage("Error: " + err.message);
    }
  }

  
  return (
    <div className="p-6">
      <Link href={`/projects/${projectId}`} className="text-sm underline">
        ← Back to Project
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Import KML</h1>
      <p className="mt-2 text-gray-500">
        Import Point, LineString, Polygon, KML styles, icon styles, and folder
        layers.
      </p>

      <div className="mt-6 rounded border p-6">
        <input type="file" accept=".kml" onChange={importFile} />

        {message && (
          <div className="mt-4 whitespace-pre-wrap rounded border p-3 text-sm">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}