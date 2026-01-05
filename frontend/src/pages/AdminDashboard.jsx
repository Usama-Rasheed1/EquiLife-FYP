import Layout from '../components/Layout';

const AdminDashboard = () => {
  return (
    <Layout userRole="superadmin">
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Admin dashboard content will be implemented here.</p>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;