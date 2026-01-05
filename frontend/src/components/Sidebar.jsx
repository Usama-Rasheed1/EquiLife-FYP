import React from "react";

const Sidebar = ({ activePage, onPageChange, onClose, userRole = "admin"}) => {
  const adminNavigationItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: "/dashIcon.png",
      alt: "Dashboard Icon"
    },
    {
      id: "users",
      name: "Users",
      icon: "/mentalIcon.png",
      alt: "Users Icon"
    },
    {
      id: "assessments",
      name: "Assessments",
      icon: "/physicalIcon.png",
      alt: "Assessments Icon"
    },
    {
      id: "high-risk-monitoring",
      name: "High-Risk Monitoring",
      icon: "/nutritionIcon.png",
      alt: "High-Risk Monitoring Icon"
    },
    {
      id: "content-management",
      name: "Content Management",
      icon: "/commIcon.png",
      alt: "Content Management Icon"
    }
  ];

  const superAdminNavigationItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: "/dashIcon.png",
      alt: "Dashboard Icon"
    },
    {
      id: "users",
      name: "Users",
      icon: "/mentalIcon.png",
      alt: "Users Icon"
    },
    {
      id: "assessments",
      name: "Assessments",
      icon: "/physicalIcon.png",
      alt: "Assessments Icon"
    },
    {
      id: "high-risk-monitoring",
      name: "High-Risk Monitoring",
      icon: "/nutritionIcon.png",
      alt: "High-Risk Monitoring Icon"
    },
    {
      id: "content-admin-management",
      name: "Content & Admin",
      icon: "/commIcon.png",
      alt: "Content & Admin Management Icon"
    }
  ];

  const navigationItems = userRole === "superadmin" ? superAdminNavigationItems : adminNavigationItems;

  return (
    <aside className="w-60 bg-white border-r border-white shadow-md flex flex-col h-full">
      <div className="flex items-center bg-blue-400 justify-between px-4 py-[18.5px] border-white border-b">
        <div className="flex items-center space-x-2">
          <img src="/logoWhite.png" alt="Logo" className="h-8 w-8" />
          <span className="text-white font-bold text-xl">EquiLife</span>
        </div>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden text-white hover:bg-blue-500 rounded-md p-1 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <nav className="flex flex-col px-6 pt-4 text-gray-600 space-y-2 text-sm">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`flex items-center py-5 space-x-3 hover:text-blue-500 hover:bg-gray-100 cursor-pointer ${
              activePage === item.id
                ? "text-blue-600 font-semibold bg-gray-100 pr-2"
                : ""
            }`}
          >
            <img
              src={item.icon}
              alt={item.alt}
              className="h-5 w-5"
            />
            <span>{item.name}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
