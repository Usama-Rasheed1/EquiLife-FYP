import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function Card({
  score = "8/10",
  title = "Assessment",
  percentage = 30,
  trend = "up", // or "down"
  icon: Icon = null,
  bgColor = "bg-blue-400",
}) {
  return (
    <div
      className={`flex items-start justify-between p-4 rounded-xl shadow-sm text-white ${bgColor}`}
    >
      <div>
        <h2 className="text-xl font-semibold">{score}</h2>
        <p className="text-sm opacity-90">{title}</p>
        <div
          className={`flex items-center text-xs font-medium mt-1 ${
            trend === "up" ? "text-green-500" : "text-red-500"
          }`}
        >
          {trend === "up" ? (
            <ArrowUpRight size={14} className="mr-1" />
          ) : (
            <ArrowDownRight size={14} className="mr-1" />
          )}
          {percentage}% this week
        </div>
      </div>

      {/* Right-side icon (optional) */}
      {Icon && (
        <div className="opacity-70">
          <Icon size={24} />
        </div>
      )}
    </div>
  );
}
