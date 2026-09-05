import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Home from "../pages/Home";

import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminReports from "../pages/admin/AdminReports";
import JobApplicants from "../pages/applications/JobApplicants";
import MyApplications from "../pages/applications/MyApplications";
import ClientApplications from "../pages/applications/ClientApplications";
import ForgotPassword from "../pages/auth/ForgotPassword";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ResetPassword from "../pages/auth/ResetPassword";
import VerifyOTP from "../pages/auth/VerifyOTP";
import ClientDashboard from "../pages/client/ClientDashboard";
import Payment from "../pages/client/Payment";
import DeveloperDashboard from "../pages/developer/DeveloperDashboard";
import BrowseJobs from "../pages/jobs/BrowseJobs";
import CreateJob from "../pages/jobs/CreateJob";
import EditJob from "../pages/jobs/EditJob";
import JobDetails from "../pages/jobs/JobDetails";
import MyJobs from "../pages/jobs/MyJobs";
import Notifications from "../pages/notifications/Notifications";
import EditProfile from "../pages/profile/EditProfile";
import Profile from "../pages/profile/Profile";
import Premium from "../pages/premium/Premium";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* Public Marketplace */}
        <Route path="/" element={<Home />} />

        <Route path="/jobs" element={<BrowseJobs />} />

        <Route
          path="/jobs/:id"
          element={<JobDetails />}
        />

        {/* =====================================================
            PUBLIC AUTH ROUTES
        ====================================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/verify-otp"
          element={<VerifyOTP />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* =====================================================
            AUTHENTICATED USER ROUTES
        ====================================================== */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-profile"
          element={
            <ProtectedRoute>
              <EditProfile />
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

        {/* =====================================================
            DEVELOPER ROUTES
        ====================================================== */}

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

        {/* =====================================================
            CLIENT ROUTES
        ====================================================== */}

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
          path="/applications"
          element={
            <ProtectedRoute role="client">
              <ClientApplications />
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

        {/* =====================================================
            ADMIN ROUTES
        ====================================================== */}

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute role="admin">
              <AdminReports />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            PREMIUM
        ====================================================== */}

        <Route
          path="/premium"
          element={
            <ProtectedRoute>
              <Premium />
            </ProtectedRoute>
          }
        />

        {/* Payment should eventually be protected as well. */}
        <Route
          path="/payment/:applicationId"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            FALLBACK
        ====================================================== */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
