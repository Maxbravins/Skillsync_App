import {
  BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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

        <Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>

           {/* Default route */}
        <Route
          path="/" element={<Navigate to="/login" />}
        />

        <Route
          path="/login" element={<Login />}
        />

        <Route
          path="/register" element={<Register />}
        />

        <Route
          path="/client-dashboard" element={
            <ProtectedRoute
              role="client"
            >
              <ClientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/developer-dashboard" element={
            <ProtectedRoute
              role="developer"
            >
              <DeveloperDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="*" element={<Navigate to="/login" />}
        />

        <Route
  path="/jobs" element={<BrowseJobs />}
/>

        <Route
          path="/jobs/:id" element={<JobDetails />}
        />

       <Route
  path="/my-applications"
  element={
    <ProtectedRoute
      role="developer"
    >
      <MyApplications />
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
    <ProtectedRoute
      role="client"
    >
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

<Route
  path="/notifications"
  element={
    <ProtectedRoute>
      <Notifications />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin-dashboard"
  element={
    <ProtectedRoute role="admin">
      <AdminDashboard />
    </ProtectedRoute>
  }
/>

<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/verify-otp" element={<VerifyOTP />} />
<Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;