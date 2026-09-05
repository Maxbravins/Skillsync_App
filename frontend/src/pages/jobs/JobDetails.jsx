import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  Code2,
  DollarSign,
  LogIn,
  Send,
  User,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import useAuth from "../../hooks/useAuth";
import { applyForJob } from "../../services/application.service";
import { getJobById } from "../../services/job.service";

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchJob = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getJobById(id);
      setJob(data?.job || null);
    } catch (err) {
      console.error("Failed to fetch job:", err);

      setError(
        err.response?.data?.message ||
          "We couldn't load this job. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleApply = async () => {
    // User is not logged in.
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    // Only developers can apply.
    if (user.role !== "developer") {
      return;
    }

    const trimmedCoverLetter = coverLetter.trim();

    if (!trimmedCoverLetter) {
      alert("Please write a cover letter before applying.");
      return;
    }

    if (!job?._id) {
      alert("This job is no longer available.");
      return;
    }

    try {
      setApplying(true);

      const data = await applyForJob(job._id, trimmedCoverLetter);

      alert(data.message || "Application submitted successfully.");

      navigate("/my-applications");
    } catch (err) {
      console.error("Failed to apply for job:", err);

      alert(
        err.response?.data?.message ||
          "Failed to submit application. Please try again.",
      );
    } finally {
      setApplying(false);
    }
  };

  const postedDate = job?.createdAt
    ? new Date(job.createdAt).toLocaleDateString()
    : "Recently";

  const categoryName =
    typeof job?.category === "object"
      ? job.category?.name
      : job?.category;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <Navbar />

        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />

            <p className="mt-5 text-[var(--text-secondary)]">
              Loading job...
            </p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <Navbar />

        <main className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center">
              <Briefcase className="text-red-400" size={30} />
            </div>

            <h1 className="text-2xl font-bold mt-5">
              Job unavailable
            </h1>

            <p className="text-[var(--text-secondary)] mt-3 leading-6">
              {error || "This job could not be found."}
            </p>

            <button
              type="button"
              onClick={() => navigate("/jobs")}
              className="mt-6 inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-3 rounded-lg font-semibold transition"
            >
              <ArrowLeft size={18} />
              Back to Jobs
            </button>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-8 lg:py-10">
          {/* Back */}
          <button
            type="button"
            onClick={() => navigate("/jobs")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-cyan-400 transition mb-7"
          >
            <ArrowLeft size={17} />
            Back to Jobs
          </button>

          <div className="grid lg:grid-cols-[1fr_380px] gap-7 items-start">
            {/* Main Content */}
            <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-hidden">
              {/* Header */}
              <div className="p-6 sm:p-8 border-b border-[var(--border-color)]">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                    <Briefcase
                      size={27}
                      className="text-cyan-400"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-cyan-400 mb-2">
                      FREELANCE PROJECT
                    </p>

                    <h1 className="text-3xl sm:text-4xl font-bold leading-tight break-words">
                      {job.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mt-5 text-sm text-[var(--text-secondary)]">
                      <span className="inline-flex items-center gap-2">
                        <Calendar size={16} />
                        Posted: {postedDate}
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <User size={16} />
                        {job.client?.username || "Client"}
                      </span>

                      {categoryName && (
                        <span className="inline-flex items-center gap-2">
                          <Briefcase size={16} />
                          {categoryName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-6 sm:p-8">
                <h2 className="text-xl font-bold mb-4">
                  About the project
                </h2>

                <p className="text-[var(--text-secondary)] leading-8 whitespace-pre-line">
                  {job.description}
                </p>
              </div>

              {/* Skills */}
              {Array.isArray(job.skills) && job.skills.length > 0 && (
                <div className="px-6 sm:px-8 pb-8">
                  <div className="border-t border-[var(--border-color)] pt-7">
                    <div className="flex items-center gap-2 mb-4">
                      <Code2
                        size={19}
                        className="text-indigo-400"
                      />

                      <h2 className="text-xl font-bold">
                        Required Skills
                      </h2>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {job.skills.map((skill, index) => (
                        <span
                          key={`${skill}-${index}`}
                          className="px-4 py-2 rounded-full text-sm font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Sidebar */}
            <aside className="lg:sticky lg:top-6 space-y-5">
              {/* Budget */}
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
                <p className="text-sm text-[var(--text-secondary)]">
                  Project budget
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <DollarSign
                    size={23}
                    className="text-green-400"
                  />

                  <span className="text-3xl font-bold text-green-400">
                    KES {Number(job.budget || 0).toLocaleString()}
                  </span>
                </div>

                <div className="mt-5 pt-5 border-t border-[var(--border-color)]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">
                      Posted
                    </span>

                    <span className="font-medium">
                      {postedDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Developer Application */}
              {user?.role === "developer" && (
                <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Send
                      size={19}
                      className="text-cyan-400"
                    />

                    <h2 className="text-xl font-bold">
                      Apply for this Job
                    </h2>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] leading-6 mb-5">
                    Introduce yourself and explain why you're a good fit
                    for this project.
                  </p>

                  <textarea
                    rows={8}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Tell the client about your experience, relevant skills, and why you're a good fit..."
                    disabled={applying}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl p-4 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 resize-y disabled:opacity-60"
                  />

                  <div className="flex items-center justify-between mt-2 text-xs text-[var(--text-secondary)]">
                    <span>
                      {coverLetter.trim().length} characters
                    </span>

                    <span>
                      Cover letter required
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={applying || !coverLetter.trim()}
                    className="w-full mt-4 inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3.5 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} />

                    {applying ? "Submitting..." : "Apply Now"}
                  </button>
                </div>
              )}

              {/* Client */}
              {user?.role === "client" && (
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
                    <Briefcase
                      size={21}
                      className="text-indigo-400"
                    />
                  </div>

                  <h2 className="text-xl font-bold">
                    You're browsing as a client
                  </h2>

                  <p className="text-sm text-[var(--text-secondary)] leading-6 mt-2">
                    Clients can post projects and review applications
                    from their dashboard.
                  </p>

                  <Link
                    to="/create-job"
                    className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-3 font-semibold transition"
                  >
                    <Briefcase size={17} />
                    Post a Job
                  </Link>
                </div>
              )}

              {/* Logged Out */}
              {!user && (
                <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 p-6">
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
                    <Send
                      size={21}
                      className="text-cyan-400"
                    />
                  </div>

                  <h2 className="text-xl font-bold">
                    Interested in this project?
                  </h2>

                  <p className="text-sm text-[var(--text-secondary)] leading-6 mt-2">
                    Sign in or create a free developer account to apply
                    for this job.
                  </p>

                  <div className="space-y-3 mt-5">
                    <button
                      type="button"
                      onClick={handleApply}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-3 font-bold transition"
                    >
                      <LogIn size={17} />
                      Login to Apply
                    </button>

                    <Link
                      to={`/register?redirect=${encodeURIComponent(
                        location.pathname,
                      )}`}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] hover:border-cyan-500 text-[var(--text-primary)] px-5 py-3 font-semibold transition"
                    >
                      <UserPlus size={17} />
                      Create Free Account
                    </Link>
                  </div>
                </div>
              )}

              {/* Trust / Marketplace Info */}
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
                <h3 className="font-bold">
                  Why SkillSync?
                </h3>

                <div className="space-y-4 mt-4">
                  <div className="flex gap-3">
                    <CheckCircle2
                      size={18}
                      className="shrink-0 text-green-400 mt-0.5"
                    />

                    <p className="text-sm text-[var(--text-secondary)]">
                      Discover projects that match your skills.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <CheckCircle2
                      size={18}
                      className="shrink-0 text-green-400 mt-0.5"
                    />

                    <p className="text-sm text-[var(--text-secondary)]">
                      Connect directly with clients and professionals.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <CheckCircle2
                      size={18}
                      className="shrink-0 text-green-400 mt-0.5"
                    />

                    <p className="text-sm text-[var(--text-secondary)]">
                      Build your professional reputation through
                      successful projects.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default JobDetails;
