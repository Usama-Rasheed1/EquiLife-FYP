import React from "react";
import Card from "../components/Card";
import Layout from "../components/Layout";

const DashboardLayout = () => {
  return (
    <Layout>
      <div className="text-gray-600 p-2 lg:p-4">
        <Card/>
      </div>
    </Layout>
  );
};

export default DashboardLayout;
