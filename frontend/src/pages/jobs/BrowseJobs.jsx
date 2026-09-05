import {
  Briefcase,
  CheckCircle2,
  Code2,
  DollarSign,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import { getAllJobs } from "../../services/job.service";

const BrowseJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [skill, setSkill] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getAllJobs();
      setJobs(data?.jobs || []);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const filteredJobs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedSkill = skill.trim().toLowerCase();

    return jobs.filter((job) => {
      const title = job.title?.toLowerCase() || "";
      const description = job.description?.toLowerCase() || "";
      const jobSkills = Array.isArray(job.skills)
        ? job.skills.map((item) => item?.toLowerCase() || "")
        : [];

      const matchesSearch =
        normalizedSearch === "" ||
        title.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        jobSkills.some((item) => item.includes(normalizedSearch));

      const matchesBudget =
        minBudget === "" ||
        Number(job.budget || 0) >= Number(minBudget);

      const matchesSkill =
        normalizedSkill === "" ||
        jobSkills.some((item) => item.includes(normalizedSkill));

      return matchesSearch && matchesBudget && matchesSkill;
    });
  }, [jobs, search, minBudget, skill]);

  const clearFilters = () => {
    setSearch("");
    setMinBudget("");
    setSkill("");
  };

  const hasFilters =
    search.trim() !== "" ||
    minBudget !== "" ||
    skill.trim() !== "";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <Navbar />

      <main className="flex-1">
        {/* Hero / Search Section */}
        <section className="border-b border-[var(--border-color)] bg-gradient-to-br from-cyan-500/10 via-[var(--bg-primary)] to-indigo-500/10">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 py-12 lg:py-16">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 mb-5">
                <CheckCircle2 size={16} />
                Find your next opportunity
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Find work that matches your{" "}
                <span className="text-cyan-400">skills.</span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl leading-7">
                Explore opportunities from clients looking for talented
                developers and professionals. Browse freely and find the
                project that's right for you.
              </p>
            </div>

            {/* Main Search */}
            <div className="mt-8 max-w-4xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search
                    size={21}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search jobs, skills, or keywords..."
                    className="w-full h-14 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] pl-12 pr-4 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowFilters((current) => !current)}
                  className="h-14 px-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-cyan-500 text-[var(--text-primary)] font-semibold flex items-center justify-center gap-2 transition"
                >
                  <SlidersHorizontal size={19} />
                  Filters
                </button>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="mt-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Minimum budget
                      </label>

                      <div className="relative">
                        <DollarSign
                          size={17}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
                        />

                        <input
                          type="number"
                          min="0"
                          value={minBudget}
                          onChange={(e) => setMinBudget(e.target.value)}
                          placeholder="e.g. 5000"
                          className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] py-3 pl-10 pr-3 outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Required skill
                      </label>

                      <div className="relative">
                        <Code2
                          size={17}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
                        />

                        <input
                          type="text"
                          value={skill}
                          onChange={(e) => setSkill(e.target.value)}
                          placeholder="e.g. React, Node.js"
                          className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] py-3 pl-10 pr-3 outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>

                  {hasFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition"
                    >
                      <X size={16} />
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Jobs */}
        <section className="max-w-7xl mx-auto px-5 sm:px-6 py-10 lg:py-12 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
            <div>
              <p className="text-sm font-semibold text-cyan-400 mb-1">
                OPPORTUNITIES
              </p>

              <h2 className="text-2xl sm:text-3xl font-bold">
                Latest jobs
              </h2>

              <p className="mt-2 text-[var(--text-secondary)]">
                {loading
                  ? "Finding opportunities..."
                  : `${filteredJobs.length} ${
                      filteredJobs.length === 1 ? "job" : "jobs"
                    } available`}
              </p>
            </div>

            {hasFilters && !loading && (
              <button
                type="button"
                onClick={clearFilters}
                className="self-start sm:self-auto text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition"
              >
                Clear search
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid lg:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 animate-pulse"
                >
                  <div className="h-5 w-2/3 bg-[var(--border-color)] rounded mb-5" />
                  <div className="h-4 w-full bg-[var(--border-color)] rounded mb-3" />
                  <div className="h-4 w-5/6 bg-[var(--border-color)] rounded mb-7" />
                  <div className="flex gap-2">
                    <div className="h-7 w-20 bg-[var(--border-color)] rounded-full" />
                    <div className="h-7 w-24 bg-[var(--border-color)] rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-10 sm:p-16 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-5">
                <Search
                  size={30}
                  className="text-cyan-400"
                />
              </div>

              <h2 className="text-2xl font-bold">
                No jobs found
              </h2>

              <p className="mt-3 text-[var(--text-secondary)] max-w-md mx-auto leading-6">
                Try changing your search terms or filters. New opportunities
                will appear here as clients post them.
              </p>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-3 font-semibold transition"
                >
                  <X size={17} />
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-5">
              {filteredJobs.map((job) => (
                <article
                  key={job._id}
                  className="group rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 hover:border-cyan-500/60 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-200"
                >
                  {/* Job Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="shrink-0 w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                        <Briefcase
                          size={21}
                          className="text-cyan-400"
                        />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-xl font-bold leading-7 group-hover:text-cyan-400 transition-colors">
                          {job.title}
                        </h3>

                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                          Open project opportunity
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mt-5 text-[var(--text-secondary)] leading-6 line-clamp-3">
                    {job.description}
                  </p>

                  {/* Budget */}
                  <div className="mt-5 flex items-center justify-between rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <DollarSign
                        size={18}
                        className="text-green-400"
                      />

                      <span className="text-sm text-[var(--text-secondary)]">
                        Budget
                      </span>
                    </div>

                    <span className="font-bold text-green-400">
                      KES {Number(job.budget || 0).toLocaleString()}
                    </span>
                  </div>

                  {/* Skills */}
                  {Array.isArray(job.skills) && job.skills.length > 0 && (
                    <div className="mt-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Code2
                          size={17}
                          className="text-indigo-400"
                        />

                        <span className="text-sm font-semibold">
                          Skills
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {job.skills.slice(0, 6).map((item, index) => (
                          <span
                            key={`${item}-${index}`}
                            className="px-3 py-1.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          >
                            {item}
                          </span>
                        ))}

                        {job.skills.length > 6 && (
                          <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                            +{job.skills.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-7 pt-5 border-t border-[var(--border-color)] flex items-center justify-between gap-4">
                    <span className="text-xs text-[var(--text-secondary)]">
                      Browse freely • Apply after signing in
                    </span>

                    <Link
                      to={`/jobs/${job._id}`}
                      className="shrink-0 inline-flex items-center justify-center rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2.5 text-sm font-semibold transition"
                    >
                      {t("viewDetails")}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BrowseJobs;
