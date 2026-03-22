import { useState, useMemo } from "react";
import { languages } from "../data/languages";

interface Props {
  selectedLanguages: string[];
  onToggle: (langCode: string) => void;
  onClear: () => void;
}

export function LanguageSelector({ selectedLanguages, onToggle, onClear }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return Object.entries(languages).filter(
      ([, lang]) =>
        lang.name.toLowerCase().includes(q) ||
        lang.native.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <aside className="w-72 flex flex-col bg-slate-800 border-r border-slate-700 shrink-0">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-base font-semibold text-white mb-3">Languages</h2>
        <input
          type="text"
          placeholder="Search languages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-700 text-white placeholder-slate-400 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {selectedLanguages.length > 0 && (
        <div className="px-4 py-3 border-b border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Selected ({selectedLanguages.length})
            </span>
            <button
              onClick={onClear}
              className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedLanguages.map((code) => {
              const lang = languages[code as keyof typeof languages];
              return (
                <button
                  key={code}
                  onClick={() => onToggle(code)}
                  className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white text-xs px-2 py-1 rounded-full transition-colors"
                >
                  {lang?.name ?? code}
                  <span className="text-teal-200 leading-none">×</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No languages found</p>
        ) : (
          <ul>
            {filtered.map(([code, lang]) => {
              const isSelected = selectedLanguages.includes(code);
              return (
                <li key={code}>
                  <button
                    onClick={() => onToggle(code)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                      isSelected
                        ? "bg-teal-900/40 text-teal-300"
                        : "text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <div>
                      <span className="text-sm font-medium">{lang.name}</span>
                      <span className="text-xs text-slate-500 ml-2">{lang.native}</span>
                    </div>
                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-teal-400 shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
