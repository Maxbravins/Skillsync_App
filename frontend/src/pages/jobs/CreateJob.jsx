import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createJob } from "../../services/job.service";

const CreateJob = () => {
  const navigate = useNavigate();

  const [formData, setFormData] =
    useState({
      title: "",
      description: "",
      budget: "",
      skills: "",
    });

  const handleChange = (e) => {
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
        await createJob({
          title:
            formData.title,
          description:
            formData.description,
          budget:
            Number(
              formData.budget
            ),
          skills:
            formData.skills
              .split(",")
              .map((skill) =>
                skill.trim()
              ),
        });

        alert(
          "Job created successfully!"
        );

        navigate(
          "/my-jobs"
        );
      } catch (error) {
        console.log(error);

        alert(
          error.response?.data
            ?.message ||
            "Failed to create job"
        );
      }
    };

  return (
    <div className="max-w-3xl mx-auto p-6">

      <div className="bg-white p-6 rounded-xl shadow">

        <h1 className="text-2xl font-bold mb-6">
          Create New Job
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
            placeholder="Job Title"
            value={
              formData.title
            }
            onChange={
              handleChange
            }
            className="w-full border p-3 rounded-lg"
            required
          />

          <textarea
            name="description"
            placeholder="Job Description"
            value={
              formData.description
            }
            onChange={
              handleChange
            }
            rows="5"
            className="w-full border p-3 rounded-lg"
            required
          />

          <input
            type="number"
            name="budget"
            placeholder="Budget"
            value={
              formData.budget
            }
            onChange={
              handleChange
            }
            className="w-full border p-3 rounded-lg"
            required
          />

          <input
            type="text"
            name="skills"
            placeholder="React, Node.js, MongoDB"
            value={
              formData.skills
            }
            onChange={
              handleChange
            }
            className="w-full border p-3 rounded-lg"
            required
          />

          <button
            type="submit"
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700"
          >
            Create Job
          </button>

        </form>

      </div>
    </div>
  );
};

export default CreateJob;