import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLatestBlogs } from '../../redux/slices/blogSlice';

const BlogSection = () => {
  const dispatch = useDispatch();
  const { latestBlogs: blogs, fetchingLatest: loading } = useSelector((state) => state.blog);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    dispatch(fetchLatestBlogs());
  }, [dispatch]);

  const handleNext = () => {
    if (currentIndex + 3 < blogs.length) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const visibleBlogs = blogs.slice(currentIndex, currentIndex + 3);
  const showPrev = currentIndex > 0;
  const showNext = currentIndex + 3 < blogs.length;

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading blogs...</p>
          </div>
        </div>
      </section>
    );
  }

  if (blogs.length === 0) {
    return null; // Don't show section if no blogs
  }

  return (
    <section className="py-20 bg-gray-50" id="blog">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Latest <span className="text-blue-600">Blog</span> Posts
          </h2>
          <p className="text-xl text-gray-600">
            Insights and tips to excel in the freelancing world
          </p>
        </div>

        {/* Blog Grid */}
        <div className="flex justify-center mb-8">
          <div className={`grid gap-8 w-full ${
            visibleBlogs.length === 1 
              ? 'grid-cols-1 max-w-md' 
              : visibleBlogs.length === 2 
                ? 'grid-cols-1 md:grid-cols-2 max-w-3xl' 
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {visibleBlogs.map((blog) => (
              <Link
                key={blog.blogId}
                to={`/blogs/${blog.blogId}`}
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 block no-underline cursor-pointer"
                onClick={(e) => {
                  console.log('Blog clicked:', blog.blogId);
                }}
              >
                {/* Blog Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={blog.imageUrl}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    onError={(e) => {
                      e.target.src = '/assets/blog-default.jpg';
                    }}
                  />
                  {/* Date Badge */}
                  <div className="absolute bottom-4 right-4 bg-blue-600 text-white rounded-lg px-3 py-2 flex flex-col items-center justify-center font-semibold shadow-lg">
                    <span className="text-2xl leading-none">
                      {new Date(blog.createdAt).getDate()}
                    </span>
                    <span className="text-xs uppercase leading-none mt-1">
                      {new Date(blog.createdAt)
                        .toLocaleString('en-US', { month: 'short' })
                        .toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Blog Content */}
                <div className="p-6">
                  {/* Category */}
                  <div className="inline-block mb-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold uppercase tracking-wide">
                      {blog.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 ">
                    {blog.title}
                  </h3>

                  {/* Tagline */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {blog.tagline}
                  </p>

                  {/* Read More Text */}
                  <div className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-800 transition-colors group">
                    Read More
                    <svg
                      className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        {(showPrev || showNext) && (
          <div className="flex justify-center items-center gap-4 mb-8">
              {showPrev && (
                <button
                  onClick={handlePrev}
                  className="p-3 bg-white rounded-full shadow-lg hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110"
                  aria-label="Previous blogs"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}

              {/* Pagination Dots */}
              <div className="flex gap-2">
                {Array.from({ length: Math.ceil(blogs.length / 3) }).map(
                  (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx * 3)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        Math.floor(currentIndex / 3) === idx
                          ? 'bg-blue-600 w-8'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  )
                )}
              </div>

              {showNext && (
                <button
                  onClick={handleNext}
                  className="p-3 bg-white rounded-full shadow-lg hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110"
                  aria-label="Next blogs"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

        {/* View All Blogs Link */}
        <div className="text-center mt-8">
          <Link
            to="/blogs"
            className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            View All Blog Posts
            <svg
              className="w-5 h-5 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
