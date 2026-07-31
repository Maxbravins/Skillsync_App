import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import { useLanguage } from "../../context/LanguageContext";
import { getJobById, updateJob } from "../../services/job.service";

const EditJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    skills: "",
  });

  const fetchJob = useCallback(async () => {
    try {
      const data = await getJobById(id);
      if (data.job) {
        setFormData({
          title: data.job.title || "",
          description: data.job.description || "",
          budget: data.job.budget || "",
          skills: data.job.skills ? data.job.skills.join(", ") : "",
        });
      }
    } catch (error) {
      console.log(error);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateJob(id, {
        ...formData,
        skills: formData.skills.split(",").map((s) => s.trim()),
      });

      alert(t("jobUpdatedSuccessfully"));
      navigate("/my-jobs");
    } catch (error) {
      console.log(error);
      alert(t("jobUpdateFailed"));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors">
      <Navbar />
      <div className="max-w-3xl mx-auto p-6 py-10">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow rounded-xl p-8">
          <h1 className="text-2xl font-bold mb-6">{t("editJob")}</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("jobTitle")}
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder={t("jobTitle")}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] p-3 rounded-lg outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t("description")}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t("description")}
                rows="5"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] p-3 rounded-lg outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t("budget")} (KES)
              </label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                placeholder={t("budget")}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] p-3 rounded-lg outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t("requiredSkills")}
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="React, Node.js, MongoDB"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] p-3 rounded-lg outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 font-semibold transition"
            >
              {t("updateJob")}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EditJob;
