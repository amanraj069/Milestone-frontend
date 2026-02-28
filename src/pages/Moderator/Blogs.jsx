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
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('title');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [authorFilter, setAuthorFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
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

  const categories = [...new Set(blogs.map(blog => blog.category).filter(Boolean))].sort();
  const authors = [...new Set(blogs.map(blog => blog.author).filter(Boolean))].sort();

  const clearAllFilters = () => {
    setSearchTerm('');
    setSearchMode('title');
    setStatusFilter('all');
    setCategoryFilter('all');
    setFeaturedFilter('all');
    setAuthorFilter('all');
    setSortBy('newest');
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    statusFilter !== 'all' ||
    categoryFilter !== 'all' ||
    featuredFilter !== 'all' ||
    authorFilter !== 'all' ||
    sortBy !== 'newest';

  const filteredBlogs = [...blogs]
    .filter((blog) => {
      const query = searchTerm.trim().toLowerCase();
      let matchesSearch = query === '';
      
      if (!matchesSearch) {
        if (searchMode === 'title') {
          matchesSearch = blog.title?.toLowerCase().includes(query) || blog.tagline?.toLowerCase().includes(query);
        } else if (searchMode === 'author') {
          matchesSearch = blog.author?.toLowerCase().includes(query);
        }
      }

      const matchesStatus = statusFilter === 'all' || blog.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || blog.category === categoryFilter;
      const matchesAuthor = authorFilter === 'all' || blog.author === authorFilter;
      const matchesFeatured =
        featuredFilter === 'all' ||
        (featuredFilter === 'featured' && blog.featured) ||
        (featuredFilter === 'not-featured' && !blog.featured);

      return matchesSearch && matchesStatus && matchesCategory && matchesAuthor && matchesFeatured;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'views-desc':
          return (b.views || 0) - (a.views || 0);
        case 'likes-desc':
          return (b.likes || 0) - (a.likes || 0);
        case 'readtime-asc':
          return (a.readTime || 0) - (b.readTime || 0);
        case 'readtime-desc':
          return (b.readTime || 0) - (a.readTime || 0);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  // Stats calculations
  const totalBlogs = blogs.length;
  const publishedBlogs = blogs.filter((b) => b.status === 'published').length;
  const draftBlogs = blogs.filter((b) => b.status === 'draft').length;
  const featuredBlogs = blogs.filter((b) => b.featured).length;
  const totalViews = blogs.reduce((sum, blog) => sum + (blog.views || 0), 0);
  const totalLikes = blogs.reduce((sum, blog) => sum + (blog.likes || 0), 0);
  const archivedBlogs = blogs.filter((b) => b.status === 'archived').length;
  const recentBlogs30Days = blogs.filter((blog) => {
    if (!blog.createdAt) return false;
    const daysSinceCreated = (Date.now() - new Date(blog.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreated <= 30;
  }).length;

  const headerAction = (
    <button
      onClick={() => navigate('/moderator/blogs/create')}
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Blogs</p>
            <p className="text-2xl font-semibold text-gray-900">{totalBlogs}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Featured</p>
            <p className="text-2xl font-semibold text-gray-900">{featuredBlogs}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Views</p>
            <p className="text-2xl font-semibold text-gray-900">{totalViews}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Likes</p>
            <p className="text-2xl font-semibold text-gray-900">{totalLikes}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Featured</label>
              <select
                value={featuredFilter}
                onChange={(e) => setFeaturedFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="featured">Featured</option>
                <option value="not-featured">Not Featured</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Author</label>
              <select
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                {authors.map((author) => (
                  <option key={author} value={author}>{author}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="views-desc">Most Viewed</option>
                <option value="likes-desc">Most Liked</option>
                <option value="readtime-asc">Read Time: Low to High</option>
                <option value="readtime-desc">Read Time: High to Low</option>
              </select>
            </div>

            {hasActiveFilters && (
              <div>
                <label className="block text-xs font-medium text-transparent mb-1">.</label>
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Search by:</span>
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => setSearchMode('title')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                    searchMode === 'title'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Title
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('author')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${
                    searchMode === 'author'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Author
                </button>
              </div>
            </div>
            <div className="flex-1 min-w-[300px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  searchMode === 'title' 
                    ? 'Search by title...' 
                    : 'Search by author...'
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Blog List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">All Blogs</h2>
            <p className="text-sm text-gray-500 mt-0.5">Showing {filteredBlogs.length} of {blogs.length} blogs</p>
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
                  onClick={() => navigate('/moderator/blogs/create')}
                  className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Create Your First Blog
                </button>
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg font-medium text-gray-700">No matching blogs found</p>
                <p className="text-gray-500 mt-1 mb-4">Try adjusting your search or filters</p>
                <button
                  onClick={clearAllFilters}
                  className="inline-block px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBlogs.map((blog) => (
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
                            <span className="text-sm text-gray-500">{blog.views || 0} views</span>
                            <span className="text-sm text-gray-500">{blog.likes || 0} likes</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 ml-4">
                        <button
                          onClick={() => navigate(`/moderator/blogs/edit/${blog.slug || blog.blogId}?id=${blog.blogId}`)}
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
