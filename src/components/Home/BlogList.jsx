import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import { fetchAllBlogs, fetchFeaturedBlog } from '../../redux/slices/blogSlice';
import Footer from './Footer';

const BlogList = () => {
  const dispatch = useDispatch();
  const { user, getDashboardRoute } = useAuth();
  const { blogs: allBlogs, featuredBlog, loading } = useSelector((state) => state.blog);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    'All',
    'Freelancing Tips',
    'Career Advice',
    'Productivity',
    'Success Stories',
    'Tools & Resources',
    'Industry News'
  ];

  useEffect(() => {
    dispatch(fetchFeaturedBlog());
    dispatch(fetchAllBlogs());
  }, [dispatch]);

  const recentBlogs = allBlogs
    .filter(blog => blog.blogId !== featuredBlog?.blogId)
    .slice(0, 6);

  let filteredBlogs = activeCategory === 'All'
    ? allBlogs
    : allBlogs.filter(blog => blog.category === activeCategory);

  // Apply search filter
  if (searchTerm.trim()) {
    const search = searchTerm.toLowerCase();
    filteredBlogs = filteredBlogs.filter(blog =>
      blog.title.toLowerCase().includes(search) ||
      blog.tagline.toLowerCase().includes(search) ||
      blog.category.toLowerCase().includes(search)
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between py-4">
            <div className="text-4xl font-bold text-gray-900">
              <Link to="/" className="hover:text-navy-700 transition-colors no-underline">
                Mile<span className="text-navy-700">stone</span>
              </Link>
            </div> 
            
            <div className="flex items-center gap-4">
              {user ? (
                <Link 
                  to={getDashboardRoute()} 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white rounded-lg font-medium no-underline transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <i className="fas fa-tachometer-alt"></i>
                  Dashboard
                </Link>
              ) : (
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white rounded-lg font-medium no-underline transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <i className="fas fa-sign-in-alt"></i>
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="pt-20">
        {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Blog</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Insights, stories, and tips for freelancers and employers
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <input
                type="text"
                placeholder="Search Blogs..."
                className="w-full px-6 py-4 rounded-full border-2 border-gray-200 focus:border-indigo-500 focus:outline-none shadow-lg"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-white text-indigo-600 px-6 py-2 rounded-full hover:bg-gray-100 transition-colors font-semibold border border-gray-200">
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Blog */}
      {featuredBlog && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Featured Blog</h2>
                <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Featured
                </span>
              </div>

              <Link to={`/blogs/${featuredBlog.blogId}`} className="group block">
                <div className="grid md:grid-cols-2 gap-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="relative h-96 overflow-hidden">
                    <img 
                      src={featuredBlog.imageUrl} 
                      alt={featuredBlog.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-white text-indigo-600 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                        {featuredBlog.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(featuredBlog.createdAt)}
                      </span>
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {featuredBlog.readTime} min read
                      </span>
                    </div>
                    
                    <h3 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors">
                      {featuredBlog.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-6 line-clamp-3">
                      {featuredBlog.tagline}
                    </p>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {featuredBlog.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{featuredBlog.author}</p>
                        <p className="text-sm text-gray-600">Author</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Recent Posts */}
      {recentBlogs.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Recent Posts</h2>
              
              <div className="flex justify-center">
                <div className={`grid gap-8 w-full ${
                  recentBlogs.length === 1 
                    ? 'grid-cols-1 max-w-md' 
                    : recentBlogs.length === 2 
                      ? 'grid-cols-1 md:grid-cols-2 max-w-3xl' 
                      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}>
                {recentBlogs.map((blog) => (
                  <Link 
                    key={blog.blogId} 
                    to={`/blogs/${blog.blogId}`}
                    className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={blog.imageUrl} 
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-white text-indigo-600 px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                          {blog.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                        <span>{formatDate(blog.createdAt)}</span>
                        <span>•</span>
                        <span>{blog.readTime} min read</span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:transition-colors line-clamp-2">
                        {blog.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                        {blog.tagline}
                      </p>
                      
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {blog.author.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{blog.author}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Category Filter */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Browse by Category</h2>
            
            <div className="flex flex-wrap gap-3 mb-12">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${
                    activeCategory === category
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            
            {/* All Posts Grid */}
            <div className="flex justify-center">
              <div className={`grid gap-8 w-full ${
                filteredBlogs.length === 1 
                  ? 'grid-cols-1 max-w-md' 
                  : filteredBlogs.length === 2 
                    ? 'grid-cols-1 md:grid-cols-2 max-w-3xl' 
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              }`}>
              {filteredBlogs.map((blog) => (
                <Link 
                  key={blog.blogId} 
                  to={`/blogs/${blog.blogId}`}
                  className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={blog.imageUrl} 
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-white text-indigo-600 px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        {blog.category}
                      </span>
                    </div>
                    {blog.featured && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-yellow-400 text-gray-900 p-2 rounded-full shadow-lg">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                      <span>{formatDate(blog.createdAt)}</span>
                      <span>•</span>
                      <span>{blog.readTime} min read</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover: transition-colors line-clamp-2">
                      {blog.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                      {blog.tagline}
                    </p>
                    
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                      <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {blog.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{blog.author}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              </div>
            </div>

            {filteredBlogs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No blogs found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Stay Updated with Our Latest Posts
            </h2>
            <p className="text-xl text-white mb-8">
              Get weekly insights delivered straight to your inbox
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap items-center">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-white placeholder:text-gray-500 w-[200px]"
              />
              <button className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold transition-all hover:bg-white hover:text-indigo-600 whitespace-nowrap w-[150px]">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>
      </div>

      <Footer />
    </div>
  );
};

export default BlogList;
