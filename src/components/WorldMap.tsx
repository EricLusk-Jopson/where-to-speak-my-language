import { useEffect, useRef, useState, useCallback } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import { numericToAlpha2 } from "../data/countryCodeMap";
import { countries } from "../data/countries";
import { languages } from "../data/languages";

interface Props {
  selectedLanguages: string[];
}

interface TooltipState {
  x: number;
  y: number;
  countryName: string;
  matchedLanguages: string[];
}

const DOT_AREA_THRESHOLD = 20; // px² — features smaller than this get a dot marker
const DOT_RADIUS = 4;

interface CountryFeature {
  id: string;
  alpha2: string;
  d: string;
  cx: number;
  cy: number;
  isDot: boolean;
}

export function WorldMap({ selectedLanguages }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [features, setFeatures] = useState<CountryFeature[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 450 });

  // Build set of highlighted country codes from selected languages
  const highlightedCountries = new Set<string>();
  if (selectedLanguages.length > 0) {
    for (const [alpha2, country] of Object.entries(countries)) {
      if (country.official.some((lang) => selectedLanguages.includes(lang))) {
        highlightedCountries.add(alpha2);
      }
    }
  }

  // Track container size
  useEffect(() => {
    const container = svgRef.current?.parentElement;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Load and project geo data
  useEffect(() => {
    import("world-atlas/countries-50m.json").then((mod) => {
      const topo = mod.default as unknown as Topology;
      const { width, height } = dimensions;
      const projection = geoNaturalEarth1()
        .scale(width / 6.3)
        .translate([width / 2, height / 2]);
      const pathGenerator = geoPath(projection);
      const geojson = feature(
        topo,
        topo.objects.countries as GeometryCollection
      );
      const computed = (geojson.features as GeoJSON.Feature[]).map((geo) => {
        const rawId = String((geo as { id?: unknown }).id ?? "");
        // world-atlas stores IDs as zero-padded strings ("004"), mapping uses plain integers ("4")
        const id = String(parseInt(rawId, 10));
        const alpha2 = numericToAlpha2[id] ?? "";
        const geoArg = geo as Parameters<typeof pathGenerator>[0];
        const area = pathGenerator.area(geoArg);
        const [cx, cy] = pathGenerator.centroid(geoArg);
        return {
          id,
          alpha2,
          d: pathGenerator(geoArg) ?? "",
          cx: cx ?? 0,
          cy: cy ?? 0,
          isDot: area < DOT_AREA_THRESHOLD,
        };
      });
      setFeatures(computed);
    });
  }, [dimensions]);

  const makeTooltipData = useCallback(
    (e: React.MouseEvent<SVGElement>, alpha2: string) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const country = countries[alpha2 as keyof typeof countries];
      if (!country) return;
      const matchedLanguages = country.official
        .filter((lang) => selectedLanguages.includes(lang))
        .map((lang) => languages[lang as keyof typeof languages]?.name ?? lang);
      setTooltip({ x, y, countryName: country.name, matchedLanguages });
    },
    [selectedLanguages]
  );

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  return (
    <div className="relative w-full h-full bg-slate-900">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
      >
        {features.map(({ id, d, alpha2, cx, cy, isDot }) => {
          const isHighlighted = highlightedCountries.has(alpha2);
          const hasData = !!countries[alpha2 as keyof typeof countries];
          const fill = isHighlighted ? "#14b8a6" : hasData ? "#334155" : "#1e293b";
          const handlers = hasData
            ? {
                onMouseMove: (e: React.MouseEvent<SVGElement>) => makeTooltipData(e, alpha2),
                onMouseLeave: handleMouseLeave,
              }
            : {};

          if (isDot && hasData) {
            return (
              <circle
                key={id}
                cx={cx}
                cy={cy}
                r={DOT_RADIUS}
                fill={fill}
                stroke="#0f172a"
                strokeWidth={0.5}
                className="cursor-pointer transition-colors duration-150"
                style={{
                  filter: isHighlighted ? "drop-shadow(0 0 4px rgba(20,184,166,0.6))" : undefined,
                }}
                {...handlers}
              />
            );
          }

          return (
            <path
              key={id}
              d={d}
              fill={fill}
              stroke="#0f172a"
              strokeWidth={0.5}
              className={hasData ? "cursor-pointer transition-colors duration-150" : ""}
              style={{
                filter: isHighlighted ? "drop-shadow(0 0 4px rgba(20,184,166,0.6))" : undefined,
              }}
              {...handlers}
            />
          );
        })}
      </svg>

      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 shadow-xl text-sm max-w-48"
          style={{
            left: Math.min(tooltip.x + 12, dimensions.width - 200),
            top: Math.max(tooltip.y - 60, 8),
          }}
        >
          <div className="font-semibold text-white">{tooltip.countryName}</div>
          {tooltip.matchedLanguages.length > 0 && (
            <div className="text-teal-400 mt-1 text-xs">
              {tooltip.matchedLanguages.join(", ")}
            </div>
          )}
        </div>
      )}

      {selectedLanguages.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-slate-500 text-lg">
            Select a language to highlight countries
          </p>
        </div>
      )}
    </div>
  );
}
