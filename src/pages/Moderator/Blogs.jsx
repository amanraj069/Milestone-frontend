import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';

// Delete Confirmation Modal Component
const DeleteModal = ({ isOpen, onClose, onConfirm, blogTitle, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-white/40 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all w-full max-w-md">
          {/* Modal Content */}
          <div className="bg-white px-6 py-5">
            <div className="flex items-start gap-4">
              {/* Warning Icon */}
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
              </div>
              
              {/* Text */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Blog Post
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Are you sure you want to delete "<span className="font-medium text-gray-700">{blogTitle}</span>"? This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </span>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ModeratorBlogs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, blog: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const apiBaseUrl = import.meta.env.VITE_BACKEND_URL;


  useEffect(() => {
    // Check for success message from navigation state
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the state
      window.history.replaceState({}, document.title);
      // Auto-hide after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    }
    fetchBlogs();
  }, [location.state]);

  const fetchBlogs = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/moderator/blogs`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setBlogs(data.blogs);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.blog) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/moderator/blogs/${deleteModal.blog.blogId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Blog deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchBlogs();
      } else {
        alert(data.message || 'Failed to delete blog');
      }
    } catch (error) {
      alert('An error occurred while deleting the blog');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, blog: null });
    }
  };

  // Stats calculations
  const totalBlogs = blogs.length;
  const publishedBlogs = blogs.filter(b => b.status === 'published').length;
  const featuredBlogs = blogs.filter(b => b.featured).length;

  const headerAction = (
    <button
      onClick={() => navigate('/admin/blogs/create')}
      className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
    >
      Create New Blog
    </button>
  );

  return (
    <DashboardPage title="Blogs" headerAction={headerAction}>
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-green-800 font-medium">{successMessage}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-pen-nib text-blue-600 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Blogs</p>
                <p className="text-2xl font-bold text-gray-800">{totalBlogs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-globe text-yellow-600 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Published</p>
                <p className="text-2xl font-bold text-gray-800">{publishedBlogs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-star text-purple-600 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Featured</p>
                <p className="text-2xl font-bold text-gray-800">{featuredBlogs}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Blog List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">All Blogs</h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage your blog posts</p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
                <p className="text-gray-500 mt-3">Loading blogs...</p>
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg font-medium text-gray-700">No blogs found</p>
                <p className="text-gray-500 mt-1 mb-4">Create your first blog post to get started</p>
                <button
                  onClick={() => navigate('/admin/blogs/create')}
                  className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Create Your First Blog
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {blogs.map((blog) => (
                  <div key={blog.blogId} className="border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <img
                          src={blog.imageUrl}
                          alt={blog.title}
                          className="w-16 h-12 rounded object-cover flex-shrink-0"
                          onError={(e) => { e.target.src = '/assets/blog-default.jpg'; }}
                        />
                        <div className="min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{blog.title}</h3>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                              {blog.category}
                            </span>
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              blog.status === 'published'
                                ? 'bg-green-100 text-green-700'
                                : blog.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {blog.status}
                            </span>
                            {blog.featured && (
                              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                                Featured
                              </span>
                            )}
                            <span className="text-sm text-gray-500">{blog.readTimeDisplay}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 ml-4">
                        <button
                          onClick={() => navigate(`/admin/blogs/edit/${blog.blogId}`)}
                          className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-xs font-medium hover:bg-gray-800 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, blog })}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, blog: null })}
        onConfirm={handleDelete}
        blogTitle={deleteModal.blog?.title || ''}
        isDeleting={isDeleting}
      />
    </DashboardPage>
  );
};

export default ModeratorBlogs;
