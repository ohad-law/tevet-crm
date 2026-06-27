import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#1e40af', '#d97706', '#059669'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
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
      style={{ fontSize: '14px', fontWeight: 'bold' }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function CaseDistribution({ cases }) {
  // Process cases data
  const caseTypes = {
    'דיני עבודה - תביעה': 0,
    'דיני עבודה - עובדים זרים': 0,
    'חדלות פירעון': 0
  };

  // Count cases by type
  if (cases && Array.isArray(cases)) {
    cases.forEach(caseItem => {
      if (caseItem.case_type && caseTypes.hasOwnProperty(caseItem.case_type)) {
        caseTypes[caseItem.case_type]++;
      }
    });
  }

  // Convert to chart data format
  const data = Object.entries(caseTypes).map(([name, value]) => ({
    name,
    value
  })).filter(item => item.value > 0); // Only show types with cases

  // If no data, show placeholder
  if (data.length === 0) {
    return (
      <Card className="shadow-lg border-none">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-xl font-bold text-gray-900">חלוקת תיקים לפי סוג</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-gray-500">אין תיקים להצגה</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-xl font-bold text-gray-900">חלוקת תיקים לפי סוג</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={90}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '14px', fontWeight: '500' }}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}