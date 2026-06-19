import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getJobById } from "../../services/job.service";
import { applyForJob } from "../../services/application.service";
import useAuth from "../../hooks/useAuth";

const JobDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");

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
  try {
    const data = await applyForJob(
      job._id,
      coverLetter
    );

    alert(data.message);
  } catch (error) {
    alert(error.response?.data?.message);
  }
};

  if (!job) {
    return <h2>Loading...</h2>;
  }

  return (
    <div>
      <h1>{job.title}</h1>

      <p>{job.description}</p>

      <p>
        Budget: KES {job.budget}
      </p>

      <p>
        Skills: {job.skills.join(", ")}
      </p>

      <p>
        Posted By:
        {" "}
        {job.client?.username}
      </p>

      {user?.role ===
        "developer" && (
        <>
          <h3>
            Apply For This Job
          </h3>

          <textarea
            value={coverLetter}
            onChange={(e) =>
              setCoverLetter(
                e.target.value
              )
            }
            placeholder="Write your cover letter..."
          />

          <br />

          <button
            onClick={handleApply}
          >
            Apply
          </button>
        </>
      )}
    </div>
  );
};

export default JobDetails;