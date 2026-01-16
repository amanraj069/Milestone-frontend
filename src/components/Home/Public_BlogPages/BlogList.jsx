import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const BlogList = () => {
  const { user, getDashboardRoute } = useAuth();
  const [featuredBlog, setFeaturedBlog] = useState(null);

  const categories = [
    'All',
    'Technology',
    'Design',
    'Business',
    'Marketing',
    'Development',
    'Freelancing',
    'Career'
  ];

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      
      // Fetch featured blog
      const featuredResponse = await fetch(`${apiBaseUrl}/api/blogs/featured`);
      if (featuredResponse.ok) {
        const featuredData = await featuredResponse.json();
        if (featuredData.success && featuredData.blog) {
          setFeaturedBlog(featuredData.blog);
        }
      }

      // Fetch all blogs
      const blogsResponse = await fetch(`${apiBaseUrl}/api/blogs`);
      if (blogsResponse.ok) {
        const blogsData = await blogsResponse.json();
        if (blogsData.success && blogsData.blogs) {
          setAllBlogs(blogsData.blogs);
          
          // Get recent blogs (excluding featured)
          const recent = blogsData.blogs
            .filter(blog => blog.blogId !== featuredBlog?.blogId)
            .slice(0, 6);
          setRecentBlogs(recent);
        }
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBlogs = activeCategory === 'All'
    ? allBlogs
    : allBlogs.filter(blog => blog.category === activeCategory);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href="/" className="text-2xl font-bold text-indigo-600">
                FreelanceHub
              </a>
            </div>

            {/* Search Bar (Hidden on mobile) */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="w-full relative">
                <input
                  type="text"
                  placeholder="Search for services..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Sign In / Dashboard Button */}
              {user ? (
                <a
                  href={getDashboardRoute()}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Dashboard
                </a>
              ) : (
                <a
                  href="/login"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Sign In
                </a>
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
                placeholder="Search articles..."
                className="w-full px-6 py-4 rounded-full border-2 border-gray-200 focus:border-indigo-500 focus:outline-none shadow-lg"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition-colors">
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
                <h2 className="text-3xl font-bold text-gray-900">Featured Article</h2>
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
              <h2 className="text-3xl font-bold text-gray-900 mb-12">Recent Posts</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
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
        </section>
      )}

      {/* Category Filter */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Browse by Category</h2>
            
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
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
            <p className="text-xl text-indigo-100 mb-8">
              Get weekly insights delivered straight to your inbox
            </p>
            
            <div className="flex gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button className="bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Column */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-indigo-400">FreelanceHub</h3>
              <p className="text-gray-400">
                Connecting talented freelancers with amazing opportunities worldwide.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* For Clients */}
            <div>
              <h4 className="font-semibold mb-4">For Clients</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">How to Hire</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Talent Marketplace</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Project Catalog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Enterprise</a></li>
              </ul>
            </div>

            {/* For Freelancers */}
            <div>
              <h4 className="font-semibold mb-4">For Freelancers</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">How to Find Work</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Direct Contracts</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Find Freelance Jobs</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Leadership</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FreelanceHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogList;
