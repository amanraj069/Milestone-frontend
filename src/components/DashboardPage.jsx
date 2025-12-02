import React from 'react';
import DashboardLayout from './DashboardLayout';

const DashboardPage = ({ title, headerAction, children }) => {
  return (
    <DashboardLayout>
      <div className="p-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-5xl font-bold text-gray-800">{title}</h1>
            {headerAction}
          </div>
          <div className="h-1 w-32 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full mb-8"></div>
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

