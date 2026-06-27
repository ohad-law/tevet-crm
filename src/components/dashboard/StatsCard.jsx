import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { formatCurrency, formatNumber } from "@/components/utils/formatters";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export default function StatsCard({ title, value, icon: Icon, bgColor, subtitle, trend, isCurrency = false }) {
  const displayValue = isCurrency ? formatCurrency(value) : (typeof value === 'number' ? formatNumber(value) : value);
  
  // Extract color name from bgColor class (e.g., "bg-blue-600" -> "blue")
  const colorMatch = bgColor.match(/bg-(\w+)-/);
  const colorName = colorMatch ? colorMatch[1] : 'blue';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="relative overflow-hidden border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 group">
        {/* Top border strip */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${bgColor}`} />
        
        <CardContent className="p-4 md:p-6">
          <div className="flex justify-between items-start mb-3 md:mb-4">
            <div className={`p-2 md:p-3 rounded-xl bg-${colorName}-50 group-hover:bg-${colorName}-100 transition-colors`}>
              <Icon className={`w-5 h-5 md:w-6 md:h-6 text-${colorName}-600`} />
            </div>
            {trend && (
              <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                <ArrowUpRight className="w-3 h-3 text-green-600" />
                <span className="text-xs font-bold text-green-700">{trend}</span>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs md:text-sm font-medium text-slate-500 mb-1 truncate">{title}</p>
            <h3 className="text-xl md:text-3xl font-bold text-slate-900 tracking-tight">{displayValue}</h3>
            {subtitle && (
              <p className="text-xs md:text-sm text-slate-400 mt-1 md:mt-2 font-medium flex items-center gap-2 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></span>
                {subtitle}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}