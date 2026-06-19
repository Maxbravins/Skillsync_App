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
  path="/my-jobs"
  element={
    <ProtectedRoute role="client">
      <MyJobs />
    </ProtectedRoute>
  }
/>
<Route
  path="/job-applicants/:jobId"
  element={
    <ProtectedRoute role="client">
      <JobApplicants />
    </ProtectedRoute>
  }
/>

      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;