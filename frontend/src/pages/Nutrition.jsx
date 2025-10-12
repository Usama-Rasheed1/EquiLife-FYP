import React from "react";
import Layout from "../components/Layout";

const Nutrition = () => {
  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 m-2 lg:m-4">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800 mb-3 lg:mb-4">Nutrition</h1>
        <p className="text-sm lg:text-base text-gray-600">
          This is the Nutrition page. Here you can track your meals and nutritional intake.
        </p>
      </div>
    </Layout>
  );
};

export default Nutrition;
