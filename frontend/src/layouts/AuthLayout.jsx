import { Link, Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center px-4 py-10 transition-colors">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-block text-4xl font-extrabold tracking-tight text-cyan-400 hover:text-cyan-300 transition"
          >
            SkillSync
          </Link>

          <p className="text-[var(--text-secondary)] mt-2">
            Freelance Developer Marketplace
          </p>
        </div>

        {/* Auth Card */}
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl">
          {/* Decorative glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="relative p-6 sm:p-8">
            <Outlet />
          </div>
        </div>

        {/* Back to marketplace */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-[var(--text-secondary)] hover:text-cyan-400 transition"
          >
            ← Back to SkillSync
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-center text-xs text-[var(--text-secondary)] mt-4">
          © {new Date().getFullYear()} SkillSync. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
