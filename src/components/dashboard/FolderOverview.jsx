import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function FolderOverview({ folders, cases }) {
  const COLORS = ['#4285F4', '#EA4335', '#FBBC04', '#34A853', '#9C27B0', '#FF9800', '#E91E63', '#00BCD4'];

  const folderData = folders
    .filter(f => !f.parent_folder_id) // Only root folders
    .map((folder, index) => {
      const folderCases = cases.filter(c => c.folder_id === folder.id || c.subfolder_id === folder.id);
      const activeCases = folderCases.filter(c => c.status !== 'ארכיון' && c.status !== 'פסק דין');
      
      return {
        name: folder.folder_name,
        value: activeCases.length,
        total: folderCases.length,
        color: folder.color || COLORS[index % COLORS.length],
        icon: folder.icon
      };
    })
    .filter(f => f.total > 0)
    .sort((a, b) => b.value - a.value);

  const totalActive = folderData.reduce((sum, f) => sum + f.value, 0);
  const totalCases = folderData.reduce((sum, f) => sum + f.total, 0);

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-xl font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-blue-600" />
            תיקים לפי תיקיות
          </span>
          <div className="flex items-center gap-4 text-sm font-normal">
            <span className="text-blue-600 font-bold">{totalActive} פעילים</span>
            <span className="text-gray-500">מתוך {totalCases}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {folderData.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={folderData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={CustomLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {folderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} פעילים (${props.payload.total} סה"כ)`,
                      props.payload.name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Folder List */}
            <div className="space-y-3">
              {folderData.map((folder, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border hover:shadow-md transition-shadow"
                  style={{ borderRight: `4px solid ${folder.color}` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{folder.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{folder.name}</p>
                      <p className="text-xs text-gray-500">{folder.total} תיקים</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold" style={{ color: folder.color }}>
                      {folder.value}
                    </p>
                    <p className="text-xs text-gray-500">פעילים</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>אין תיקיות עם תיקים עדיין</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}