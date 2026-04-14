import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';
import SmartSearchInput from '../../components/SmartSearchInput';
import { graphqlQuery } from '../../utils/graphqlClient';

const MODERATOR_BLOGS_QUERY = `
  query ModeratorBlogs(
    $first: Int!
    $after: String
    $page: Int
    $search: String
    $searchBy: String
    $categoryIn: [String]
    $featuredIn: [String]
    $sortBy: String
    $sortOrder: String
  ) {
    moderatorBlogs(
      first: $first
      after: $after
      page: $page
      search: $search
      searchBy: $searchBy
      categoryIn: $categoryIn
      featuredIn: $featuredIn
      sortBy: $sortBy
      sortOrder: $sortOrder
    ) {
      edges { cursor node { blogId slug title tagline category imageUrl author readTime status featured createdAt formattedCreatedAt readTimeDisplay } }
      pageInfo { hasNextPage endCursor }
      total
    }
    moderatorBlogsMeta {
      summary { totalBlogs publishedBlogs featuredBlogs }
      filterOptions { categories featured }
    }
  }
`;

const MODERATOR_DELETE_BLOG_MUTATION = `
  mutation ModeratorDeleteBlog($blogId: String!) {
    moderatorDeleteBlog(blogId: $blogId) {
      success
      message
    }
  }
`;

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
  const [listLoaded, setListLoaded] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, blog: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pagination, setPagination] = useState(null);
  const [metaFilters, setMetaFilters] = useState({ categories: [] });
  const [summary, setSummary] = useState({ totalBlogs: 0, publishedBlogs: 0, featuredBlogs: 0 });
  const [afterCursor, setAfterCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('title');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');


  useEffect(() => {
    // Check for success message from navigation state
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the state
      window.history.replaceState({}, document.title);
      // Auto-hide after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  }, [location.state]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchBlogs();
  }, [debouncedSearchTerm, searchBy, categoryFilter, featuredFilter, sortBy, afterCursor, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
    setAfterCursor(null);
    setCursorStack([]);
  }, [debouncedSearchTerm, searchBy, categoryFilter, featuredFilter, sortBy, pageSize]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const [sortField, sortDirection] = String(sortBy || 'date-desc').split('-');
      const result = await graphqlQuery(MODERATOR_BLOGS_QUERY, {
        search: debouncedSearchTerm,
        searchBy,
        categoryIn: categoryFilter !== 'all' ? [categoryFilter] : null,
        featuredIn: featuredFilter !== 'all' ? [featuredFilter] : null,
        sortBy: sortField === 'title' ? 'title' : 'createdAt',
        sortOrder: sortDirection === 'asc' ? 'asc' : 'desc',
        first: pageSize,
        after: afterCursor,
      });
      const connection = result?.moderatorBlogs;
      const edges = connection?.edges || [];
      setBlogs(edges.map((edge) => edge.node));
      setPagination(connection?.pageInfo || null);
      setMetaFilters(result?.moderatorBlogsMeta?.filterOptions || { categories: [] });
      setSummary(result?.moderatorBlogsMeta?.summary || { totalBlogs: 0, publishedBlogs: 0, featuredBlogs: 0 });
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
      setListLoaded(true);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.blog) return;

    setIsDeleting(true);
    try {
      const result = await graphqlQuery(MODERATOR_DELETE_BLOG_MUTATION, { blogId: deleteModal.blog.blogId });
      const data = result?.moderatorDeleteBlog;

      if (data?.success) {
        setSuccessMessage('Blog deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchBlogs();
      } else {
        alert(data?.message || 'Failed to delete blog');
      }
    } catch (error) {
      alert('An error occurred while deleting the blog');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, blog: null });
    }
  };

  // Active filters count
  const activeFilters = (categoryFilter !== 'all' ? 1 : 0) + 
                        (featuredFilter !== 'all' ? 1 : 0) + 
                        (searchTerm ? 1 : 0);

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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-3 sm:mt-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-pen-nib text-blue-600 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Blogs</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight break-words">{summary.totalBlogs}</p>
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
                <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight break-words">{summary.publishedBlogs}</p>
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
                <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight break-words">{summary.featuredBlogs}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 space-y-4">
          {/* Top Row - Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCurrentPage(1);
                setCategoryFilter(e.target.value);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[160px]"
            >
              <option value="all">All Categories</option>
              {(metaFilters.categories || []).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Featured Filter */}
            <select
              value={featuredFilter}
              onChange={(e) => {
                setCurrentPage(1);
                setFeaturedFilter(e.target.value);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[160px]"
            >
              <option value="all">All</option>
              <option value="featured">Featured</option>
              <option value="non-featured">Non-Featured</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => {
                setCurrentPage(1);
                setSortBy(e.target.value);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[160px]"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
            </select>

            {/* Showing Count */}
            <div className="ml-auto text-sm text-gray-600 font-medium">
              Showing: <span className="text-gray-900">{blogs.length}</span> of <span className="text-gray-900">{summary.totalBlogs || 0}</span>
            </div>
          </div>

          {/* Bottom Row - Search */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm font-medium border rounded-lg text-gray-700 bg-white border-gray-200 shadow-sm">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search By
            </div>

            {/* Custom Tab Buttons */}
            <div className="inline-flex p-1 rounded-lg border border-gray-200 bg-gray-50 h-9">
              <button
                onClick={() => {
                  setCurrentPage(1);
                  setSearchBy('title');
                }}
                className={`px-3 py-0 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                  searchBy === 'title' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Title
              </button>
              <button
                onClick={() => {
                  setCurrentPage(1);
                  setSearchBy('category');
                }}
                className={`px-3 py-0 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                  searchBy === 'category' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Category
              </button>
              <button
                onClick={() => {
                  setCurrentPage(1);
                  setSearchBy('content');
                }}
                className={`px-3 py-0 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                  searchBy === 'content' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Content
              </button>
            </div>

            {/* Search Input */}
            <div className="flex-1">
              <SmartSearchInput
                value={searchTerm}
                onChange={(value) => {
                  setCurrentPage(1);
                  setSearchTerm(value);
                }}
                dataSource={[]}
                getSearchValue={(item) => {
                  if (searchBy === 'title') return item.title || '';
                  if (searchBy === 'category') return item.category || '';
                  if (searchBy === 'content') return item.excerpt || '';
                  return '';
                }}
                placeholder={`Search for ${searchBy}...`}
              />
            </div>

            {/* Clear Filters */}
            {activeFilters > 0 && (
              <button
                onClick={() => {
                  setCurrentPage(1);
                  setSearchTerm('');
                  setSearchBy('title');
                  setCategoryFilter('all');
                  setFeaturedFilter('all');
                }}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                Clear ({activeFilters})
              </button>
            )}
          </div>
        </div>

        {/* Blog List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">All Blogs</h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage your blog posts</p>
          </div>

          <div className="p-6">
            {loading && !listLoaded ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
                <p className="text-gray-500 mt-3">Loading blogs...</p>
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg font-medium text-gray-700">
                  No blogs found
                </p>
                <p className="text-gray-500 mt-1 mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <button
                  onClick={() => navigate('/moderator/blogs/create')}
                  className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Create Your First Blog
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {loading && <div className="text-xs text-gray-500 px-1">Updating results...</div>}
                {blogs.map((blog) => (
                  <div key={blog.blogId} className="border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/blogs/${blog.blogId}`)}>
                        <img
                          src={blog.imageUrl}
                          alt={blog.title}
                          className="w-16 h-12 rounded object-cover flex-shrink-0"
                          onError={(e) => { e.target.src = '/assets/blog-default.jpg'; }}
                        />
                        <div className="min-w-0">
                          <h3 className="font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">{blog.title}</h3>
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
                          onClick={() => navigate(`/blogs/${blog.blogId}`)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/moderator/blogs/edit/${blog.slug}`)}
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
            {blogs.length > 0 && (
              <div className="pt-4 mt-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <label className="text-xs text-gray-500">Rows:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setPageSize(Math.min(100, Math.max(1, Number(e.target.value) || 25)));
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-md text-xs"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <button
                  onClick={() => {
                    const nextStack = [...cursorStack];
                    const prevAfter = nextStack.pop() ?? null;
                    setCursorStack(nextStack);
                    setAfterCursor(prevAfter);
                    setCurrentPage((p) => Math.max(1, p - 1));
                  }}
                  disabled={loading || currentPage <= 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    if (!pagination?.hasNextPage || !pagination?.endCursor) return;
                    setCursorStack((prev) => [...prev, afterCursor]);
                    setAfterCursor(pagination.endCursor);
                    setCurrentPage((p) => p + 1);
                  }}
                  disabled={loading || !pagination?.hasNextPage || !pagination?.endCursor}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                >
                  Next
                </button>
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
