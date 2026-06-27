import React from "react";
import { Activity } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-2 mt-auto">
      <div className="max-w-[1920px] mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-slate-400 font-medium">
        <p>© {new Date().getFullYear()} LegalTech CRM. כל הזכויות שמורות.</p>
        
        <div className="flex items-center gap-4">
          <span className="hidden md:inline">Secure Enterprise System</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
            <Activity className="w-3 h-3" />
            <span>מערכת פעילה v2.4</span>
          </div>
        </div>
      </div>
    </footer>
  );
}