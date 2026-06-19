import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getMyJobs, deleteJob } from "../../services/job.service";

const MyJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const data = await getMyJobs();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (window.confirm("Are you sure you want to delete this job listing?")) {
      try {
        await deleteJob(jobId);

        // Remove the deleted job from local state instantly
        setJobs(jobs.filter((job) => job._id !== jobId));
      } catch (error) {
        console.error("Failed to delete job:", error);
        alert("Could not delete job. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 font-medium">Loading your jobs...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">My Posted Jobs</h1>
        <Link
          to="/create-job"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-sm"
        >
          + Post a New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">You haven't posted any jobs yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 hover:text-emerald-600 cursor-pointer transition-colors">
                  {job.title}
                </h3>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                  {job.description}
                </p>
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                  <span className="font-medium text-gray-800 bg-gray-100 px-2.5 py-1 rounded-md">
                    Budget: KES {job.budget?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center">
                <Link
                  to={`/job-applicants/${job._id}`}
                  className="text-emerald-600 hover:bg-emerald-50 font-medium text-sm py-2 px-3 rounded-lg border border-emerald-200 transition-colors"
                >
                  View Applicants
                </Link>
                
                <button
                  onClick={() => navigate(`/edit-job/${job._id}`)}
                  className="text-gray-600 hover:bg-gray-100 font-medium text-sm py-2 px-3 rounded-lg border border-gray-200 transition-colors"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(job._id)}
                  className="text-red-600 hover:bg-red-50 font-medium text-sm py-2 px-3 rounded-lg border border-red-100 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyJobs;