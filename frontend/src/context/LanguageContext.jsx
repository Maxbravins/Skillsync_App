import { createContext, useState, useContext, useEffect } from "react";

const LanguageContext = createContext();

// Translations
export const translations = {
  en: {
    // Auth
    login: "Login",
    register: "Register",
    email: "Email",
    password: "Password",
    username: "Username",
    role: "Role",
    // Jobs
    jobs: "Jobs",
    browseJobs: "Browse Jobs",
    createJob: "Create Job",
    myJobs: "My Jobs",
    jobTitle: "Job Title",
    description: "Description",
    budget: "Budget",
    skills: "Skills",
    // Dashboard
    dashboard: "Dashboard",
    profile: "Profile",
    notifications: "Notifications",
    // Common
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    loading: "Loading...",
    noData: "No data found",
    search: "Search",
    filter: "Filter",
    // Applications
    applications: "Applications",
    apply: "Apply",
    coverLetter: "Cover Letter",
    applicants: "Applicants",
    status: "Status",
    pending: "Pending",
    accepted: "Accepted",
    rejected: "Rejected",
  },
  sw: {
    // Swahili
    login: "Ingia",
    register: "Jisajili",
    email: "Barua pepe",
    password: "Nenosiri",
    username: "Jina la mtumiaji",
    role: "Jukumu",
    jobs: "Kazi",
    browseJobs: "Tazama Kazi",
    createJob: "Tengeneza Kazi",
    myJobs: "Kazi Zangu",
    jobTitle: "Jina la Kazi",
    description: "Maelezo",
    budget: "Bajeti",
    skills: "Ujuzi",
    dashboard: "Dashibodi",
    profile: "Profaili",
    notifications: "Arifa",
    save: "Hifadhi",
    cancel: "Ghairi",
    delete: "Futa",
    edit: "Hariri",
    loading: "Inapakia...",
    noData: "Hakuna data",
    search: "Tafuta",
    filter: "Chuja",
    applications: "Maombi",
    apply: "Omba",
    coverLetter: "Barua ya maombi",
    applicants: "Waombaji",
    status: "Hali",
    pending: "Inasubiri",
    accepted: "Imekubaliwa",
    rejected: "Imekataliwa",
  },
  fr: {
    // French
    login: "Connexion",
    register: "S'inscrire",
    email: "E-mail",
    password: "Mot de passe",
    username: "Nom d'utilisateur",
    role: "Rôle",
    jobs: "Emplois",
    browseJobs: "Parcourir les emplois",
    createJob: "Créer un emploi",
    myJobs: "Mes emplois",
    jobTitle: "Titre du poste",
    description: "Description",
    budget: "Budget",
    skills: "Compétences",
    dashboard: "Tableau de bord",
    profile: "Profil",
    notifications: "Notifications",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    edit: "Modifier",
    loading: "Chargement...",
    noData: "Aucune donnée",
    search: "Rechercher",
    filter: "Filtrer",
    applications: "Candidatures",
    apply: "Postuler",
    coverLetter: "Lettre de motivation",
    applicants: "Candidats",
    status: "Statut",
    pending: "En attente",
    accepted: "Accepté",
    rejected: "Rejeté",
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("language");
    return saved || "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);