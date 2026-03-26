"use client";

import { useState } from "react";

export interface ReadmeOptions {
  tone: "professional" | "casual" | "minimal";
  sections: string[];
  badgeStyle: "flat" | "flat-square" | "for-the-badge" | "plastic";
}

const ALL_SECTIONS = [
  { id: "badges", label: "Badges" },
  { id: "features", label: "Features" },
  { id: "demo", label: "Screenshots / Demo" },
  { id: "installation", label: "Installation" },
  { id: "usage", label: "Usage Examples" },
  { id: "configuration", label: "Configuration" },
  { id: "api", label: "API Reference" },
  { id: "contributing", label: "Contributing" },
  { id: "license", label: "License" },
];

const DEFAULT_SECTIONS = ALL_SECTIONS.map((s) => s.id);

interface CustomizationOptionsProps {
  options: ReadmeOptions;
  onChange: (options: ReadmeOptions) => void;
  disabled?: boolean;
}

export const DEFAULT_OPTIONS: ReadmeOptions = {
  tone: "professional",
  sections: DEFAULT_SECTIONS,
  badgeStyle: "flat",
};

export function CustomizationOptions({
  options,
  onChange,
  disabled,
}: CustomizationOptionsProps) {
  const [open, setOpen] = useState(false);

  function toggleSection(id: string) {
    const next = options.sections.includes(id)
      ? options.sections.filter((s) => s !== id)
      : [...options.sections, id];
    onChange({ ...options, sections: next });
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="text-sm text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1.5"
      >
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        Customize output
      </button>

      {open && (
        <div className="mt-3 p-4 bg-gray-900 border border-gray-700 rounded-lg space-y-5">
          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tone
            </label>
            <div className="flex gap-2">
              {(["professional", "casual", "minimal"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ ...options, tone: t })}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors capitalize ${
                    options.tone === t
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sections to include
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_SECTIONS.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={options.sections.includes(s.id)}
                    onChange={() => toggleSection(s.id)}
                    disabled={disabled}
                    className="rounded bg-gray-800 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>

          {/* Badge Style */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Badge style
            </label>
            <div className="flex flex-wrap gap-2">
              {(
                ["flat", "flat-square", "for-the-badge", "plastic"] as const
              ).map((style) => (
                <button
                  key={style}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ ...options, badgeStyle: style })}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    options.badgeStyle === style
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
