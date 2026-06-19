
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAllJobs } from "../../services/job.service";

const BrowseJobs = () => {
  const [jobs, setJobs] = useState([]);
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
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesBudget =
      minBudget === "" ||
      job.budget >= Number(minBudget);

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
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-4xl font-bold mb-8">
        Available Jobs
      </h1>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="border p-3 rounded-lg"
          />

          <input
            type="number"
            placeholder="Minimum Budget"
            value={minBudget}
            onChange={(e) =>
              setMinBudget(e.target.value)
            }
            className="border p-3 rounded-lg"
          />

          <input
            type="text"
            placeholder="Skill (React, Node...)"
            value={skill}
            onChange={(e) =>
              setSkill(e.target.value)
            }
            className="border p-3 rounded-lg"
          />

        </div>
      </div>

      {/* Job Cards */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl">
            No jobs found.
          </h2>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredJobs.map((job) => (
            <div
              key={job._id}
              className="bg-white p-6 rounded-xl shadow"
            >
              <h2 className="text-2xl font-bold mb-3">
                {job.title}
              </h2>

              <p className="text-gray-600 mb-3">
                {job.description}
              </p>

              <p className="font-semibold mb-2">
                Budget: KES {job.budget}
              </p>

              <p className="mb-4">
                Skills:
                {" "}
                {job.skills.join(", ")}
              </p>

              <Link
                to={`/jobs/${job._id}`}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseJobs;
