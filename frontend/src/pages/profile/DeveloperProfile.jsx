import useAuth from "../../hooks/useAuth";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  Edit,
  Github,
  Linkedin,
  Briefcase,
  Star,
  CheckCircle,
  Clock,
  ExternalLink,
  Code2,
  FolderGit2,
} from "lucide-react";

const DeveloperProfile = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const apiBaseUrl =
    import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") || "";

  const profileImageUrl = user.profilePicture
    ? user.profilePicture.startsWith("http")
      ? user.profilePicture
      : `${apiBaseUrl}${user.profilePicture}`
    : null;

  const resumeUrl = user.resume
    ? user.resume.startsWith("http")
      ? user.resume
      : `${apiBaseUrl}${user.resume}`
    : null;

  const socialLinks = user.socialLinks || {};

  const skills = Array.isArray(user.skills)
    ? user.skills
    : [];

  const portfolio = Array.isArray(user.portfolio)
    ? user.portfolio
    : [];

  const experience = Number(user.experience) || 0;
  const rating = Number(user.rating) || 0;
  const totalReviews = Number(user.totalReviews) || 0;
  const completedJobs = Number(user.completedJobs) || 0;

  const availabilityStatus =
    user.availabilityStatus || "available";

  const availabilityStyles = {
    available:
      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",

    busy:
      "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",

    unavailable:
      "bg-red-500/15 text-red-400 border-red-500/30",
  };

  const availabilityLabels = {
    available: "Available for work",
    busy: "Currently busy",
    unavailable: "Currently unavailable",
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Developer Profile
            </h1>

            <p className="text-[var(--text-secondary)] mt-1">
              Manage and showcase your professional profile
            </p>
          </div>

          <Link
            to="/edit-profile"
            className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-lg font-medium transition"
          >
            <Edit size={18} />
            Edit Profile
          </Link>
        </div>

        {/* =====================================================
            PROFILE HERO
        ====================================================== */}

        <section className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden">

          <div className="h-32 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20" />

          <div className="px-6 md:px-8 pb-8">

            <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16">

              {/* Profile picture */}

              <div className="shrink-0">

                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={`${user.username || "Developer"} profile`}
                    className="w-32 h-32 rounded-full object-cover border-4 border-[var(--bg-secondary)] shadow-xl"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove(
                        "hidden"
                      );
                    }}
                  />
                ) : null}

                <div
                  className={`${
                    profileImageUrl ? "hidden " : ""
                  }w-32 h-32 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 flex items-center justify-center text-5xl font-bold text-white border-4 border-[var(--bg-secondary)] shadow-xl`}
                >
                  {user.username?.charAt(0)?.toUpperCase() || "D"}
                </div>
              </div>

              {/* Main information */}

              <div className="flex-1">

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                  <div>
                    <h2 className="text-3xl font-bold">
                      {user.username}
                    </h2>

                    <p className="text-cyan-400 font-medium mt-1">
                      {user.experienceLevel || "Developer"}
                    </p>
                  </div>

                  <div
                    className={`inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full border text-sm font-medium ${
                      availabilityStyles[
                        availabilityStatus
                      ] ||
                      availabilityStyles.available
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        availabilityStatus ===
                        "available"
                          ? "bg-emerald-400"
                          : availabilityStatus ===
                            "busy"
                          ? "bg-yellow-400"
                          : "bg-red-400"
                      }`}
                    />

                    {availabilityLabels[
                      availabilityStatus
                    ] || "Availability not specified"}
                  </div>
                </div>

                {user.bio ? (
                  <p className="mt-4 max-w-3xl text-[var(--text-secondary)] leading-7">
                    {user.bio}
                  </p>
                ) : (
                  <p className="mt-4 text-[var(--text-secondary)] italic">
                    No professional bio added yet.
                  </p>
                )}

              </div>
            </div>

            {/* =================================================
                QUICK STATS
            ================================================== */}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">

              <StatCard
                icon={<Briefcase size={20} />}
                label="Experience"
                value={`${experience} ${
                  experience === 1
                    ? "year"
                    : "years"
                }`}
              />

              <StatCard
                icon={<Star size={20} />}
                label="Rating"
                value={
                  totalReviews > 0
                    ? `${rating.toFixed(1)} / 5`
                    : "No ratings"
                }
              />

              <StatCard
                icon={<CheckCircle size={20} />}
                label="Completed Jobs"
                value={completedJobs}
              />

              <StatCard
                icon={<Clock size={20} />}
                label="Response Time"
                value={
                  user.responseTime
                    ? `${user.responseTime}h`
                    : "Not available"
                }
              />

            </div>
          </div>
        </section>

        {/* =====================================================
            PROFILE INFORMATION
        ====================================================== */}

        <div className="grid lg:grid-cols-3 gap-6 mt-6">

          {/* ===================================================
              CONTACT / PERSONAL INFORMATION
          ==================================================== */}

          <section className="lg:col-span-1 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">

            <h3 className="text-lg font-semibold mb-5 flex items-center gap-2">
              <User
                size={20}
                className="text-cyan-400"
              />
              Personal Information
            </h3>

            <div className="space-y-5">

              <InfoRow
                icon={<User size={18} />}
                label="Username"
                value={user.username}
              />

              <InfoRow
                icon={<Mail size={18} />}
                label="Email"
                value={user.email}
                isEmail
              />

              <InfoRow
                icon={<Phone size={18} />}
                label="Phone"
                value={user.phone}
              />

              <InfoRow
                icon={<MapPin size={18} />}
                label="Location"
                value={user.location}
              />

              <InfoRow
                icon={<Globe size={18} />}
                label="Website"
                value={user.website}
                isUrl
              />

            </div>
          </section>

          {/* ===================================================
              PROFESSIONAL INFORMATION
          ==================================================== */}

          <section className="lg:col-span-2 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">

            <h3 className="text-lg font-semibold mb-5 flex items-center gap-2">
              <Code2
                size={20}
                className="text-cyan-400"
              />
              Professional Information
            </h3>

            <div className="grid sm:grid-cols-2 gap-5">

              <InfoRow
                icon={<Briefcase size={18} />}
                label="Experience Level"
                value={
                  user.experienceLevel
                }
              />

              <InfoRow
                icon={<Clock size={18} />}
                label="Experience"
                value={`${experience} ${
                  experience === 1
                    ? "year"
                    : "years"
                }`}
              />

              <InfoRow
                icon={<Star size={18} />}
                label="Rating"
                value={
                  totalReviews > 0
                    ? `${rating.toFixed(
                        1
                      )} / 5 (${totalReviews} ${
                        totalReviews === 1
                          ? "review"
                          : "reviews"
                      })`
                    : "No reviews yet"
                }
              />

              <InfoRow
                icon={<CheckCircle size={18} />}
                label="Completed Jobs"
                value={completedJobs}
              />

            </div>

            {/* Skills */}

            <div className="mt-7 pt-6 border-t border-[var(--border-color)]">

              <div className="flex items-center gap-2 mb-4">
                <Code2
                  size={18}
                  className="text-cyan-400"
                />

                <h4 className="font-semibold">
                  Skills
                </h4>
              </div>

              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">

                  {skills.map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-3 py-1.5 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}

                </div>
              ) : (
                <p className="text-[var(--text-secondary)]">
                  No skills added yet.
                </p>
              )}

            </div>
          </section>
        </div>

        {/* =====================================================
            SOCIAL LINKS
        ====================================================== */}

        <section className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6 mt-6">

          <h3 className="text-lg font-semibold mb-5">
            Professional Links
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <SocialLink
              icon={<Github size={20} />}
              label="GitHub"
              value={socialLinks.github}
            />

            <SocialLink
              icon={<Linkedin size={20} />}
              label="LinkedIn"
              value={socialLinks.linkedin}
            />

            <SocialLink
              icon={<Globe size={20} />}
              label="Website"
              value={user.website}
            />

            <SocialLink
              icon={<Globe size={20} />}
              label="Portfolio"
              value={
                typeof user.portfolio ===
                "string"
                  ? user.portfolio
                  : null
              }
            />

          </div>
        </section>

        {/* =====================================================
            RESUME
        ====================================================== */}

        <section className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6 mt-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText
                  size={20}
                  className="text-cyan-400"
                />
                Resume
              </h3>

              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Your professional resume
              </p>
            </div>

            {resumeUrl ? (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg transition"
              >
                <FileText size={18} />
                View Resume
                <ExternalLink size={15} />
              </a>
            ) : (
              <span className="text-sm text-[var(--text-secondary)]">
                No resume uploaded
              </span>
            )}

          </div>
        </section>

        {/* =====================================================
            PORTFOLIO
        ====================================================== */}

        <section className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6 mt-6">

          <div className="flex items-center justify-between gap-4 mb-6">

            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FolderGit2
                  size={20}
                  className="text-cyan-400"
                />
                Portfolio
              </h3>

              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Projects that showcase your work
              </p>
            </div>

            <span className="text-sm text-[var(--text-secondary)]">
              {portfolio.length}{" "}
              {portfolio.length === 1
                ? "project"
                : "projects"}
            </span>

          </div>

          {portfolio.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">

              {portfolio.map(
                (project, index) => (
                  <PortfolioCard
                    key={
                      project._id ||
                      `${project.title}-${index}`
                    }
                    project={project}
                  />
                )
              )}

            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-[var(--border-color)] rounded-xl">

              <FolderGit2
                size={36}
                className="mx-auto text-[var(--text-secondary)] mb-3"
              />

              <p className="font-medium">
                No portfolio projects yet
              </p>

              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Add projects to showcase your experience.
              </p>

              <Link
                to="/edit-profile"
                className="inline-flex items-center gap-2 mt-4 text-cyan-400 hover:text-cyan-300"
              >
                <Edit size={16} />
                Add Project
              </Link>

            </div>
          )}

        </section>

      </main>

      <Footer />
    </div>
  );
};

// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({
  icon,
  label,
  value,
}) => {
  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4">

      <div className="flex items-center gap-3">

        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
            {label}
          </p>

          <p className="font-semibold mt-1 truncate">
            {value}
          </p>
        </div>

      </div>
    </div>
  );
};

// ============================================================
// INFO ROW
// ============================================================

const InfoRow = ({
  icon,
  label,
  value,
  isEmail = false,
  isUrl = false,
}) => {
  const displayValue =
    value !== undefined &&
    value !== null &&
    String(value).trim() !== ""
      ? String(value)
      : null;

  return (
    <div className="flex gap-3">

      <div className="w-9 h-9 shrink-0 rounded-lg bg-[var(--bg-primary)] flex items-center justify-center text-cyan-400">
        {icon}
      </div>

      <div className="min-w-0">

        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
          {label}
        </p>

        {displayValue ? (
          isEmail ? (
            <a
              href={`mailto:${displayValue}`}
              className="text-cyan-400 hover:underline break-all"
            >
              {displayValue}
            </a>
          ) : isUrl ? (
            <a
              href={displayValue}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline break-all"
            >
              {displayValue}
            </a>
          ) : (
            <p className="mt-0.5 break-words">
              {displayValue}
            </p>
          )
        ) : (
          <p className="mt-0.5 text-[var(--text-secondary)]">
            Not provided
          </p>
        )}

      </div>
    </div>
  );
};

