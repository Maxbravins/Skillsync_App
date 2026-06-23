import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

  useEffect(() => {
    fetchJob();
  }, []);

  const fetchJob = async () => {
    try {
      const data = await getJobById(id);
      setJob(data.job);
    } catch (error) {
      console.log(error);
    }
  };

  const handleApply = async () => {
    if (!coverLetter.trim()) {
      return alert(
        "Please write a cover letter."
      );
    }

    try {
      setApplying(true);

      const data =
        await applyForJob(
          job._id,
          coverLetter
        );

      alert(data.message);

      navigate(
        "/my-applications"
      );
    } catch (error) {
      alert(
        error.response?.data
          ?.message
      );
    } finally {
      setApplying(false);
    }
  };

  if (!job) {
    return (
      <div className="flex justify-center items-center h-screen text-white bg-slate-950">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">

      <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-lg">

        <button
          onClick={() =>
            navigate("/jobs")
          }
          className="mb-6 text-cyan-400 hover:text-cyan-300"
        >
          ← Back to Jobs
        </button>

        <h1 className="text-3xl font-bold mb-4">
          {job.title}
        </h1>

        <p className="text-slate-400 mb-6">
          {job.description}
        </p>

        <div className="space-y-3 mb-8">

          <p>
            <span className="font-semibold">
              Budget:
            </span>{" "}
            KES{" "}
            {job.budget?.toLocaleString()}
          </p>

          <p>
            <span className="font-semibold">
              Skills:
            </span>{" "}
            {job.skills?.join(", ")}
          </p>

          <p>
            <span className="font-semibold">
              Posted By:
            </span>{" "}
            {job.client?.username}
          </p>

          <p>
            <span className="font-semibold">
              Posted On:
            </span>{" "}
            {new Date(
              job.createdAt
            ).toLocaleDateString()}
          </p>

        </div>

        {user?.role ===
          "developer" && (
          <>
            <h2 className="text-xl font-semibold mb-4">
              Apply For This Job
            </h2>

            <textarea
              rows="6"
              value={
                coverLetter
              }
              onChange={(e) =>
                setCoverLetter(
                  e.target.value
                )
              }
              placeholder="Write your cover letter..."
              className="
                w-full
                bg-slate-950
                border
                border-slate-700
                rounded-lg
                p-4
                text-white
                mb-4
                focus:outline-none
                focus:border-cyan-500
              "
            />

            <button
              onClick={
                handleApply
              }
              disabled={
                applying
              }
              className="
                bg-cyan-500
                hover:bg-cyan-600
                px-6
                py-3
                rounded-lg
                font-semibold
                disabled:bg-gray-500
              "
            >
              {applying
                ? "Applying..."
                : "Apply Now"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default JobDetails;