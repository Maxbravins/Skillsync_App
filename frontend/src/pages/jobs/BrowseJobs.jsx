import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Briefcase,
  DollarSign,
  Code,
} from "lucide-react";

import Navbar from "../../components/Navbar";
import { getAllJobs } from "../../services/job.service";

const BrowseJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [skill, setSkill] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const data = await getAllJobs();
      setJobs(data.jobs);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesBudget =
      minBudget === "" ||
      Number(job.budget) >= Number(minBudget);

    const matchesSkill =
      skill === "" ||
      job.skills.some((s) =>
        s.toLowerCase().includes(skill.toLowerCase())
      );

    return (
      matchesSearch &&
      matchesBudget &&
      matchesSkill
    );
  });

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-slate-950 text-white">

        <div className="max-w-7xl mx-auto px-6 py-10">

          <div className="mb-10">

            <h1 className="text-4xl font-bold">
              Browse Jobs
            </h1>

            <p className="text-slate-400 mt-2">
              Discover freelance opportunities that match your skills.
            </p>

          </div>

          {/* Filters */}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-10">

            <div className="grid md:grid-cols-3 gap-5">

              <input
                type="text"
                placeholder="Search job title..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="bg-slate-950 border border-slate-700 rounded-lg p-3 outline-none focus:border-cyan-500"
              />

              <input
                type="number"
                placeholder="Minimum Budget"
                value={minBudget}
                onChange={(e) =>
                  setMinBudget(e.target.value)
                }
                className="bg-slate-950 border border-slate-700 rounded-lg p-3 outline-none focus:border-cyan-500"
              />

              <input
                type="text"
                placeholder="Required Skill"
                value={skill}
                onChange={(e) =>
                  setSkill(e.target.value)
                }
                className="bg-slate-950 border border-slate-700 rounded-lg p-3 outline-none focus:border-cyan-500"
              />

            </div>

          </div>

          {loading ? (

            <div className="text-center py-20 text-slate-400 text-xl">
              Loading jobs...
            </div>

          ) : filteredJobs.length === 0 ? (

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">

              <Search
                size={60}
                className="mx-auto text-slate-600 mb-4"
              />

              <h2 className="text-2xl font-bold">
                No Jobs Found
              </h2>

              <p className="text-slate-400 mt-3">
                Try adjusting your search filters.
              </p>

            </div>

          ) : (

            <div className="grid lg:grid-cols-2 gap-6">

              {filteredJobs.map((job) => (

                <div
                  key={job._id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-cyan-500 transition"
                >

                  <div className="flex justify-between items-start">

                    <div>

                      <div className="flex items-center gap-3">

                        <Briefcase
                          className="text-cyan-400"
                          size={30}
                        />

                        <h2 className="text-2xl font-bold">
                          {job.title}
                        </h2>

                      </div>

                    </div>

                  </div>

                  <p className="text-slate-400 mt-5 leading-7">
                    {job.description}
                  </p>

                  <div className="flex items-center gap-2 mt-5">

                    <DollarSign
                      className="text-green-400"
                      size={18}
                    />

                    <span className="font-semibold">
                      Budget:
                    </span>

                    <span className="text-cyan-400 font-bold">
                      KES {job.budget}
                    </span>

                  </div>

                  <div className="mt-5">

                    <div className="flex items-center gap-2 mb-3">

                      <Code
                        className="text-indigo-400"
                        size={18}
                      />

                      <span className="font-semibold">
                        Required Skills
                      </span>

                    </div>

                    <div className="flex flex-wrap gap-2">

                      {job.skills.map((item, index) => (

                        <span
                          key={index}
                          className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-sm"
                        >
                          {item}
                        </span>

                      ))}

                    </div>

                  </div>

                  <div className="mt-8">

                    <Link
                      to={`/jobs/${job._id}`}
                      className="inline-block bg-cyan-500 hover:bg-cyan-600 px-5 py-3 rounded-lg font-semibold transition"
                    >
                      View Details
                    </Link>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>
    </>
  );
};

export default BrowseJobs;