import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getJobApplications, updateApplicationStatus } from "../../services/application.service";

const JobApplicants = () => {
  const { jobId } = useParams();

  const [applications, setApplications] =
    useState([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications =
    async () => {
      try {
        const data =
          await getJobApplications(
            jobId
          );

        setApplications(
          data.applications
        );
      } catch (error) {
        console.log(error);
      }
    };

  const handleStatus =
    async (
      applicationId,
      status
    ) => {
      try {
        await updateApplicationStatus(
          applicationId,
          status
        );

        fetchApplications();
      } catch (error) {
        console.log(error);
      }
    };

  return (
    <div>
      <h1>Applicants</h1>

      {applications.length ===
      0 ? (
        <p>No applicants yet.</p>
      ) : (
        applications.map(
          (application) => (
            <div
              key={
                application._id
              }
            >
              <h3>
                {
                  application
                    .developer
                    ?.username
                }
              </h3>

              <p>
                Email:
                {" "}
                {
                  application
                    .developer
                    ?.email
                }
              </p>

              <p>
                Status:
                {" "}
                {
                  application.status
                }
              </p>

              <p>
                Cover Letter:
              </p>

              <p>
                {
                  application.coverLetter
                }
              </p>

              <button
                onClick={() =>
                  handleStatus(
                    application._id,
                    "accepted"
                  )
                }
              >
                Accept
              </button>

              <button
                onClick={() =>
                  handleStatus(
                    application._id,
                    "rejected"
                  )
                }
              >
                Reject
              </button>

              <hr />
            </div>
          )
        )
      )}
    </div>
  );
};

export default JobApplicants;