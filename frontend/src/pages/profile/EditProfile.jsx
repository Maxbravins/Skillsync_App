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
    website: user?.website || "",
    experience: user?.experience || "",
    company: user?.company || "",
    companyWebsite: user?.companyWebsite || "",
    github: user?.github || "",
    linkedin: user?.linkedin || "",
    portfolio: user?.portfolio || "",
    skills: user?.skills?.join(", ") || "",
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [resume, setResume] = useState(null);
  const [preview, setPreview] = useState(
  user?.profilePicture
    ? `${import.meta.env.VITE_API_URL.replace("/api", "")}${user.profilePicture}`
    : null
);

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleProfilePicture = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setProfilePicture(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleResume = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setResume(file);
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

      const res = await api.put(
        "/users/profile",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      updateUser(res.data.user);

      alert("Profile updated successfully!");

      navigate("/profile");
    } catch (error) {
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

          <div className="flex justify-center mb-8">

            {preview ? (

              <img
                src={preview}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-cyan-500"
              />

            ) : (

              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 flex items-center justify-center text-5xl font-bold text-white">
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
              value={form.username}
              onChange={handleChange}
              placeholder="Username"
              className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
            />

            <textarea
              rows="4"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              placeholder="Tell people about yourself..."
              className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
            />

            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
            />

            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Location"
              className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
            />

                        {/* ================= Developer Fields ================= */}

            {user?.role === "developer" && (
              <>
                <input
                  type="number"
                  name="experience"
                  placeholder="Years of Experience"
                  value={form.experience}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
                />

                <input
                  type="text"
                  name="skills"
                  placeholder="React, Node.js, Laravel"
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
              </>
            )}

            {/* ================= Client Fields ================= */}

            {user?.role === "client" && (
              <>
                <input
                  type="text"
                  name="company"
                  placeholder="Company Name"
                  value={form.company}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
                />

                <input
                  type="url"
                  name="companyWebsite"
                  placeholder="Company Website"
                  value={form.companyWebsite}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
                />

                <input
                  type="url"
                  name="website"
                  placeholder="Business Website"
                  value={form.website}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
                />
              </>
            )}

            {/* ================= Admin Fields ================= */}

            {user?.role === "admin" && (
              <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-4">
                <p className="text-cyan-400 font-semibold">
                  Administrator Account
                </p>

                <p className="text-sm text-[var(--text-secondary)] mt-2">
                  Administrators only maintain personal information and profile
                  picture.
                </p>
              </div>
            )}

            {/* ================= Profile Picture ================= */}

            <div>
              <label className="block mb-2 font-medium">
                Profile Picture
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePicture}
                className="w-full"
              />
            </div>

            {/* ================= Resume ================= */}

            {user?.role === "developer" && (
              <div>
                <label className="block mb-2 font-medium">
                  Resume (PDF/DOC)
                </label>

                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResume}
                  className="w-full"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 py-3 rounded-lg text-white font-semibold transition"
            >
              {loading ? "Saving Changes..." : "Save Changes"}
            </button>

          </form>

        </div>

      </main>

      <Footer />

    </div>
  );
};

export default EditProfile;