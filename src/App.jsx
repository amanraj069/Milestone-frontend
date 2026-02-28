import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';
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
import JobApplicants from './pages/Public_JobListing/JobApplicants';
import FreelancerPublicProfile from './pages/Public_JobListing/FreelancerProfile';
import BlogList from './components/Home/BlogList';
import BlogDetail from './components/Home/BlogDetail';
import JobApplication from './components/jobApplication/JobApplication';

// Moderator Pages
import ModeratorJobListings from './pages/Moderator/JobListings';
import ModeratorFreelancers from './pages/Moderator/Freelancers';
import ModeratorEmployers from './pages/Moderator/Employers';
import ModeratorComplaints from './pages/Moderator/Complaints';
import ComplaintDetail from './pages/Moderator/ComplaintDetail';
import ModeratorQuizzes from './pages/Moderator/Quizzes';
import ModeratorBlogs from './pages/Moderator/Blogs';
import CreateBlog from './pages/Moderator/Blogs/CreateBlog';
import EditBlog from './pages/Moderator/Blogs/EditBlog';
import ModeratorProfile from './pages/Moderator/Profile';
import ModeratorEditProfile from './pages/Moderator/EditProfile';
import NewQuiz from './pages/Moderator/Quizzes/NewQuiz';
import QuizList from './pages/Moderator/Quizzes/QuizList';
import EditQuiz from './pages/Moderator/Quizzes/EditQuiz';

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

// 404 Page
import NotFound from './pages/NotFound';

function App() {
  return (
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
                    <Route path="/jobs/:jobId/applicants" element={<JobApplicants />} />
                    <Route path="/jobs/:jobId" element={<JobDescription />} />
                    <Route path="/jobs/apply/:jobId" element={<ProtectedRoute requiredRole="Freelancer"><JobApplication /></ProtectedRoute>} />
                    <Route path="/freelancer/:freelancerId" element={<FreelancerPublicProfile />} />
                    <Route path="/blogs" element={<BlogList />} />
                    <Route path="/blogs/:blogId" element={<BlogDetail />} />
                    
                    {/* Admin Routes */}
                    <Route path="/moderator/dashboard" element={<Navigate to="/moderator/job-listings" replace />} />
                    <Route path="/moderator/home" element={<Navigate to="/moderator/job-listings" replace />} />
                    <Route path="/moderator/job-listings" element={<ProtectedRoute requiredRole="Moderator"><ModeratorJobListings /></ProtectedRoute>} />
                    <Route path="/moderator/freelancers" element={<ProtectedRoute requiredRole="Moderator"><ModeratorFreelancers /></ProtectedRoute>} />
                    <Route path="/moderator/employers" element={<ProtectedRoute requiredRole="Moderator"><ModeratorEmployers /></ProtectedRoute>} />
                    <Route path="/moderator/complaints" element={<ProtectedRoute requiredRole="Moderator"><ModeratorComplaints /></ProtectedRoute>} />
                    <Route path="/moderator/complaints/:complaintId" element={<ProtectedRoute requiredRole="Moderator"><ComplaintDetail /></ProtectedRoute>} />
                    <Route path="/moderator/quizzes" element={<ProtectedRoute requiredRole="Moderator"><ModeratorQuizzes /></ProtectedRoute>} />
                    <Route path="/moderator/quizzes/new" element={<ProtectedRoute requiredRole="Moderator"><NewQuiz /></ProtectedRoute>} />
                    <Route path="/moderator/quizzes/list" element={<ProtectedRoute requiredRole="Moderator"><QuizList /></ProtectedRoute>} />
                    <Route path="/moderator/quizzes/:id/edit" element={<ProtectedRoute requiredRole="Moderator"><EditQuiz /></ProtectedRoute>} />
                    <Route path="/moderator/blogs" element={<ProtectedRoute requiredRole="Moderator"><ModeratorBlogs /></ProtectedRoute>} />
                    <Route path="/moderator/blogs/create" element={<ProtectedRoute requiredRole="Moderator"><CreateBlog /></ProtectedRoute>} />
                    <Route path="/moderator/blogs/edit/:slug" element={<ProtectedRoute requiredRole="Moderator"><EditBlog /></ProtectedRoute>} />
                    <Route path="/moderator/profile" element={<ProtectedRoute requiredRole="Moderator"><ModeratorProfile /></ProtectedRoute>} />
                    <Route path="/moderator/chat" element={<ProtectedRoute requiredRole="Moderator"><Chat /></ProtectedRoute>} />
                    <Route path="/moderator/profile/edit" element={<ProtectedRoute requiredRole="Moderator"><ModeratorEditProfile /></ProtectedRoute>} />

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
                    
                    {/* Catch all - 404 Page */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </SocketProvider>
            </ChatProvider>
          </ChatNotificationProvider>
        </Router>
      </AuthProvider>
  );
}

export default App;
