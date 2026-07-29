import { useLanguage } from "../../context/LanguageContext";
import { FaGlobe } from "react-icons/fa";

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: "en", label: "English" },
    { code: "sw", label: "Kiswahili" },
    { code: "fr", label: "Français" },
  ];

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
        <FaGlobe />
        <span className="uppercase">{language}</span>
      </button>
      <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 hidden group-hover:block">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${
              language === lang.code ? "bg-slate-100 dark:bg-slate-700" : ""
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;