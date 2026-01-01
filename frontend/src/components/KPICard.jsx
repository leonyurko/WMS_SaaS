const KPICard = ({ title, value, icon, iconColor, bgColor }) => {
  return (
    <div className="bg-white p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full border border-gray-100">
      <div className="flex items-center gap-3">
        <div className={`p-2 ${bgColor} rounded-lg flex-shrink-0`}>
          <i className={`fas ${icon} ${iconColor} text-lg`}></i>
        </div>
        <div className="min-w-0">
          <p className="text-gray-500 text-xs font-medium truncate" title={title}>{title}</p>
          <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default KPICard;
