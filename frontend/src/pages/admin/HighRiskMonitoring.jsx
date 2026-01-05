import React from 'react';
import Layout from '../../components/Layout';

const HighRiskMonitoring = () => {
  return (
    <Layout userRole="superadmin">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">High-Risk Monitoring</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">High-risk monitoring content will be added here.</p>
        </div>
      </div>
    </Layout>
  );
};

export default HighRiskMonitoring;