import React from 'react';

export default function AdminStatCard({ title, value, subtitle, tone = 'indigo' }) {
  const toneMap = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
    red: { bg: 'bg-red-50', text: 'text-red-600' },
  };

  const toneClass = toneMap[tone] || toneMap.indigo;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-gray-100 shadow-sm">
      <div>
        <div className="text-xs text-gray-500 mb-1">{title}</div>
        <div className="text-xl font-semibold text-gray-900">{value}</div>
      </div>

      <div className={`w-10 h-10 flex items-center justify-center rounded-full ${toneClass.bg}`}> 
        <div className={`${toneClass.text} font-semibold text-sm`}>{/* decorative */}
          {title.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  );
}
