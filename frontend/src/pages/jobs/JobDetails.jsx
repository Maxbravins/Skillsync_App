import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Briefcase, DollarSign, User, Calendar } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { getJobById } from "../../services/job.service";
import { applyForJob } from "../../services/application.service";
import useAuth from "../../hooks/useAuth";

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);

  const fetchJob = useCallback(async () => {
    try {
      const data = await getJobById(id);
      setJob(data.job);
    } catch (error) {
      console.log(error);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleApply = async () => {
    if (!coverLetter.trim()) {
      return alert("Please write your cover letter.");
    }

    try {
      setApplying(true);
      const data = await applyForJob(job._id, coverLetter);
      alert(data.message);
      navigate("/my-applications");
    } catch (error) {
      alert(error.response?.data?.message || "Application submission failed.");
    } finally {
      setApplying(false);
    }
  };

  if (!job) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[var(--bg-primary)] flex justify-center items-center text-[var(--text-primary)] text-xl">
          Loading Job...
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors">
        <div className="flex-1 max-w-5xl mx-auto px-6 py-10 w-full">
          <button
            onClick={() => navigate("/jobs")}
            className="text-cyan-400 hover:text-cyan-300 mb-8 font-medium"
          >
            ← Back to Jobs
          </button>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <Briefcase className="text-cyan-400" size={34} />
              <h1 className="text-4xl font-bold">{job.title}</h1>
            </div>

            <p className="text-[var(--text-secondary)] leading-8 mb-8">
              {job.description}
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="text-green-400" size={20} />
                  <h3 className="font-semibold">Budget</h3>
                </div>
                <p className="text-3xl font-bold text-cyan-400">
                  KES {job.budget?.toLocaleString()}
                </p>
              </div>

              <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <User className="text-indigo-400" size={20} />
                  <h3 className="font-semibold">Client</h3>
                </div>
                <p>{job.client?.username || "Client"}</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-cyan-400" size={18} />
                <span>Posted:</span>
                <strong>
                  {new Date(job.createdAt).toLocaleDateString()}
                </strong>
              </div>

              <h3 className="font-semibold mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-3">
                {job.skills &&
                  job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-cyan-500/20 text-cyan-400 px-4 py-2 rounded-full font-medium"
                    >
                      {skill}
                    </span>
                  ))}
              </div>
            </div>

            {user?.role === "developer" && (
              <div className="border-t border-[var(--border-color)] pt-8">
                <h2 className="text-2xl font-bold mb-4">
                  Apply for this Job
                </h2>

                <textarea
                  rows={7}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Explain why you're the right developer for this project..."
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl p-4 outline-none focus:border-cyan-500 mb-5"
                />

                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 rounded-xl font-bold transition disabled:opacity-50"
                >
                  {applying ? "Submitting..." : "Apply Now"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default JobDetails;