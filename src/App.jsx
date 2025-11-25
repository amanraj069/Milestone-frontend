import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';

// Public Pages
import PublicJobListing from './pages/Public_JobListing/PublicJobListing';
import JobDescription from './pages/Public_JobListing/JobDescription';
import BlogList from './components/Home/BlogList';
import BlogDetail from './components/Home/BlogDetail';
import JobApplication from './components/jobApplication/JobApplication';

// Admin Pages
import AdminJobListings from './pages/Admin/JobListings';
import AdminFreelancers from './pages/Admin/Freelancers';
import AdminEmployers from './pages/Admin/Employers';
import AdminComplaints from './pages/Admin/Complaints';
import AdminQuizzes from './pages/Admin/Quizzes';
import AdminBlogs from './pages/Admin/Blogs';
import AdminProfile from './pages/Admin/Profile';

// Employer Pages
import EmployerProfile from './pages/Employer/Profile/Profile';
import EmployerJobListings from './pages/Employer/JobListings/JobListings';
import AddJob from './pages/Employer/JobListings/AddJob';
import EditJob from './pages/Employer/JobListings/EditJob';
import EmployerCurrentJobs from './pages/Employer/CurrentJobs/CurrentJobs';
import EmployerApplications from './pages/Employer/Applications/Applications';
import EmployerWorkHistory from './pages/Employer/WorkHistory/WorkHistory';
import EmployerSubscription from './pages/Employer/Subscription/Subscription';
import EmployerTransactions from './pages/Employer/Transactions/Transactions';
import EmployerComplaintForm from './pages/Employer/ComplaintForm/ComplaintForm';

// Freelancer Pages
import FreelancerProfile from './pages/Freelancer/Profile';
import FreelancerActiveJobs from './pages/Freelancer/ActiveJobs/ActiveJobs';
import FreelancerJobHistory from './pages/Freelancer/JobHistory';
import FreelancerPayments from './pages/Freelancer/Payments';
import FreelancerSkillsBadges from './pages/Freelancer/SkillsBadges';
import FreelancerSubscription from './pages/Freelancer/Subscription/Subscription';
import FreelancerComplaintForm from './pages/Freelancer/ComplaintForm';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/jobs" element={<PublicJobListing />} />
            <Route path="/jobs/:jobId" element={<JobDescription />} />
            <Route path="/jobs/apply/:jobId" element={<ProtectedRoute requiredRole="Freelancer"><JobApplication /></ProtectedRoute>} />
            <Route path="/blogs" element={<BlogList />} />
            <Route path="/blogs/:blogId" element={<BlogDetail />} />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<Navigate to="/admin/job-listings" replace />} />
            <Route path="/admin/home" element={<Navigate to="/admin/job-listings" replace />} />
            <Route path="/admin/job-listings" element={<ProtectedRoute requiredRole="Admin"><AdminJobListings /></ProtectedRoute>} />
            <Route path="/admin/freelancers" element={<ProtectedRoute requiredRole="Admin"><AdminFreelancers /></ProtectedRoute>} />
            <Route path="/admin/employers" element={<ProtectedRoute requiredRole="Admin"><AdminEmployers /></ProtectedRoute>} />
            <Route path="/admin/complaints" element={<ProtectedRoute requiredRole="Admin"><AdminComplaints /></ProtectedRoute>} />
            <Route path="/admin/quizzes" element={<ProtectedRoute requiredRole="Admin"><AdminQuizzes /></ProtectedRoute>} />
            <Route path="/admin/blogs" element={<ProtectedRoute requiredRole="Admin"><AdminBlogs /></ProtectedRoute>} />
            <Route path="/admin/profile" element={<ProtectedRoute requiredRole="Admin"><AdminProfile /></ProtectedRoute>} />

            {/* Employer Routes */}
            <Route path="/employer/dashboard" element={<Navigate to="/employer/job-listings" replace />} />
            <Route path="/employer/home" element={<Navigate to="/employer/job-listings" replace />} />
            <Route path="/employer/profile" element={<ProtectedRoute requiredRole="Employer"><EmployerProfile /></ProtectedRoute>} />
            <Route path="/employer/job-listings" element={<ProtectedRoute requiredRole="Employer"><EmployerJobListings /></ProtectedRoute>} />
            <Route path="/employer/job-listings/new" element={<ProtectedRoute requiredRole="Employer"><AddJob /></ProtectedRoute>} />
            <Route path="/employer/job-listings/edit/:jobId" element={<ProtectedRoute requiredRole="Employer"><EditJob /></ProtectedRoute>} />
            <Route path="/employer/current-jobs" element={<ProtectedRoute requiredRole="Employer"><EmployerCurrentJobs /></ProtectedRoute>} />
            <Route path="/employer/applications" element={<ProtectedRoute requiredRole="Employer"><EmployerApplications /></ProtectedRoute>} />
            <Route path="/employer/work-history" element={<ProtectedRoute requiredRole="Employer"><EmployerWorkHistory /></ProtectedRoute>} />
            <Route path="/employer/subscription" element={<ProtectedRoute requiredRole="Employer"><EmployerSubscription /></ProtectedRoute>} />
            <Route path="/employer/transactions" element={<ProtectedRoute requiredRole="Employer"><EmployerTransactions /></ProtectedRoute>} />
            <Route path="/employer/complaint" element={<ProtectedRoute requiredRole="Employer"><EmployerComplaintForm /></ProtectedRoute>} />

            {/* Freelancer Routes */}
            <Route path="/freelancer/dashboard" element={<Navigate to="/freelancer/active-jobs" replace />} />
            <Route path="/freelancer/home" element={<Navigate to="/freelancer/active-jobs" replace />} />
            <Route path="/freelancer/profile" element={<ProtectedRoute requiredRole="Freelancer"><FreelancerProfile /></ProtectedRoute>} />
            <Route path="/freelancer/active-jobs" element={<ProtectedRoute requiredRole="Freelancer"><FreelancerActiveJobs /></ProtectedRoute>} />
            <Route path="/freelancer/job-history" element={<ProtectedRoute requiredRole="Freelancer"><FreelancerJobHistory /></ProtectedRoute>} />
            <Route path="/freelancer/payments" element={<ProtectedRoute requiredRole="Freelancer"><FreelancerPayments /></ProtectedRoute>} />
            <Route path="/freelancer/skills-badges" element={<ProtectedRoute requiredRole="Freelancer"><FreelancerSkillsBadges /></ProtectedRoute>} />
            <Route path="/freelancer/subscription" element={<ProtectedRoute requiredRole="Freelancer"><FreelancerSubscription /></ProtectedRoute>} />
            <Route path="/freelancer/complaint" element={<ProtectedRoute requiredRole="Freelancer"><FreelancerComplaintForm /></ProtectedRoute>} />
            
            {/* Catch all other routes */}
            <Route path="*" element={<Home />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
