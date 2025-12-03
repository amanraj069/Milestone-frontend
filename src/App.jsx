import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext';
import { ChatNotificationProvider } from './context/ChatNotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import Chat from './components/Chat/Chat';

// Public Pages
import PublicJobListing from './pages/Public_JobListing/PublicJobListing';
import JobDescription from './pages/Public_JobListing/JobDescription';
import FreelancerPublicProfile from './pages/Public_JobListing/FreelancerProfile';
import BlogList from './components/Home/BlogList';
import BlogDetail from './components/Home/BlogDetail';
import JobApplication from './components/jobApplication/JobApplication';

// Admin Pages
import AdminJobListings from './pages/Admin/JobListings';
import AdminFreelancers from './pages/Admin/Freelancers';
import AdminEmployers from './pages/Admin/Employers';
import AdminComplaints from './pages/Admin/Complaints';
import ComplaintDetail from './pages/Admin/ComplaintDetail';
import AdminQuizzes from './pages/Admin/Quizzes';
import AdminBlogs from './pages/Admin/Blogs';
import AdminProfile from './pages/Admin/Profile';
import AdminEditProfile from './pages/Admin/EditProfile';
import NewQuiz from './pages/Admin/Quizzes/NewQuiz';
import QuizList from './pages/Admin/Quizzes/QuizList';
import EditQuiz from './pages/Admin/Quizzes/EditQuiz';

// Employer Pages
import EmployerProfile from './pages/Employer/Profile/Profile';
import EditEmployerProfile from './pages/Employer/Profile/EditProfile';
import EmployerJobListings from './pages/Employer/JobListings/JobListings';
import AddJob from './pages/Employer/JobListings/AddJob';
import EditJob from './pages/Employer/JobListings/EditJob';
import EmployerCurrentJobs from './pages/Employer/CurrentJobs/page';
import EmployerApplications from './pages/Employer/Applications/page';
import EmployerWorkHistory from './pages/Employer/WorkHistory/WorkHistory';
import EmployerSubscription from './pages/Employer/Subscription/page';
import EmployerTransactions from './pages/Employer/Transactions/Transactions';
import TransactionDetails from './pages/Employer/Transactions/TransactionDetails';
import EmployerComplaintForm from './pages/Employer/ComplaintForm/ComplaintForm';

// Freelancer Pages
import FreelancerProfile from './pages/Freelancer/Profile';
import FreelancerEditProfile from './pages/Freelancer/EditProfile';
import FreelancerActiveJobs from './pages/Freelancer/ActiveJobs/page';
import FreelancerJobHistory from './pages/Freelancer/JobHistory';
import FreelancerPayments from './pages/Freelancer/Payments';
import FreelancerPaymentDetails from './pages/Freelancer/PaymentDetails';
import FreelancerSkillsBadges from './pages/Freelancer/SkillsBadges';
import FreelancerSubscription from './pages/Freelancer/Subscription/page';
import FreelancerComplaintForm from './pages/Freelancer/ComplaintForm';
import TakeQuiz from './pages/Quizzes/TakeQuiz';
import QuizResult from './pages/Quizzes/QuizResult';

