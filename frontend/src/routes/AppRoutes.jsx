import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ClientDashboard from "../pages/client/ClientDashboard";
import DeveloperDashboard from "../pages/developer/DeveloperDashboard";
import ProtectedRoute from "../components/ProtectedRoute";
import BrowseJobs from "../pages/jobs/BrowseJobs";
import JobDetails from "../pages/jobs/JobDetails";
import MyApplications from "../pages/applications/MyApplications";
import JobApplicants from "../pages/applications/JobApplicants";
import MyJobs from "../pages/jobs/MyJobs";
import Profile from "../pages/profile/Profile";
import EditJob from "../pages/jobs/EditJob";
import CreateJob from "../pages/jobs/CreateJob";
import Notifications from "../pages/notifications/Notifications";
import ForgotPassword from "../pages/auth/ForgotPassword";
import VerifyOTP from "../pages/auth/VerifyOTP";
import ResetPassword from "../pages/auth/ResetPassword";
import AdminDashboard from "../pages/admin/AdminDashboard";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <BrowseJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:id"
          element={
            <ProtectedRoute>
              <JobDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* Developer Routes */}
        <Route
          path="/developer-dashboard"
          element={
            <ProtectedRoute role="developer">
              <DeveloperDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-applications"
          element={
            <ProtectedRoute role="developer">
              <MyApplications />
            </ProtectedRoute>
          }
        />

        {/* Client Routes */}
        <Route
          path="/client-dashboard"
          element={
            <ProtectedRoute role="client">
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-job"
          element={
            <ProtectedRoute role="client">
              <CreateJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-jobs"
          element={
            <ProtectedRoute role="client">
              <MyJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-job/:id"
          element={
            <ProtectedRoute role="client">
              <EditJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/job-applicants/:jobId/:status?"
          element={
            <ProtectedRoute role="client">
              <JobApplicants />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback route - MUST be last */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;