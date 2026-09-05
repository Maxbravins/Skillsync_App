import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Github,
  Linkedin,
  Briefcase,
  FileText,
  Upload,
  Save,
  Plus,
  Trash2,
  Building2,
} from "lucide-react";

import useAuth from "../../hooks/useAuth";
import api from "../../services/api";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profilePicture, setProfilePicture] = useState(null);
  const [resume, setResume] = useState(null);

  const [preview, setPreview] = useState(
    user?.profilePicture || null
  );

  const [form, setForm] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
    phone: user?.phone || "",
    location: user?.location || "",
    website: user?.website || "",

    experience: user?.experience ?? 0,
    experienceLevel: user?.experienceLevel || "Entry Level",
    skills: user?.skills?.join(", ") || "",

    github: user?.socialLinks?.github || "",
    linkedin: user?.socialLinks?.linkedin || "",
    twitter: user?.socialLinks?.twitter || "",
    youtube: user?.socialLinks?.youtube || "",

    company: user?.company || "",
    companyWebsite: user?.companyWebsite || "",
    companySize: user?.companySize || "1-10",

    available: user?.available ?? true,
    availabilityStatus:
      user?.availabilityStatus || "available",
  });

  const [portfolio, setPortfolio] = useState(
    Array.isArray(user?.portfolio)
      ? user.portfolio.map((project) => ({
          title: project.title || "",
          description: project.description || "",
          imageUrl: project.imageUrl || "",
          projectUrl: project.projectUrl || "",
          technologies: Array.isArray(project.technologies)
            ? project.technologies.join(", ")
            : "",
          createdAt: project.createdAt || undefined,
        }))
      : []
  );

  useEffect(() => {
    if (user?.profilePicture) {
      setPreview(user.profilePicture);
    }
  }, [user?.profilePicture]);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  if (!user) {
    return null;
  }

  // ============================================================
  // INPUT HANDLING
  // ============================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // PROFILE PICTURE
  // ============================================================

  const handleProfilePicture = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile picture must be smaller than 5MB.");
      return;
    }

    setError("");

    setProfilePicture(file);

    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setPreview(URL.createObjectURL(file));
  };

  // ============================================================
  // RESUME
  // ============================================================

  const handleResume = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const allowedExtensions = [".pdf", ".doc", ".docx"];

    const fileName = file.name.toLowerCase();

    const validExtension = allowedExtensions.some((extension) =>
      fileName.endsWith(extension)
    );

    if (
      !allowedTypes.includes(file.type) &&
      !validExtension
    ) {
      setError("Resume must be a PDF, DOC, or DOCX file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Resume must be smaller than 5MB.");
      return;
    }

    setError("");
    setResume(file);
  };

  // ============================================================
  // PORTFOLIO
  // ============================================================

  const addPortfolioProject = () => {
    setPortfolio((previous) => [
      ...previous,
      {
        title: "",
        description: "",
        imageUrl: "",
        projectUrl: "",
        technologies: "",
      },
    ]);
  };

  const removePortfolioProject = (index) => {
    setPortfolio((previous) =>
      previous.filter((_, projectIndex) => projectIndex !== index)
    );
  };

  const updatePortfolioProject = (
    index,
    field,
    value
  ) => {
    setPortfolio((previous) =>
      previous.map((project, projectIndex) =>
        projectIndex === index
          ? {
              ...project,
              [field]: value,
            }
          : project
      )
    );
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();

      // --------------------------------------------------------
      // BASIC INFORMATION
      // --------------------------------------------------------

      formData.append(
        "username",
        form.username.trim()
      );

      formData.append(
        "bio",
        form.bio.trim()
      );

      formData.append(
        "phone",
        form.phone.trim()
      );

      formData.append(
        "location",
        form.location.trim()
      );

      formData.append(
        "website",
        form.website.trim()
      );

      // --------------------------------------------------------
      // ROLE-SPECIFIC INFORMATION
      // --------------------------------------------------------

      if (user.role === "developer") {
        formData.append(
          "experience",
          String(form.experience)
        );

        formData.append(
          "experienceLevel",
          form.experienceLevel
        );

        formData.append(
          "skills",
          form.skills
        );

        formData.append(
          "github",
          form.github.trim()
        );

        formData.append(
          "linkedin",
          form.linkedin.trim()
        );

        formData.append(
          "twitter",
          form.twitter.trim()
        );

        formData.append(
          "youtube",
          form.youtube.trim()
        );

        formData.append(
          "available",
          String(form.available)
        );

        formData.append(
          "availabilityStatus",
          form.availabilityStatus
        );

        const cleanedPortfolio = portfolio.map(
          (project) => ({
            title: project.title.trim(),
            description: project.description.trim(),
            imageUrl: project.imageUrl.trim(),
            projectUrl: project.projectUrl.trim(),

            technologies: project.technologies
              .split(",")
              .map((technology) => technology.trim())
              .filter(Boolean),

            ...(project.createdAt
              ? { createdAt: project.createdAt }
              : {}),
          })
        );

        formData.append(
          "portfolio",
          JSON.stringify(cleanedPortfolio)
        );
      }

      if (user.role === "client") {
        formData.append(
          "company",
          form.company.trim()
        );

        formData.append(
          "companyWebsite",
          form.companyWebsite.trim()
        );

        formData.append(
          "companySize",
          form.companySize
        );
      }

      // --------------------------------------------------------
      // FILES
      // --------------------------------------------------------

      if (profilePicture) {
        formData.append(
          "profilePicture",
          profilePicture
        );
      }

      if (
        user.role === "developer" &&
        resume
      ) {
        formData.append(
          "resume",
          resume
        );
      }

      // --------------------------------------------------------
      // API REQUEST
      // --------------------------------------------------------

      const response = await api.put(
        "/users/profile",
        formData
      );

      const updatedUser = response.data?.user;

      if (!updatedUser) {
        throw new Error(
          "Server did not return the updated user."
        );
      }

      // Update AuthContext + localStorage
      updateUser(updatedUser);

      // Cloudinary URL comes directly from backend.
      setPreview(
        updatedUser.profilePicture || null
      );

      setProfilePicture(null);
      setResume(null);

      setSuccess(
        "Profile updated successfully."
      );

      // Give the user a moment to see success message.
      setTimeout(() => {
        navigate("/profile");
      }, 800);
    } catch (requestError) {
      console.error(
        "Update profile error:",
        requestError
      );

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Failed to update profile."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Edit Profile
          </h1>

          <p className="mt-2 text-[var(--text-secondary)]">
            Update your personal and professional information.
          </p>
        </div>

        {/* =====================================================
            ALERTS
        ====================================================== */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-400">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* ===================================================
              PROFILE HEADER
          ==================================================== */}

          <section className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-8">
            <div className="flex flex-col items-center">
              <div className="relative">
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-cyan-500"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 flex items-center justify-center text-5xl font-bold text-white">
                    {user.username
                      ?.charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </div>

              <label className="mt-5 cursor-pointer inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-lg transition">
                <Upload size={18} />

                Change Profile Picture

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleProfilePicture}
                  className="hidden"
                />
              </label>

              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                JPG, PNG or WEBP. Maximum 5MB.
              </p>
            </div>
          </section>

          {/* ===================================================
              BASIC INFORMATION
          ==================================================== */}

          <section className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-8">
            <SectionTitle
              icon={<User size={20} />}
              title="Personal Information"
            />

            <div className="grid md:grid-cols-2 gap-5">
              <Input
                icon={<User size={18} />}
                label="Username"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
              />

              <div>
                <label className="block text-sm font-medium mb-2">
                  Email
                </label>

                <div className="flex items-center gap-3 w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] opacity-70">
                  <Mail
                    size={18}
                    className="text-cyan-400"
                  />

                  <span className="truncate">
                    {user.email}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Email cannot be changed here.
                </p>
              </div>

              <Input
                icon={<Phone size={18} />}
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />

              <Input
                icon={<MapPin size={18} />}
                label="Location"
                name="location"
                value={form.location}
                onChange={handleChange}
              />

              <div className="md:col-span-2">
                <Input
                  icon={<Globe size={18} />}
                  label="Website"
                  name="website"
                  type="url"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Bio
                </label>

                <textarea
                  name="bio"
                  rows={5}
                  maxLength={500}
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Tell people about yourself..."
                  className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] outline-none focus:border-cyan-500 transition resize-none"
                />

                <p className="text-xs text-[var(--text-secondary)] mt-1 text-right">
                  {form.bio.length}/500
                </p>
              </div>
            </div>
          </section>

          {/* ===================================================
              DEVELOPER
          ==================================================== */}

          {user.role === "developer" && (
            <>
              <section className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-8">
                <SectionTitle
                  icon={<Briefcase size={20} />}
                  title="Developer Information"
                />

                <div className="grid md:grid-cols-2 gap-5">
                  <Input
                    label="Years of Experience"
                    name="experience"
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.experience}
                    onChange={handleChange}
                  />

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Experience Level
                    </label>

                    <select
                      name="experienceLevel"
                      value={form.experienceLevel}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] outline-none focus:border-cyan-500"
                    >
                      <option value="Entry Level">
                        Entry Level
                      </option>

                      <option value="Intermediate">
                        Intermediate
                      </option>

                      <option value="Senior">
                        Senior
                      </option>

                      <option value="Expert">
                        Expert
                      </option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Skills
                    </label>

                    <input
                      type="text"
                      name="skills"
                      value={form.skills}
                      onChange={handleChange}
                      placeholder="React, Node.js, MongoDB, Laravel"
                      className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] outline-none focus:border-cyan-500"
                    />

                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Separate skills with commas.
                    </p>
                  </div>
                </div>
              </section>

              {/* =================================================
                  SOCIAL LINKS
              ================================================== */}

              <section className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-8">
                <SectionTitle
                  icon={<Globe size={20} />}
                  title="Social Links"
                />

                <div className="grid md:grid-cols-2 gap-5">
                  <Input
                    icon={<Github size={18} />}
                    label="GitHub"
                    name="github"
                    type="url"
                    value={form.github}
                    onChange={handleChange}
                    placeholder="https://github.com/username"
                  />

                  <Input
                    icon={<Linkedin size={18} />}
                    label="LinkedIn"
                    name="linkedin"
                    type="url"
                    value={form.linkedin}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/username"
                  />

                  <Input
                    label="Twitter / X"
                    name="twitter"
                    type="url"
                    value={form.twitter}
                    onChange={handleChange}
                    placeholder="https://twitter.com/username"
                  />

                  <Input
                    label="YouTube"
                    name="youtube"
                    type="url"
                    value={form.youtube}
                    onChange={handleChange}
                    placeholder="https://youtube.com/@username"
                  />
                </div>
              </section>

              {/* =================================================
                  AVAILABILITY
              ================================================== */}

              <section className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-8">
                <SectionTitle
                  icon={<Briefcase size={20} />}
                  title="Availability"
                />

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Availability Status
                    </label>

                    <select
                      name="availabilityStatus"
                      value={form.availabilityStatus}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] outline-none focus:border-cyan-500"
                    >
                      <option value="available">
                        Available
                      </option>

                      <option value="busy">
                        Busy
                      </option>

                      <option value="unavailable">
                        Unavailable
                      </option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.available}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            available:
                              event.target.checked,
                          }))
                        }
                        className="w-5 h-5 accent-cyan-500"
                      />

                      <span>
                        Available for new work
                      </span>
                    </label>
                  </div>
                </div>
              </section>

              {/* =================================================
                  RESUME
              ================================================== */}

              <section className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-8">
                <SectionTitle
                  icon={<FileText size={20} />}
                  title="Resume"
                />

                {user.resume && (
                  <div className="mb-5 flex items-center justify-between gap-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText
                        size={22}
                        className="text-cyan-400 shrink-0"
                      />

                      <span className="truncate">
                        Current resume
                      </span>
                    </div>

                    <a
                      href={user.resume}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline shrink-0"
                    >
                      View
                    </a>
                  </div>
                )}

                <label className="block text-sm font-medium mb-2">
                  Upload New Resume
                </label>

                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResume}
                  className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
                />

                {resume && (
                  <p className="mt-2 text-sm text-cyan-400">
                    Selected: {resume.name}
                  </p>
                )}

                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  PDF, DOC or DOCX. Maximum 5MB.
                </p>
              </section>

              {/* =================================================
                  PORTFOLIO
              ================================================== */}

              <section className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-8">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <SectionTitle
                    icon={<Briefcase size={20} />}
                    title="Portfolio"
                  />

                  <button
                    type="button"
                    onClick={addPortfolioProject}
                    className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg transition"
                  >
                    <Plus size={17} />
                    Add Project
                  </button>
                </div>

                {portfolio.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-[var(--border-color)] rounded-xl">
                    <p className="text-[var(--text-secondary)]">
                      No portfolio projects added yet.
                    </p>

                    <button
                      type="button"
                      onClick={addPortfolioProject}
                      className="mt-3 text-cyan-400 hover:underline"
                    >
                      Add your first project
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {portfolio.map(
                      (project, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-5"
                        >
                          <div className="flex justify-between items-center mb-5">
                            <h3 className="font-semibold">
                              Project {index + 1}
                            </h3>

                            <button
                              type="button"
                              onClick={() =>
                                removePortfolioProject(
                                  index
                                )
                              }
                              className="text-red-400 hover:text-red-300"
                              title="Remove project"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          <div className="space-y-4">
                            <Input
                              label="Project Title"
                              value={project.title}
                              onChange={(event) =>
                                updatePortfolioProject(
                                  index,
                                  "title",
                                  event.target.value
                                )
                              }
                              placeholder="E-commerce Platform"
                              required
                            />

                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Description
                              </label>

                              <textarea
                                rows={4}
                                value={project.description}
                                onChange={(event) =>
                                  updatePortfolioProject(
                                    index,
                                    "description",
                                    event.target.value
                                  )
                                }
                                placeholder="Describe the project..."
                                className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] outline-none focus:border-cyan-500 resize-none"
                              />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <Input
                                label="Project URL"
                                type="url"
                                value={project.projectUrl}
                                onChange={(event) =>
                                  updatePortfolioProject(
                                    index,
                                    "projectUrl",
                                    event.target.value
                                  )
                                }
                                placeholder="https://example.com"
                              />

                              <Input
                                label="Project Image URL"
                                type="url"
                                value={project.imageUrl}
                                onChange={(event) =>
                                  updatePortfolioProject(
                                    index,
                                    "imageUrl",
                                    event.target.value
                                  )
                                }
                                placeholder="https://..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Technologies
                              </label>

                              <input
                                type="text"
                                value={project.technologies}
                                onChange={(event) =>
                                  updatePortfolioProject(
                                    index,
                                    "technologies",
                                    event.target.value
                                  )
                                }
                                placeholder="React, Node.js, MongoDB"
                                className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] outline-none focus:border-cyan-500"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </section>
            </>
          )}

          {/* ===================================================
              CLIENT
          ==================================================== */}

          {user.role === "client" && (
            <section className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-8">
              <SectionTitle
                icon={<Building2 size={20} />}
                title="Company Information"
              />

              <div className="grid md:grid-cols-2 gap-5">
                <Input
                  icon={<Building2 size={18} />}
                  label="Company Name"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Company name"
                />

                <Input
                  icon={<Globe size={18} />}
                  label="Company Website"
                  name="companyWebsite"
                  type="url"
                  value={form.companyWebsite}
                  onChange={handleChange}
                  placeholder="https://company.com"
                />

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Company Size
                  </label>

                  <select
                    name="companySize"
                    value={form.companySize}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] outline-none focus:border-cyan-500"
                  >
                    <option value="1-10">
                      1-10 employees
                    </option>

                    <option value="11-50">
                      11-50 employees
                    </option>

                    <option value="51-200">
                      51-200 employees
                    </option>

                    <option value="201-500">
                      201-500 employees
                    </option>

                    <option value="500+">
                      500+ employees
                    </option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* ===================================================
              ADMIN
          ==================================================== */}

          {user.role === "admin" && (
            <section className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <User
                  size={22}
                  className="text-cyan-400 mt-1"
                />

                <div>
                  <h2 className="font-semibold text-cyan-400">
                    Administrator Account
                  </h2>

                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    You can update your personal information
                    and profile picture. Administrative permissions
                    and account settings cannot be changed here.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ===================================================
              SAVE
          ==================================================== */}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              disabled={loading}
              className="sm:w-1/3 py-3 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="sm:flex-1 inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
            >
              <Save size={18} />

              {loading
                ? "Saving Changes..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

// ============================================================
// REUSABLE INPUT
// ============================================================

const Input = ({
  icon,
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  min,
  step,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label}
      </label>

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400">
            {icon}
          </div>
        )}

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          step={step}
          className={`w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] outline-none focus:border-cyan-500 transition ${
            icon ? "pl-10" : ""
          }`}
        />
      </div>
    </div>
  );
};

// ============================================================
// SECTION TITLE
// ============================================================

const SectionTitle = ({ icon, title }) => {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
        {icon}
      </div>

      <h2 className="text-xl font-semibold">
        {title}
      </h2>
    </div>
  );
};

export default EditProfile;
