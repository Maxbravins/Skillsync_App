import {useEffect, useState } from "react";

import { useParams} from "react-router-dom";

import {getJobApplications, updateApplicationStatus } from "../../services/application.service";

const JobApplicants = () => {const { status } =  useParams();

  const [ applications, setApplications ] = useState([]);

  const filteredApplications =
  status === "all"
    ? applications
    : applications.filter(
        (app) => app.status === status
      );

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications =
    async () => {
      try {
       const data =
  await getClientApplications();
  
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

        setApplications(
          applications.map(
            (app) =>
              app._id ===
              applicationId
                ? {
                    ...app,
                    status,
                  }
                : app
          )
        );

        alert(
          `Application ${status}`
        );
      } catch (error) {
        console.log(error);
      }
    };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">

      <div className="max-w-5xl mx-auto">

        <h1 className="text-3xl font-bold mb-8">
          Job Applicants
        </h1>

        {filteredApplications.length ===
        0 ? (
          <div className="bg-slate-900 p-8 rounded-xl text-center">

            No applicants yet.

          </div>
        ) : (
          filteredApplications.map(
            (application) => (
              <div
                key={
                  application._id
                }
                className="
                  bg-slate-900
                  border
                  border-slate-800
                  rounded-xl
                  p-6
                  mb-6
                "
              >
                <h2 className="text-xl font-bold mb-2">

                  {
                    application
                      .developer
                      ?.username
                  }

                </h2>

                <p className="text-slate-400 mb-3">

                  {
                    application
                      .developer
                      ?.email
                  }

                </p>

                <h3 className="font-semibold mb-2">

                  Cover Letter

                </h3>

                <p className="text-slate-300 mb-4">

                  {
                    application.coverLetter
                  }

                </p>

                <p className="mb-4">
                  Status:

                  <span className="ml-2 font-bold capitalize text-cyan-400">

                    {
                      application.status
                    }

                  </span>
                </p>

                {application.status ===
                  "pending" && (
                  <div className="flex gap-4">

                    <button
                      onClick={() =>
                        handleStatus(
                          application._id,
                          "accepted"
                        )
                      }
                      className="
                        bg-green-600
                        hover:bg-green-700
                        px-4
                        py-2
                        rounded-lg
                      "
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
                      className="
                        bg-red-600
                        hover:bg-red-700
                        px-4
                        py-2
                        rounded-lg
                      "
                    >
                      Reject
                    </button>

                  </div>
                )}
              </div>
            )
          )
        )}
      </div>
    </div>
  );
};

export default JobApplicants;