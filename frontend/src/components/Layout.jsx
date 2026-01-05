import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = ({ children, userName = "Tayyab ", userRole: propUserRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const storeUser = useSelector((s) => s.user || {});
  const userRole = propUserRole || storeUser.role || 'user';
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Update active page based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/admin/users")) {
      setActivePage("users");
    } else if ( path.includes("/admin/community-abuse")) {
      setActivePage("community-abuse");
    } else if (path.includes("/admin/high-risk-monitoring")) {
      setActivePage("high-risk-monitoring");
    } else if (path.includes("/admin/content-management")) {
      setActivePage("content-management");
    } else if (path.includes("/admin/content-admin-management")) {
      setActivePage("content-admin-management");
    } 
  }, [location.pathname]);

  const handlePageChange = (pageId) => {
    setActivePage(pageId);
    // Navigate to the corresponding route
    if (pageId === "dashboard") {
      // route depends on role
      if (userRole && (userRole === 'admin' || userRole === 'superadmin')) navigate(`/admin/dashboard`);
      else navigate("/dashboard");
    } else {
      if (userRole && (userRole === 'admin' || userRole === 'superadmin')) navigate(`/admin/${pageId}`);
      else navigate(`/dashboard/${pageId}`);
    }
    // Close sidebar on mobile after navigation
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen relative">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile, shown on desktop */}
      <div className="hidden lg:block">
        <Sidebar activePage={activePage} onPageChange={handlePageChange} userRole={userRole} />
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar 
          activePage={activePage} 
          onPageChange={handlePageChange} 
          onClose={() => setSidebarOpen(false)}
          userRole={userRole}
        />
      </div>

      {/* Right Side: Main Section */}
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        {/* Navbar */}
        <Navbar userName={userName} activePage={activePage} onToggleSidebar={toggleSidebar} userRole={userRole} />

        {/* Main content */}
        <main className="flex-1 bg-gray-50 overflow-y-auto">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
