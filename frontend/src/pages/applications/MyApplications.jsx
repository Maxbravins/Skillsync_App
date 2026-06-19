import { useEffect, useState } from "react";
import { getMyApplications } from "../../services/application.service";

const MyApplications = () => {
  const [applications, setApplications] =
    useState([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications =
    async () => {
      try {
        const data =
          await getMyApplications();

        setApplications(
          data.applications
        );
      } 
      catch (error) {
        console.log(error);
      }
    };

  return (
    <div>
      <h1>My Applications</h1>

      {applications.length === 0 ? (
        <p>
          No applications found.
        </p>
      ) : (
        applications.map(
          (application) => (
            <div
              key={application._id}
            >
              <h3>
                {
                  application.job
                    ?.title
                }
              </h3>

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

              <hr />
            </div>
          )
        )
      )}
    </div>
  );
};

export default MyApplications;