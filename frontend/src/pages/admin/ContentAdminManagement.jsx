import React from 'react';
import Layout from '../../components/Layout';

const ContentAdminManagement = () => {
  return (
    <Layout userRole="superadmin">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Content & Admin Management</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Content and admin management features will be added here.</p>
        </div>
      </div>
    </Layout>
  );
};

export default ContentAdminManagement;