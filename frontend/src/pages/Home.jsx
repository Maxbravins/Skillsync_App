import {
  ArrowRight,
  Briefcase,
  CheckCircle,
  Code,
  DollarSign,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { getAllJobs } from "../services/job.service";

const Home = () => {
  const [searchParams] = useSearchParams();

  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState("");

  const [search, setSearch] = useState(
    searchParams.get("search") || ""
  );

  const fetchJobs = useCallback(async () => {
    try {
      setLoadingJobs(true);
      setJobsError("");

      const data = await getAllJobs(1, 6);

      setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
    } catch (error) {
      console.error("Failed to load jobs:", error);
      setJobsError(
        error.response?.data?.message ||
          "Unable to load jobs right now. Please try again."
      );
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return jobs.slice(0, 6);
    }

    return jobs
      .filter((job) => {
        const title = job.title?.toLowerCase() || "";
        const description = job.description?.toLowerCase() || "";
        const skills = Array.isArray(job.skills)
          ? job.skills.join(" ").toLowerCase()
          : "";

        return (
          title.includes(query) ||
          description.includes(query) ||
          skills.includes(query)
        );
      })
      .slice(0, 6);
  }, [jobs, search]);

  const searchUrl = search.trim()
    ? `/jobs?search=${encodeURIComponent(search.trim())}`
    : "/jobs";

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div
          className="absolute top-20 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-7">
              <CheckCircle size={16} aria-hidden="true" />
              Kenya's growing freelance marketplace
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              Find great work.
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
                Hire great talent.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto mt-6 text-lg md:text-xl text-[var(--text-secondary)] leading-8">
              SkillSync connects skilled developers with clients looking for
              reliable talent. Discover opportunities, build your reputation,
              and get work done.
            </p>

            {/* Search */}
            <div className="max-w-3xl mx-auto mt-10">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  window.location.href = searchUrl;
                }}
                className="flex flex-col sm:flex-row gap-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-3 rounded-2xl shadow-xl"
              >
                <div className="flex-1 flex items-center gap-3 px-3">
                  <Search
                    className="text-cyan-400 shrink-0"
                    size={22}
                    aria-hidden="true"
                  />

                  <label htmlFor="job-search" className="sr-only">
                    Search jobs
                  </label>

                  <input
                    id="job-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="What work are you looking for?"
                    autoComplete="off"
                    className="w-full bg-transparent outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
                  />
                </div>

                <Link
                  to={searchUrl}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white px-7 py-3 rounded-xl font-bold transition"
                >
                  Search Jobs
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </form>
            </div>

            {/* Main CTAs */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              <Link
                to="/jobs"
                className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-7 py-3.5 rounded-xl font-bold transition"
              >
                <Search size={19} aria-hidden="true" />
                Find Work
              </Link>

              <Link
                to="/register?role=client"
                className="inline-flex items-center justify-center gap-2 border border-[var(--border-color)] hover:border-cyan-500 bg-[var(--bg-secondary)] px-7 py-3.5 rounded-xl font-bold transition"
              >
                <Users size={19} aria-hidden="true" />
                Hire Talent
              </Link>
            </div>

            <p className="mt-5 text-sm text-[var(--text-secondary)]">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <Briefcase
                className="mx-auto text-cyan-400 mb-3"
                size={28}
                aria-hidden="true"
              />
              <h3 className="text-2xl font-bold">
                {loadingJobs ? "—" : `${jobs.length}+`}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Available Jobs
              </p>
            </div>

            <div className="text-center">
              <Code
                className="mx-auto text-indigo-400 mb-3"
                size={28}
                aria-hidden="true"
              />
              <h3 className="text-2xl font-bold">Skilled</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Developers
              </p>
            </div>

            <div className="text-center">
              <ShieldCheck
                className="mx-auto text-green-400 mb-3"
                size={28}
                aria-hidden="true"
              />
              <h3 className="text-2xl font-bold">Secure</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Marketplace
              </p>
            </div>

            <div className="text-center">
              <DollarSign
                className="mx-auto text-yellow-400 mb-3"
                size={28}
                aria-hidden="true"
              />
              <h3 className="text-2xl font-bold">KES</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Local Payments
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Jobs */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-cyan-400 font-semibold mb-2">
              OPPORTUNITIES
            </p>

            <h2 className="text-3xl md:text-4xl font-bold">
              Latest jobs
            </h2>

            <p className="text-[var(--text-secondary)] mt-2">
              Explore opportunities from clients on SkillSync.
            </p>
          </div>

          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            View all jobs
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>

        {loadingJobs ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 animate-pulse"
              >
                <div className="w-11 h-11 rounded-xl bg-slate-700/50" />
                <div className="h-6 bg-slate-700/50 rounded mt-5 w-3/4" />
                <div className="h-4 bg-slate-700/50 rounded mt-4 w-full" />
                <div className="h-4 bg-slate-700/50 rounded mt-2 w-5/6" />
                <div className="h-10 bg-slate-700/50 rounded mt-6" />
              </div>
            ))}
          </div>
        ) : jobsError ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-10 text-center">
            <h3 className="text-xl font-bold text-red-400">
              Unable to load jobs
            </h3>

            <p className="text-[var(--text-secondary)] mt-2">
              {jobsError}
            </p>

            <button
              type="button"
              onClick={fetchJobs}
              className="mt-6 bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-lg font-semibold transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-12 text-center">
            <Briefcase
              size={50}
              className="mx-auto text-[var(--text-secondary)] mb-4"
              aria-hidden="true"
            />

            <h3 className="text-xl font-bold">
              {search.trim()
                ? "No matching jobs found"
                : "No jobs available yet"}
            </h3>

            <p className="text-[var(--text-secondary)] mt-2">
              {search.trim()
                ? "Try a different search term."
                : "Check back soon for new opportunities."}
            </p>

            {search.trim() && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-5 text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <article
                key={job._id}
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 hover:border-cyan-500/60 hover:-translate-y-1 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <Briefcase
                      size={22}
                      className="text-cyan-400"
                      aria-hidden="true"
                    />
                  </div>

                  <span className="text-green-400 font-bold text-sm whitespace-nowrap">
                    KES{" "}
                    {typeof job.budget === "number"
                      ? job.budget.toLocaleString()
                      : "—"}
                  </span>
                </div>

                <h3 className="text-xl font-bold mt-5 line-clamp-2">
                  {job.title || "Untitled Job"}
                </h3>

                <p className="text-[var(--text-secondary)] mt-3 text-sm leading-6 line-clamp-3">
                  {job.description || "No description provided."}
                </p>

                {Array.isArray(job.skills) && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-5">
                    {job.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <Link
                  to={`/jobs/${job._id}`}
                  className="flex items-center justify-center gap-2 w-full mt-6 border border-[var(--border-color)] hover:border-cyan-500 hover:text-cyan-400 py-2.5 rounded-lg font-semibold transition"
                >
                  View Job
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Two-Sided Marketplace */}
      <section className="bg-[var(--bg-secondary)] border-y border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-cyan-400 font-semibold mb-2">
              ONE MARKETPLACE
            </p>

            <h2 className="text-3xl md:text-4xl font-bold">
              Built for both sides of freelance work
            </h2>

            <p className="text-[var(--text-secondary)] mt-4 leading-7">
              Whether you're building your career or building your business,
              SkillSync gives you the tools to connect.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 rounded-3xl p-8 md:p-10">
              <Code
                size={44}
                className="text-cyan-400 mb-6"
                aria-hidden="true"
              />

              <h3 className="text-3xl font-bold">
                Find work that matches your skills
              </h3>

              <p className="text-[var(--text-secondary)] mt-4 leading-7">
                Discover projects, submit proposals, build your profile, and
                grow your freelance career.
              </p>

              <ul className="space-y-3 mt-7 text-sm">
                <li className="flex items-center gap-3">
                  <CheckCircle
                    size={18}
                    className="text-cyan-400"
                    aria-hidden="true"
                  />
                  Browse jobs publicly
                </li>

                <li className="flex items-center gap-3">
                  <CheckCircle
                    size={18}
                    className="text-cyan-400"
                    aria-hidden="true"
                  />
                  Apply with your proposal
                </li>

                <li className="flex items-center gap-3">
                  <CheckCircle
                    size={18}
                    className="text-cyan-400"
                    aria-hidden="true"
                  />
                  Build your professional profile
                </li>
              </ul>

              <Link
                to="/register?role=developer"
                className="inline-flex items-center gap-2 mt-8 bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-xl font-bold transition"
              >
                Start freelancing
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 rounded-3xl p-8 md:p-10">
              <Users
                size={44}
                className="text-indigo-400 mb-6"
                aria-hidden="true"
              />

              <h3 className="text-3xl font-bold">
                Find the talent you need
              </h3>

              <p className="text-[var(--text-secondary)] mt-4 leading-7">
                Post your project, receive applications from skilled
                developers, and choose the right person for the job.
              </p>

              <ul className="space-y-3 mt-7 text-sm">
                <li className="flex items-center gap-3">
                  <CheckCircle
                    size={18}
                    className="text-indigo-400"
                    aria-hidden="true"
                  />
                  Create and manage jobs
                </li>

                <li className="flex items-center gap-3">
                  <CheckCircle
                    size={18}
                    className="text-indigo-400"
                    aria-hidden="true"
                  />
                  Review developer applications
                </li>

                <li className="flex items-center gap-3">
                  <CheckCircle
                    size={18}
                    className="text-indigo-400"
                    aria-hidden="true"
                  />
                  Manage your projects
                </li>
              </ul>

              <Link
                to="/register?role=client"
                className="inline-flex items-center gap-2 mt-8 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold transition"
              >
                Start hiring
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-cyan-400 font-semibold mb-2">
            SIMPLE PROCESS
          </p>

          <h2 className="text-3xl md:text-4xl font-bold">
            How SkillSync works
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {[
            {
              number: "1",
              title: "Create your account",
              description:
                "Choose whether you're here to find work or hire skilled talent.",
              color: "cyan",
            },
            {
              number: "2",
              title: "Connect",
              description:
                "Developers apply to jobs while clients discover the right professionals for their projects.",
              color: "indigo",
            },
            {
              number: "3",
              title: "Get things done",
              description:
                "Work together, complete projects, and build lasting professional relationships.",
              color: "green",
            },
          ].map((step) => (
            <div key={step.number} className="text-center">
              <div
                className={`w-14 h-14 mx-auto rounded-2xl bg-${step.color}-500/10 text-${step.color}-400 flex items-center justify-center text-xl font-bold`}
              >
                {step.number}
              </div>

              <h3 className="text-xl font-bold mt-5">
                {step.title}
              </h3>

              <p className="text-[var(--text-secondary)] mt-3 leading-6">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden bg-gradient-to-r from-cyan-600 to-indigo-600 p-10 md:p-16 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white">
            Your next opportunity starts here.
          </h2>

          <p className="max-w-2xl mx-auto text-cyan-50 mt-5 text-lg">
            Join SkillSync and become part of a marketplace built to connect
            clients with skilled professionals.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Link
              to="/register?role=developer"
              className="bg-white text-slate-900 hover:bg-slate-100 px-7 py-3.5 rounded-xl font-bold transition"
            >
              I'm a Developer
            </Link>

            <Link
              to="/register?role=client"
              className="bg-slate-950/30 text-white border border-white/30 hover:bg-slate-950/50 px-7 py-3.5 rounded-xl font-bold transition"
            >
              I'm a Client
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
