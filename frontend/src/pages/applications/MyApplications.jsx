import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Briefcase,
  Clock3,
  CheckCircle,
  XCircle,
} from "lucide-react";

import Navbar from "../../components/Navbar";
import { getMyApplications } from "../../services/application.service";

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();

  const status = searchParams.get("status");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const data = await getMyApplications();

      setApplications(data.applications);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications =
    status
      ? applications.filter(
          (application) =>
            application.status === status
        )
      : applications;

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-slate-950 text-white">

        <div className="max-w-6xl mx-auto px-6 py-10">

          <div className="mb-10">

            <h1 className="text-4xl font-bold">
              My Applications
            </h1>

            <p className="text-slate-400 mt-2">
              {status
                ? `Showing ${status} applications`
                : "Track every application you've submitted."}
            </p>

          </div>

          {loading ? (

            <div className="text-center text-slate-400 py-20">
              Loading...
            </div>

          ) : filteredApplications.length === 0 ? (

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">

              <h2 className="text-2xl font-bold">
                No Applications Found
              </h2>

              <p className="text-slate-400 mt-3">
                No applications match this category.
              </p>

            </div>

          ) : (

            <div className="space-y-6">

              {filteredApplications.map((application) => (

                <div
                  key={application._id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-cyan-500 transition"
                >

                  <div className="flex justify-between items-center">

                    <div className="flex items-center gap-3">

                      <Briefcase
                        className="text-cyan-400"
                        size={30}
                      />

                      <div>

                        <h2 className="text-xl font-bold">
                          {application.job?.title}
                        </h2>

                        <p className="text-slate-400">
                          Budget: KES {application.job?.budget}
                        </p>

                      </div>

                    </div>

                    {application.status ===
                      "pending" && (

                      <span className="flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full">

                        <Clock3 size={18} />

                        Pending

                      </span>

                    )}

                    {application.status ===
                      "accepted" && (

                      <span className="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full">

                        <CheckCircle size={18} />

                        Accepted

                      </span>

                    )}

                    {application.status ===
                      "rejected" && (

                      <span className="flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-full">

                        <XCircle size={18} />

                        Rejected

                      </span>

                    )}

                  </div>

                  <div className="mt-6">

                    <h3 className="font-semibold mb-2">
                      Cover Letter
                    </h3>

                    <p className="text-slate-300 leading-7 bg-slate-950 border border-slate-800 rounded-lg p-4">
                      {application.coverLetter}
                    </p>

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

export default MyApplications;