import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import { fetchBlogById, fetchRecentBlogs, fetchFeaturedBlog, clearCurrentBlog } from '../../store/slices/blogSlice';
import Footer from './Footer';

const BlogDetail = () => {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, getDashboardRoute } = useAuth();
  const { currentBlog: blog, recentBlogs, featuredBlog, fetchingCurrent: loading } = useSelector((state) => state.blog);
  const [theme, setTheme] = useState('light');
  const [comment, setComment] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [comments, setComments] = useState([]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    dispatch(fetchBlogById(blogId));
    dispatch(fetchRecentBlogs(blogId));
    dispatch(fetchFeaturedBlog());

    return () => {
      dispatch(clearCurrentBlog());
    };
  }, [dispatch, blogId]);

  useEffect(() => {
    if (blog === null && !loading) {
      navigate('/blogs');
    }
  }, [blog, loading, navigate]);

  const handleCommentChange = (e) => {
    setComment({
      ...comment,
      [e.target.name]: e.target.value
    });
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    const newComment = {
      ...comment,
      id: Date.now(),
      date: new Date().toISOString(),
      blogId: blogId
    };
    setComments([newComment, ...comments]);
    setComment({ name: '', email: '', message: '' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = blog?.title || '';
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Blog not found</h2>
          <Link to="/blogs" className="text-indigo-600 hover:text-indigo-700">
            Back to blogs
          </Link>
        </div>
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
            <div className="flex-1 max-w-md mx-8">
              <form className="relative">
                <input 
                  type="text" 
                  placeholder="Search for services..." 
                  className="w-full px-5 py-3 border-2 border-gray-200 rounded-full text-sm outline-none transition-all focus:border-navy-700 focus:ring-4 focus:ring-navy-100"
                />
                <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 bg-navy-700 text-white border-none rounded-full w-9 h-9 cursor-pointer transition-all hover:bg-navy-800 flex items-center justify-center">
                  <i className="fas fa-search"></i>
                </button>
              </form>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="bg-transparent border-none text-lg cursor-pointer text-gray-600 transition-colors hover:text-navy-700 p-2"
              >
                <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
              </button>
              
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

      {/* Content with padding-top for fixed header */}
      <div className="pt-20">

     

      {/* Hero Section */}
      <article className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Category and Featured Badge */}
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-indigo-100 text-indigo-600 px-4 py-2 rounded-full text-sm font-semibold">
                {blog.category}
              </span>
              {blog.featured && (
                <span className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Featured
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {blog.title}
            </h1>

            {/* Tagline */}
            <p className="text-xl text-gray-600 mb-8">
              {blog.tagline}
            </p>

            {/* Meta Info */}
            <div className="flex items-center justify-between py-6 border-y border-gray-200 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {blog.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{blog.author}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>{formatDate(blog.createdAt)}</span>
                    <span>•</span>
                    <span>{blog.readTime} min read</span>
                    <span>•</span>
                    <span>{blog.views || 0} views</span>
                  </div>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 mr-2">Share:</span>
                <button 
                  onClick={() => handleShare('twitter')}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-colors"
                  title="Share on Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
                  </svg>
                </button>
                <button 
                  onClick={() => handleShare('facebook')}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-colors"
                  title="Share on Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
                  </svg>
                </button>
                <button 
                  onClick={() => handleShare('linkedin')}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-colors"
                  title="Share on LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"></path>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </button>
              </div>
            </div>

            {/* Featured Image */}
            <div className="mb-12 rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={blog.imageUrl} 
                alt={blog.title}
                className="w-full h-auto"
              />
            </div>

            {/* Blog Content */}
            <div className="prose prose-lg max-w-none">
              {blog.content.map((section, index) => (
                <div key={index} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {section.heading}
                  </h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {section.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-gray-600 font-semibold">Tags:</span>
                <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer">
                  {blog.category}
                </span>
                {blog.featured && (
                  <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer">
                    Featured
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Leave a Comment</h2>
            
            <form onSubmit={handleCommentSubmit} className="bg-white rounded-2xl shadow-lg p-8 mb-12">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={comment.name}
                    onChange={handleCommentChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={comment.email}
                    onChange={handleCommentChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={comment.message}
                  onChange={handleCommentChange}
                  required
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Your comment..."
                ></textarea>
              </div>
              
              <button 
                type="submit"
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Post Comment
              </button>
            </form>

            {/* Comments Display */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Comments ({comments.length})</h3>
              {comments.length === 0 ? (
                <p className="text-gray-600">No comments yet. Be the first to comment!</p>
              ) : (
                <div className="space-y-6">
                  {comments.map((c) => (
                    <div key={c.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {c.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{c.name}</h4>
                            <span className="text-sm text-gray-500">
                              {new Date(c.date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-gray-700 leading-relaxed">{c.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {(recentBlogs.length > 0 || featuredBlog) && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-12">
                {featuredBlog ? 'Blog Posts' : 'Related Posts'}
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Featured Blog (if different from current) */}
                {featuredBlog && (
                  <Link 
                    to={`/blogs/${featuredBlog.blogId}`}
                    className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={featuredBlog.imageUrl} 
                        alt={featuredBlog.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-white text-indigo-600 px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                          {featuredBlog.category}
                        </span>
                      </div>
                      <div className="absolute top-4 right-4">
                        <span className="bg-yellow-400 text-gray-900 p-2 rounded-full shadow-lg">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                        <span>{formatDate(featuredBlog.createdAt)}</span>
                        <span>•</span>
                        <span>{featuredBlog.readTime} min read</span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {featuredBlog.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                        {featuredBlog.tagline}
                      </p>
                      
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {featuredBlog.author.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{featuredBlog.author}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Recent Blogs */}
                {recentBlogs.map((recentBlog) => (
                  <Link 
                    key={recentBlog.blogId} 
                    to={`/blogs/${recentBlog.blogId}`}
                    className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={recentBlog.imageUrl} 
                        alt={recentBlog.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-white text-indigo-600 px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                          {recentBlog.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                        <span>{formatDate(recentBlog.createdAt)}</span>
                        <span>•</span>
                        <span>{recentBlog.readTime} min read</span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {recentBlog.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                        {recentBlog.tagline}
                      </p>
                      
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {recentBlog.author.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{recentBlog.author}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* View All Button */}
              <div className="text-center mt-12">
                <Link 
                  to="/blogs"
                  className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  View All Blogs
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              Get the latest insights and updates delivered to your inbox
            </p>
            
            <div className="flex gap-4 max-w-md mx-auto">
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

export default BlogDetail;
