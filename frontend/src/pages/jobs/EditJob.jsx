import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getJobById, updateJob } from "../../services/job.service";

const EditJob = () => {
  const { id } = useParams();
  const navigate =
    useNavigate();

  const [formData, setFormData] =
    useState({
      title: "",
      description: "",
      budget: "",
      skills: "",
    });

  useEffect(() => {
    fetchJob();
  }, []);

  const fetchJob =
    async () => {
      try {
        const data =
          await getJobById(id);

        setFormData({
          title:
            data.job.title,
          description:
            data.job
              .description,
          budget:
            data.job.budget,
          skills:
            data.job.skills.join(
              ", "
            ),
        });
      } catch (error) {
        console.log(error);
      }
    };

  const handleChange =
    (e) => {
      setFormData({
        ...formData,
        [e.target.name]:
          e.target.value,
      });
    };

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      try {
        await updateJob(
          id,
          {
            ...formData,
            skills:
              formData.skills
                .split(",")
                .map((s) =>
                  s.trim()
                ),
          }
        );

        alert(
          "Job updated successfully!"
        );

        navigate(
          "/my-jobs"
        );
      } catch (error) {
        console.log(error);

        alert(
          "Failed to update job."
        );
      }
    };

  return (
    <div className="max-w-3xl mx-auto p-6">

      <div className="bg-white shadow rounded-xl p-6">

        <h1 className="text-2xl font-bold mb-6">
          Edit Job
        </h1>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-4"
        >

          <input
            type="text"
            name="title"
            value={
              formData.title
            }
            onChange={
              handleChange
            }
            placeholder="Job Title"
            className="w-full border p-3 rounded-lg"
          />

          <textarea
            name="description"
            value={
              formData.description
            }
            onChange={
              handleChange
            }
            placeholder="Description"
            rows="5"
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="number"
            name="budget"
            value={
              formData.budget
            }
            onChange={
              handleChange
            }
            placeholder="Budget"
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="text"
            name="skills"
            value={
              formData.skills
            }
            onChange={
              handleChange
            }
            placeholder="React, Node.js, MongoDB"
            className="w-full border p-3 rounded-lg"
          />

          <button
            type="submit"
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700"
          >
            Update Job
          </button>

        </form>

      </div>
    </div>
  );
};

export default EditJob;
