import React from 'react';
import Layout from '../../components/Layout';
import CommunityAbuse from './CommunityAbuse';

const communityManagement = () => {
  return (
    <Layout userRole="superadmin">
      <CommunityAbuse />
    </Layout>
  );
};

export default communityManagement;