// ============================================================
// SOCIAL LINK
// ============================================================

const SocialLink = ({
  icon,
  label,
  value,
}) => {
  const validUrl =
    typeof value === "string" &&
    /^https?:\/\//i.test(value);

  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4">

      <div className="flex items-center gap-3">

        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
          {icon}
        </div>

        <div className="min-w-0">

          <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
            {label}
          </p>

          {validUrl ? (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline text-sm break-all"
            >
              Visit
            </a>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              Not provided
            </p>
          )}

        </div>

      </div>
    </div>
  );
};

// ============================================================
// PORTFOLIO CARD
// ============================================================

const PortfolioCard = ({
  project,
}) => {
  const technologies =
    Array.isArray(project.technologies)
      ? project.technologies
      : [];

  const imageUrl =
    typeof project.imageUrl === "string" &&
    project.imageUrl.trim()
      ? project.imageUrl
      : null;

  const projectUrl =
    typeof project.projectUrl === "string" &&
    /^https?:\/\//i.test(
      project.projectUrl
    )
      ? project.projectUrl
      : null;

  return (
    <article className="border border-[var(--border-color)] rounded-xl overflow-hidden bg-[var(--bg-primary)]">

      {/* Project image */}

      {imageUrl && (
        <div className="h-48 overflow-hidden bg-[var(--bg-secondary)]">

          <img
            src={imageUrl}
            alt={project.title || "Portfolio project"}
            className="w-full h-full object-cover transition duration-300 hover:scale-105"
            onError={(e) => {
              e.currentTarget.parentElement.style.display =
                "none";
            }}
          />

        </div>
      )}

      <div className="p-5">

        <div className="flex items-start justify-between gap-3">

          <h4 className="font-semibold text-lg">
            {project.title}
          </h4>

          {projectUrl && (
            <a
              href={projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 shrink-0"
              aria-label={`Open ${project.title}`}
            >
              <ExternalLink size={18} />
            </a>
          )}

        </div>

        {project.description && (
          <p className="text-sm text-[var(--text-secondary)] mt-2 leading-6">
            {project.description}
          </p>
        )}

        {technologies.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">

            {technologies.map(
              (technology, index) => (
                <span
                  key={`${technology}-${index}`}
                  className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full"
                >
                  {technology}
                </span>
              )
            )}

          </div>
        )}

        {projectUrl && (
          <a
            href={projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-5 text-sm text-cyan-400 hover:text-cyan-300"
          >
            View Project
            <ExternalLink size={15} />
          </a>
        )}

      </div>
    </article>
  );
};

export default DeveloperProfile;
