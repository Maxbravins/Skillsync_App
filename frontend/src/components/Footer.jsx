import { Link } from "react-router-dom";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)] mt-12">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h2 className="text-2xl font-bold text-cyan-400">
              SkillSync
            </h2>
            <p className="text-[var(--text-secondary)] mt-3">
              Connecting talented developers with clients through a modern,
              secure and easy-to-use platform.
            </p>
          </div>
          <div>
            <h3 className="text-[var(--text-primary)] font-semibold mb-4">
              Quick Links
            </h3>
            <div className="flex flex-col gap-2">
              <Link to="/jobs" className="text-[var(--text-secondary)] hover:text-cyan-400">
                Browse Jobs
              </Link>
              <Link to="/profile" className="text-[var(--text-secondary)] hover:text-cyan-400">
                Profile
              </Link>
              <Link to="/notifications" className="text-[var(--text-secondary)] hover:text-cyan-400">
                Notifications
              </Link>
            </div>
          </div>
          <div>
            <h3 className="text-[var(--text-primary)] font-semibold mb-4">
              Contact
            </h3>
            <div className="flex gap-5 text-2xl text-[var(--text-secondary)]">
              <a
                href="https://github.com/Maxbravins"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaGithub />
              </a>
              <a
                href="https://www.linkedin.com/in/micaiah-wanyama-149145294/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaLinkedin />
              </a>
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=maxbravins@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaEnvelope />
              </a>
            </div>
          </div>
        </div>
        <hr className="border-[var(--border-color)] my-8" />
        <div className="flex justify-between flex-wrap gap-4 text-[var(--text-secondary)] text-sm">
          <p>
            © {new Date().getFullYear()} SkillSync. All rights reserved.
          </p>
          <p>
            Built with React • Node.js • Express • MongoDB
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;