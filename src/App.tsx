import { useState } from "react";
import { WorldMap } from "./components/WorldMap";
import { LanguageSelector } from "./components/LanguageSelector";
import { countries } from "./data/countries";
import { languages } from "./data/languages";

function App() {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const toggleLanguage = (langCode: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(langCode)
        ? prev.filter((l) => l !== langCode)
        : [...prev, langCode]
    );
  };

  const clearLanguages = () => setSelectedLanguages([]);

  const matchingCountryCount = selectedLanguages.length > 0
    ? Object.values(countries).filter((c) =>
        c.official.some((lang) => selectedLanguages.includes(lang))
      ).length
    : 0;

  const selectedLanguageNames = selectedLanguages
    .map((code) => languages[code as keyof typeof languages]?.name ?? code)
    .join(", ");

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      <LanguageSelector
        selectedLanguages={selectedLanguages}
        onToggle={toggleLanguage}
        onClear={clearLanguages}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="px-6 py-4 border-b border-slate-700 shrink-0">
          <h1 className="text-xl font-bold text-white">
            Where Can I Speak My Language?
          </h1>
          {selectedLanguages.length > 0 ? (
            <p className="text-sm text-slate-400 mt-1">
              <span className="text-teal-400 font-medium">{matchingCountryCount}</span>
              {" "}
              {matchingCountryCount === 1 ? "country" : "countries"} speak{matchingCountryCount === 1 ? "s" : ""}{" "}
              <span className="text-slate-300">{selectedLanguageNames}</span>
            </p>
          ) : (
            <p className="text-sm text-slate-500 mt-1">
              Select one or more languages from the sidebar to see where they are spoken
            </p>
          )}
        </header>

        <div className="flex-1 min-h-0">
          <WorldMap selectedLanguages={selectedLanguages} />
        </div>
      </main>
    </div>
  );
}

export default App;
