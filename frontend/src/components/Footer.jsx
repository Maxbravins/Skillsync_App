import {
  FaGithub,
  FaLinkedin,
  FaEnvelope,
  FaBriefcase,
  FaArrowRight,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              to="/"
              className="inline-flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <FaBriefcase className="text-cyan-400" />
              </div>

              <span className="text-2xl font-extrabold text-cyan-400 group-hover:text-cyan-300 transition">
                SkillSync
              </span>
            </Link>

            <p className="max-w-lg text-[var(--text-secondary)] mt-5 leading-7">
              A modern freelance marketplace connecting skilled developers
              with clients looking for reliable talent.
            </p>

            <div className="flex items-center gap-3 mt-6">
              <a
                href="https://github.com/Maxbravins"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="SkillSync GitHub"
                className="w-10 h-10 rounded-lg border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition"
              >
                <FaGithub />
              </a>

              <a
                href="https://www.linkedin.com/in/micaiah-wanyama-149145294/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="SkillSync LinkedIn"
                className="w-10 h-10 rounded-lg border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition"
              >
                <FaLinkedin />
              </a>

              <a
                href="mailto:maxbravins@gmail.com"
                aria-label="Email SkillSync"
                className="w-10 h-10 rounded-lg border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition"
              >
                <FaEnvelope />
              </a>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="font-bold text-[var(--text-primary)] mb-5">
              Marketplace
            </h3>

            <nav className="flex flex-col gap-3">
              <Link
                to="/jobs"
                className="group inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-cyan-400 transition"
              >
                Browse Jobs
                <FaArrowRight
                  className="text-xs opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition"
                />
              </Link>

              <Link
                to="/register?role=developer"
                className="group inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-cyan-400 transition"
              >
                Become a Developer
                <FaArrowRight
                  className="text-xs opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition"
                />
              </Link>

              <Link
                to="/register?role=client"
                className="group inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-cyan-400 transition"
              >
                Hire Talent
                <FaArrowRight
                  className="text-xs opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition"
                />
              </Link>
            </nav>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-bold text-[var(--text-primary)] mb-5">
              Account
            </h3>

            <nav className="flex flex-col gap-3">
              <Link
                to="/login"
                className="text-[var(--text-secondary)] hover:text-cyan-400 transition"
              >
                Sign In
              </Link>

              <Link
                to="/register"
                className="text-[var(--text-secondary)] hover:text-cyan-400 transition"
              >
                Create Account
              </Link>

              <Link
                to="/forgot-password"
                className="text-[var(--text-secondary)] hover:text-cyan-400 transition"
              >
                Forgot Password
              </Link>
            </nav>
          </div>
        </div>

        <div className="border-t border-[var(--border-color)] mt-10 pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm text-[var(--text-secondary)]">
              © {currentYear} SkillSync. All rights reserved.
            </p>

            <p className="text-sm text-[var(--text-secondary)]">
              Built with React • Node.js • Express • MongoDB
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
