import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
    phone: user?.phone || "",
    location: user?.location || "",
    github: user?.github || "",
    linkedin: user?.linkedin || "",
    portfolio: user?.portfolio || "",
    skills: user?.skills?.join(", ") || "",
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }

      if (resume) {
        formData.append("resume", resume);
      }

      const res = await api.put("/users/profile", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            });

            updateUser(res.data.user);

            alert("Profile updated successfully!");

            navigate("/profile");

                }
     catch (error) {
      console.log(error);

      alert(
        error.response?.data?.message ||
          "Failed to update profile."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />

      <main className="max-w-3xl mx-auto py-10 px-6">
        <div className="bg-[var(--bg-secondary)] p-8 rounded-xl border border-[var(--border-color)]">

          <h1 className="text-3xl font-bold mb-8">
            Edit Profile
          </h1>

          {/* Current Profile Picture */}
          <div className="flex justify-center mb-8">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border-4 border-cyan-500"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 flex items-center justify-center text-4xl font-bold text-white">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
            />

            <textarea
              name="bio"
              placeholder="Tell people about yourself..."
              rows="4"
              value={form.bio}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
            />

            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
            />

            <input
              type="text"
              name="location"
              placeholder="Location"
              value={form.location}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
            />

            <input
              type="text"
              name="skills"
              placeholder="React, Node.js, MongoDB"
              value={form.skills}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
            />

            <input
              type="url"
              name="github"
              placeholder="GitHub URL"
              value={form.github}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
            />

            <input
              type="url"
              name="linkedin"
              placeholder="LinkedIn URL"
              value={form.linkedin}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
            />

            <input
              type="url"
              name="portfolio"
              placeholder="Portfolio Website"
              value={form.portfolio}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
            />

            <div>
              <label className="block mb-2 font-medium">
                Profile Picture
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setProfilePicture(e.target.files[0])
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Resume
              </label>

              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) =>
                  setResume(e.target.files[0])
                }
                className="w-full"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 py-3 rounded-lg text-white font-semibold transition"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>

          </form>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EditProfile;