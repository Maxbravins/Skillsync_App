import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-purple-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-400">SkillSync</h1>
          <p className="text-slate-400 mt-2">Freelance Developer Marketplace</p>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
export default AuthLayout;
