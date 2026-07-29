import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Mail,
  FileText,
  User,
} from "lucide-react";

import {
  getJobApplications,
  updateApplicationStatus,
} from "../../services/application.service";

import Navbar from "../../components/Navbar";

const JobApplicants = () => {
  const { jobId } = useParams();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const data = await getJobApplications(jobId);
      setApplications(data.applications);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (
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

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-950 flex justify-center items-center text-white text-xl">
          Loading applicants...
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-slate-950 text-white">

        <div className="max-w-6xl mx-auto px-6 py-10">

          <div className="mb-10">
            <h1 className="text-4xl font-bold">
              Job Applicants
            </h1>

            <p className="text-slate-400 mt-2">
              Review applications submitted by developers.
            </p>
          </div>

          {applications.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">

              <h2 className="text-2xl font-bold mb-3">
                No Applications Yet
              </h2>

              <p className="text-slate-400">
                Developers haven't applied for this job yet.
              </p>

            </div>
          ) : (

            <div className="space-y-6">

              {applications.map((application) => (

                <div
                  key={application._id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-cyan-500 transition"
                >

                  <div className="flex justify-between items-start">

                    <div>

                      <div className="flex items-center gap-2">

                        <User className="w-5 h-5 text-cyan-400" />

                        <h2 className="text-xl font-bold">
                          {application.developer?.username}
                        </h2>

                      </div>

                      <div className="flex items-center gap-2 mt-2 text-slate-400">

                        <Mail className="w-4 h-4" />

                        {application.developer?.email}

                      </div>

                    </div>

                    <span
                      className={`px-4 py-1 rounded-full text-sm font-semibold capitalize
                      ${
                        application.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : application.status === "accepted"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {application.status}
                    </span>

                  </div>

                  <div className="mt-6">

                    <div className="flex items-center gap-2 mb-2">

                      <FileText className="w-5 h-5 text-cyan-400" />

                      <h3 className="font-semibold">
                        Cover Letter
                      </h3>

                    </div>

                    <p className="text-slate-300 leading-7 bg-slate-950 border border-slate-800 rounded-lg p-4">
                      {application.coverLetter}
                    </p>

                  </div>

                  {application.status === "pending" && (

                    <div className="flex gap-4 mt-6">

                      <button
                        onClick={() =>
                          handleStatus(
                            application._id,
                            "accepted"
                          )
                        }
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg transition"
                      >
                        <CheckCircle size={18} />
                        Accept
                      </button>

                      <button
                        onClick={() =>
                          handleStatus(
                            application._id,
                            "rejected"
                          )
                        }
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg transition"
                      >
                        <XCircle size={18} />
                        Reject
                      </button>

                    </div>

                  )}

                </div>

              ))}

            </div>

          )}

        </div>

      </div>
    </>
  );
};

export default JobApplicants;