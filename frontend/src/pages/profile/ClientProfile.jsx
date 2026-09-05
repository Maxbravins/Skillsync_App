import useAuth from "../../hooks/useAuth";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  Edit,
  CheckCircle,
  Wallet,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

const ClientProfile = () => {
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

  const verification =
    user.verificationDocuments || {};

  const jobsPosted = Number(user.jobsPosted) || 0;
  const applications = Number(user.applications) || 0;
  const totalSpent = Number(user.totalSpent) || 0;

  const isVerified =
    Boolean(user.isVerified) ||
    Boolean(verification.idVerified) ||
    Boolean(verification.emailVerified);

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
              Company Profile
            </h1>

            <p className="text-[var(--text-secondary)] mt-1">
              Manage your company and client information
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
                    alt={`${user.company || user.username} profile`}
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
                  {(
                    user.company ||
                    user.username ||
                    "C"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

              </div>

              {/* Company information */}

              <div className="flex-1">

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                  <div>

                    <div className="flex flex-wrap items-center gap-3">

                      <h2 className="text-3xl font-bold">
                        {user.company ||
                          "Company Name"}
                      </h2>

                      {isVerified && (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-medium">
                          <CheckCircle size={14} />
                          Verified
                        </span>
                      )}

                    </div>

                    <p className="text-cyan-400 font-medium mt-1">
                      Client Account
                    </p>

                  </div>

                </div>

                {user.bio ? (
                  <p className="mt-4 max-w-3xl text-[var(--text-secondary)] leading-7">
                    {user.bio}
                  </p>
                ) : (
                  <p className="mt-4 text-[var(--text-secondary)] italic">
                    No company description added yet.
                  </p>
                )}

              </div>

            </div>

            {/* =================================================
                COMPANY QUICK INFORMATION
            ================================================== */}

            <div className="flex flex-wrap gap-3 mt-7">

              {user.companySize && (
                <span className="inline-flex items-center gap-2 bg-[var(--bg-primary)] border border-[var(--border-color)] px-3 py-2 rounded-lg text-sm">
                  <Building2
                    size={16}
                    className="text-cyan-400"
                  />
                  {user.companySize} employees
                </span>
              )}

              {user.location && (
                <span className="inline-flex items-center gap-2 bg-[var(--bg-primary)] border border-[var(--border-color)] px-3 py-2 rounded-lg text-sm">
                  <MapPin
                    size={16}
                    className="text-cyan-400"
                  />
                  {user.location}
                </span>
              )}

              {user.isPremium && (
                <span className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3 py-2 rounded-lg text-sm">
                  Premium Client
                </span>
              )}

            </div>

          </div>
        </section>

        {/* =====================================================
            COMPANY / CONTACT INFORMATION
        ====================================================== */}

        <div className="grid lg:grid-cols-2 gap-6 mt-6">

          {/* Company information */}

          <section className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">

            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Building2
                size={20}
                className="text-cyan-400"
              />
              Company Information
            </h3>

            <div className="space-y-5">

              <Info
                icon={<Building2 size={18} />}
                label="Company"
                value={user.company}
              />

              <Info
                icon={<Building2 size={18} />}
                label="Company Size"
                value={
                  user.companySize
                    ? `${user.companySize} employees`
                    : null
                }
              />

              <Info
                icon={<Globe size={18} />}
                label="Company Website"
                value={user.companyWebsite}
                isUrl
              />

              <Info
                icon={<Globe size={18} />}
                label="Business Website"
                value={user.website}
                isUrl
              />

            </div>
          </section>

          {/* Contact information */}

          <section className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">

            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <User
                size={20}
                className="text-cyan-400"
              />
              Contact Information
            </h3>

            <div className="space-y-5">

              <Info
                icon={<User size={18} />}
                label="Contact Person"
                value={user.username}
              />

              <Info
                icon={<Mail size={18} />}
                label="Email"
                value={user.email}
                isEmail
              />

              <Info
                icon={<Phone size={18} />}
                label="Phone"
                value={user.phone}
              />

              <Info
                icon={<MapPin size={18} />}
                label="Location"
                value={user.location}
              />

            </div>
          </section>

        </div>

        {/* =====================================================
            CLIENT STATISTICS
        ====================================================== */}

        <section className="mt-6">

          <h3 className="text-xl font-semibold mb-4">
            Client Overview
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <Stat
              icon={<Briefcase size={21} />}
              title="Jobs Posted"
              value={jobsPosted}
            />

            <Stat
              icon={<User size={21} />}
              title="Applications"
              value={applications}
            />

            <Stat
              icon={<Wallet size={21} />}
              title="Total Spent"
              value={`KES ${totalSpent.toLocaleString()}`}
            />

            <Stat
              icon={<ShieldCheck size={21} />}
              title="Account Status"
              value={
                isVerified
                  ? "Verified"
                  : "Unverified"
              }
            />

          </div>
        </section>

        {/* =====================================================
            VERIFICATION
        ====================================================== */}

        <section className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6 mt-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>

              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShieldCheck
                  size={20}
                  className="text-cyan-400"
                />
                Account Verification
              </h3>

              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Verification helps developers trust clients on the platform.
              </p>

            </div>

            <span
              className={`inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full border text-sm ${
                isVerified
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isVerified
                    ? "bg-emerald-400"
                    : "bg-yellow-400"
                }`}
              />

              {isVerified
                ? "Verified"
                : "Verification pending"}
            </span>

          </div>

          <div className="grid sm:grid-cols-3 gap-4 mt-6">

            <VerificationItem
              label="Email"
              verified={
                verification.emailVerified
              }
            />

            <VerificationItem
              label="Phone"
              verified={
                verification.phoneVerified
              }
            />

            <VerificationItem
              label="Identity"
              verified={
                verification.idVerified
              }
            />

          </div>

        </section>

        {/* =====================================================
            PREMIUM
        ====================================================== */}

        {user.isPremium && (
          <section className="bg-[var(--bg-secondary)] rounded-2xl border border-purple-500/20 p-6 mt-6">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                ✦
              </div>

              <div>

                <h3 className="font-semibold">
                  Premium Client
                </h3>

                <p className="text-sm text-[var(--text-secondary)]">
                  {user.premiumPlan
                    ? `${user.premiumPlan
                        .charAt(0)
                        .toUpperCase()}${user.premiumPlan.slice(
                        1
                      )} plan`
                    : "Premium plan"}
                </p>

              </div>

            </div>

            {user.premiumExpiresAt && (
              <p className="text-sm text-[var(--text-secondary)] mt-4">
                Subscription expires on{" "}
                {new Date(
                  user.premiumExpiresAt
                ).toLocaleDateString()}
              </p>
            )}

          </section>
        )}

        {/* =====================================================
            COMPANY WEBSITE CTA
        ====================================================== */}

        {(user.companyWebsite ||
          user.website) && (
          <section className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6 mt-6">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              <div>

                <h3 className="font-semibold">
                  Company Website
                </h3>

                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Learn more about the company.
                </p>

              </div>

              <a
                href={
                  user.companyWebsite ||
                  user.website
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg transition"
              >
                Visit Website
                <ExternalLink size={16} />
              </a>

            </div>

          </section>
        )}

      </main>

      <Footer />
    </div>
  );
};

// ============================================================
// INFO COMPONENT
// ============================================================

const Info = ({
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
    <div className="flex gap-4">

      <div className="w-10 h-10 shrink-0 rounded-lg bg-[var(--bg-primary)] flex items-center justify-center text-cyan-400">
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
// STAT COMPONENT
// ============================================================

const Stat = ({
  icon,
  title,
  value,
}) => {
  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-5">

      <div className="flex items-center gap-3">

        <div className="w-11 h-11 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
          {icon}
        </div>

        <div className="min-w-0">

          <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
            {title}
          </p>

          <p className="text-xl font-bold mt-1 truncate">
            {value}
          </p>

        </div>

      </div>
    </div>
  );
};

// ============================================================
// VERIFICATION ITEM
// ============================================================

const VerificationItem = ({
  label,
  verified,
}) => {
  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4">

      <div className="flex items-center justify-between gap-3">

        <span className="font-medium">
          {label}
        </span>

        {verified ? (
          <span className="inline-flex items-center gap-1 text-emerald-400 text-sm">
            <CheckCircle size={16} />
            Verified
          </span>
        ) : (
          <span className="text-sm text-[var(--text-secondary)]">
            Not verified
          </span>
        )}

      </div>
    </div>
  );
};

export default ClientProfile;
