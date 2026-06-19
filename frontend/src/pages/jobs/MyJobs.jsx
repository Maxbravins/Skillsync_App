import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  getMyJobs,
  deleteJob,
} from "../../services/job.service";

const MyJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] =
    useState("newest");

  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const data =
        await getMyJobs();

      setJobs(data.jobs || []);
    } catch (error) {
      console.error(
        "Error fetching jobs:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete =
    async (jobId) => {
      const confirmDelete =
        window.confirm(
          "Are you sure you want to delete this job listing?"
        );

      if (!confirmDelete)
        return;

      try {
        await deleteJob(jobId);

        setJobs(
          jobs.filter(
            (job) =>
              job._id !== jobId
          )
        );
      } catch (error) {
        console.error(
          "Failed to delete job:",
          error
        );

        alert(
          "Could not delete job. Please try again."
        );
      }
    };

  const sortedJobs =
    [...jobs].sort(
      (a, b) => {
        if (
          sortBy === "newest"
        ) {
          return (
            new Date(
              b.createdAt
            ) -
            new Date(
              a.createdAt
            )
          );
        }

        if (
          sortBy === "highest"
        ) {
          return (
            b.budget -
            a.budget
          );
        }

        if (
          sortBy === "lowest"
        ) {
          return (
            a.budget -
            b.budget
          );
        }

        return 0;
      }
    );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 font-medium">
          Loading your jobs...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">

        <h1 className="text-2xl font-bold text-gray-800">
          My Posted Jobs
        </h1>

        <div className="flex gap-3">

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value
              )
            }
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="newest">
              Newest
            </option>

            <option value="highest">
              Highest Budget
            </option>

            <option value="lowest">
              Lowest Budget
            </option>
          </select>

          <Link
            to="/create-job"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm"
          >
            + Post a New Job
          </Link>

        </div>
      </div>

      {sortedJobs.length ===
      0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500">
            You haven't posted any jobs yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">

          {sortedJobs.map(
            (job) => (
              <div
                key={job._id}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:justify-between gap-6">

                  {/* Job Info */}
                  <div className="flex-1">

                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {job.title}
                    </h2>

                    <p className="text-gray-600 mb-4">
                      {
                        job.description
                      }
                    </p>

                    <div className="flex flex-wrap gap-3 mb-4">

                      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md text-sm">
                        Budget:
                        {" "}
                        KES
                        {" "}
                        {job.budget?.toLocaleString()}
                      </span>

                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm">
                        Posted:
                        {" "}
                        {new Date(
                          job.createdAt
                        ).toLocaleDateString()}
                      </span>

                    </div>

                    {job.skills?.length >
                      0 && (
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map(
                          (
                            skill
                          ) => (
                            <span
                              key={
                                skill
                              }
                              className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs"
                            >
                              {
                                skill
                              }
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-start gap-2">

                    <Link
                      to={`/job-applicants/${job._id}`}
                      className="text-emerald-600 hover:bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg text-sm font-medium"
                    >
                      View Applicants
                    </Link>

                    <button
                      onClick={() =>
                        navigate(
                          `/edit-job/${job._id}`
                        )
                      }
                      className="text-gray-600 hover:bg-gray-100 border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(
                          job._id
                        )
                      }
                      className="text-red-600 hover:bg-red-50 border border-red-200 px-3 py-2 rounded-lg text-sm font-medium"
                    >
                      Delete
                    </button>

                  </div>
                </div>
              </div>
            )
          )}

        </div>
      )}
    </div>
  );
};

export default MyJobs;
