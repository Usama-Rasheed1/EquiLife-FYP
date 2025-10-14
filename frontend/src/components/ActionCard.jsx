

const ActionCard = ({ title, action, image, bgColor = "bg-white" }) => {
  return (
    <div className={`${bgColor} rounded-xl p-4 shadow-sm flex flex-col justify-between h-full`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          {image}
        </div>
      </div>
      <a href="#" className="text-blue-600 text-sm font-medium hover:text-blue-700 mt-4">
        {action}
      </a>
    </div>
  );
};

export default ActionCard;
