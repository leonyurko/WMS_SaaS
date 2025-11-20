const KPICard = ({ title, value, icon, iconColor, bgColor }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center">
        <div className={`p-3 ${bgColor} rounded-full`}>
          <i className={`fas ${icon} ${iconColor} text-xl`}></i>
        </div>
        <div className="ml-4">
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default KPICard;
