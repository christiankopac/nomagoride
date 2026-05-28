import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type MapPoint = {
  name: string;
  latitude: number;
  longitude: number;
  endpoint?: boolean;
};

type Props = {
  points: MapPoint[];
  className?: string;
  /** Compact mode hides controls and reduces padding — good for header strips. */
  compact?: boolean;
};

const STYLE_LIGHT = "https://tiles.openfreemap.org/styles/positron";
const STYLE_DARK = "https://tiles.openfreemap.org/styles/dark";

function getThemeIsDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function RouteMap({ points, className, compact = false }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [errored, setErrored] = useState(false);

  // Sync with theme (light/dark via .dark class on <html>).
  useEffect(() => {
    setMounted(true);
    setIsDark(getThemeIsDark());
    const obs = new MutationObserver(() => setIsDark(getThemeIsDark()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Filter usable points (with coords).
  const usable = points.filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));

  useEffect(() => {
    if (!mounted || !containerRef.current || usable.length === 0) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: (isDark ? STYLE_DARK : STYLE_LIGHT) as unknown as StyleSpecification | string,
      center: [usable[0].longitude, usable[0].latitude],
      zoom: 10,
      attributionControl: { compact: true },
      cooperativeGestures: compact,
    });
    mapRef.current = map;

    if (!compact) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    }

    map.on("error", () => setErrored(true));

    map.on("load", () => {
      const lineCoords = usable.map((p) => [p.longitude, p.latitude] as [number, number]);

      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: { type: "LineString", coordinates: lineCoords },
          properties: {},
        },
      });

      map.addLayer({
        id: "route-shadow",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": isDark ? "#000000" : "#ffffff",
          "line-width": 6,
          "line-opacity": 0.5,
        },
      });

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "hsl(18, 95%, 56%)",
          "line-width": 3.5,
        },
      });

      // Markers.
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = usable.map((p) => {
        const el = document.createElement("div");
        const isEnd = p.endpoint;
        el.className = "rm-pin";
        el.style.cssText = `
          width: ${isEnd ? 14 : 9}px;
          height: ${isEnd ? 14 : 9}px;
          border-radius: 9999px;
          background: ${isEnd ? "hsl(18, 95%, 56%)" : isDark ? "#e4e4e7" : "#27272a"};
          border: ${isEnd ? "3px" : "2px"} solid ${isDark ? "#0a0a0a" : "#ffffff"};
          box-shadow: 0 2px 6px rgba(0,0,0,${isDark ? 0.6 : 0.25});
          cursor: pointer;
        `;
        const m = new maplibregl.Marker({ element: el })
          .setLngLat([p.longitude, p.latitude])
          .setPopup(
            new maplibregl.Popup({ offset: 12, closeButton: false }).setHTML(
              `<div style="font-family: Inter, sans-serif; font-size: 13px; font-weight: 500; padding: 2px 4px;">${escapeHtml(p.name)}</div>`,
            ),
          )
          .addTo(map);
        return m;
      });

      // Fit bounds with padding.
      if (lineCoords.length > 1) {
        const bounds = lineCoords.reduce(
          (b, c) => b.extend(c),
          new maplibregl.LngLatBounds(lineCoords[0], lineCoords[0]),
        );
        map.fitBounds(bounds, {
          padding: compact ? 36 : 60,
          duration: 0,
          maxZoom: compact ? 11 : 13,
        });
      }
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // Re-create the map when theme or points change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isDark, JSON.stringify(usable.map((p) => [p.longitude, p.latitude, p.name, p.endpoint]))]);

  if (!mounted) {
    return (
      <div
        className={className}
        style={{ background: "hsl(var(--muted))" }}
        aria-hidden
      />
    );
  }

  if (usable.length === 0) {
    return (
      <div
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "hsl(var(--muted))",
          color: "hsl(var(--muted-foreground))",
          fontSize: 13,
        }}
      >
        No coordinates available for this route.
      </div>
    );
  }

  return (
    <div className={className} style={{ position: "relative" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%", borderRadius: "inherit" }} />
      {errored ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "hsl(var(--muted) / 0.9)",
            color: "hsl(var(--muted-foreground))",
            fontSize: 13,
            borderRadius: "inherit",
          }}
        >
          Map failed to load.
        </div>
      ) : null}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
