import React from 'react';
import DashboardLayout from './DashboardLayout';

const DashboardPage = ({ title, headerAction, children }) => {
  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-12 py-5 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 leading-tight">{title}</h1>
            {headerAction}
          </div>
          <div className="h-1 w-24 sm:w-32 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full mb-6 sm:mb-8"></div>
          {children || (
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              <p className="text-gray-600 text-lg">
                Content for {title} section will be displayed here.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;