// Notifications Page
import Notifications from './pages/Notifications/Notifications';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ChatNotificationProvider>
            <ChatProvider>
              <SocketProvider>
                <div className="App">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/jobs" element={<PublicJobListing />} />
                    <Route path="/jobs/:jobId" element={<JobDescription />} />
                    <Route path="/jobs/apply/:jobId" element={<ProtectedRoute requiredRole="Freelancer"><JobApplication /></ProtectedRoute>} />
                    <Route path="/freelancer/:freelancerId" element={<FreelancerPublicProfile />} />
                    <Route path="/blogs" element={<BlogList />} />
                    <Route path="/blogs/:blogId" element={<BlogDetail />} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin/dashboard" element={<Navigate to="/admin/job-listings" replace />} />
                    <Route path="/admin/home" element={<Navigate to="/admin/job-listings" replace />} />
                    <Route path="/admin/job-listings" element={<ProtectedRoute requiredRole="Admin"><AdminJobListings /></ProtectedRoute>} />
                    <Route path="/admin/freelancers" element={<ProtectedRoute requiredRole="Admin"><AdminFreelancers /></ProtectedRoute>} />
                    <Route path="/admin/employers" element={<ProtectedRoute requiredRole="Admin"><AdminEmployers /></ProtectedRoute>} />
                    <Route path="/admin/complaints" element={<ProtectedRoute requiredRole="Admin"><AdminComplaints /></ProtectedRoute>} />
                    <Route path="/admin/complaints/:complaintId" element={<ProtectedRoute requiredRole="Admin"><ComplaintDetail /></ProtectedRoute>} />
                    <Route path="/admin/quizzes" element={<ProtectedRoute requiredRole="Admin"><AdminQuizzes /></ProtectedRoute>} />
                    <Route path="/admin/quizzes/new" element={<ProtectedRoute requiredRole="Admin"><NewQuiz /></ProtectedRoute>} />
                    <Route path="/admin/quizzes/list" element={<ProtectedRoute requiredRole="Admin"><QuizList /></ProtectedRoute>} />
                    <Route path="/admin/quizzes/:id/edit" element={<ProtectedRoute requiredRole="Admin"><EditQuiz /></ProtectedRoute>} />
                    <Route path="/admin/blogs" element={<ProtectedRoute requiredRole="Admin"><AdminBlogs /></ProtectedRoute>} />
                    <Route path="/admin/profile" element={<ProtectedRoute requiredRole="Admin"><AdminProfile /></ProtectedRoute>} />
                    <Route path="/admin/chat" element={<ProtectedRoute requiredRole="Admin"><Chat /></ProtectedRoute>} />
                    <Route path="/admin/profile/edit" element={<ProtectedRoute requiredRole="Admin"><AdminEditProfile /></ProtectedRoute>} />

                    {/* Employer Routes */}
                    <Route path="/employer/dashboard" element={<Navigate to="/employer/job-listings" replace />} />
                    <Route path="/employer/home" element={<Navigate to="/employer/job-listings" replace />} />
                    <Route path="/employer/profile" element={<ProtectedRoute requiredRole="Employer"><EmployerProfile /></ProtectedRoute>} />
                    <Route path="/employer/profile/edit" element={<ProtectedRoute requiredRole="Employer"><EditEmployerProfile /></ProtectedRoute>} />
                    <Route path="/employer/job-listings" element={<ProtectedRoute requiredRole="Employer"><EmployerJobListings /></ProtectedRoute>} />
                    <Route path="/employer/job-listings/new" element={<ProtectedRoute requiredRole="Employer"><AddJob /></ProtectedRoute>} />
                    <Route path="/employer/job-listings/edit/:jobId" element={<ProtectedRoute requiredRole="Employer"><EditJob /></ProtectedRoute>} />
                    <Route path="/employer/current-jobs" element={<ProtectedRoute requiredRole="Employer"><EmployerCurrentJobs /></ProtectedRoute>} />
                    <Route path="/employer/applications" element={<ProtectedRoute requiredRole="Employer"><EmployerApplications /></ProtectedRoute>} />
                    <Route path="/employer/work-history" element={<ProtectedRoute requiredRole="Employer"><EmployerWorkHistory /></ProtectedRoute>} />
                    <Route path="/employer/subscription" element={<ProtectedRoute requiredRole="Employer"><EmployerSubscription /></ProtectedRoute>} />
                    <Route path="/employer/transactions" element={<ProtectedRoute requiredRole="Employer"><EmployerTransactions /></ProtectedRoute>} />
                    <Route path="/employer/transactions/:jobId" element={<ProtectedRoute requiredRole="Employer"><TransactionDetails /></ProtectedRoute>} />
                    <Route path="/employer/chat" element={<ProtectedRoute requiredRole="Employer"><Chat /></ProtectedRoute>} />
                    <Route path="/employer/complaint" element={<ProtectedRoute requiredRole="Employer"><EmployerComplaintForm /></ProtectedRoute>} />
                    <Route path="/employer/notifications" element={<ProtectedRoute requiredRole="Employer"><Notifications /></ProtectedRoute>} />

                    {/* Freelancer Routes */}
                    <Route path="/freelancer/dashboard" element={<Navigate to="/freelancer/active-jobs" replace />} />
                    <Route path="/freelancer/home" element={<Navigate to="/freelancer/active-jobs" replace />} />
                    <Route path="/freelancer/profile" element={<ProtectedRoute requiredRole="Freelancer"><FreelancerProfile /></ProtectedRoute>} />
                    <Route path="/freelancer/profile/edit" element={<ProtectedRoute requiredRole="Freelancer"><FreelancerEditProfile /></ProtectedRoute>} />
                    <Route path="/freelancer/active-jobs" element={<ProtectedRoute requiredRole="Freelancer"><FreelancerActiveJobs /></ProtectedRoute>} />
                    <Route path="/freelancer/job-history" element={<ProtectedRoute requiredRole="Freelancer"><FreelancerJobHistory /></ProtectedRoute>} />
                    <Route path="/freelancer/payments" element={<ProtectedRoute requiredRole="Freelancer"><FreelancerPayments /></ProtectedRoute>} />
                    <Route path="/freelancer/payments/:jobId" element={<ProtectedRoute requiredRole="Freelancer"><FreelancerPaymentDetails /></ProtectedRoute>} />
                    <Route path="/freelancer/skills-badges" element={<ProtectedRoute requiredRole="Freelancer"><FreelancerSkillsBadges /></ProtectedRoute>} />
                    <Route path="/freelancer/subscription" element={<ProtectedRoute requiredRole="Freelancer"><FreelancerSubscription /></ProtectedRoute>} />
                    <Route path="/freelancer/chat" element={<ProtectedRoute requiredRole="Freelancer"><Chat /></ProtectedRoute>} />
                    <Route path="/freelancer/complaint" element={<ProtectedRoute requiredRole="Freelancer"><FreelancerComplaintForm /></ProtectedRoute>} />
                    <Route path="/freelancer/notifications" element={<ProtectedRoute requiredRole="Freelancer"><Notifications /></ProtectedRoute>} />
                    <Route path="/quizzes/:id" element={<ProtectedRoute><TakeQuiz /></ProtectedRoute>} />
                    <Route path="/quizzes/:id/result" element={<ProtectedRoute><QuizResult /></ProtectedRoute>} />
                    
                    {/* Catch all other routes */}
                    <Route path="*" element={<Home />} />
                  </Routes>
                </div>
              </SocketProvider>
            </ChatProvider>
          </ChatNotificationProvider>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
