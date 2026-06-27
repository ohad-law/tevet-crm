import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function UnauthorizedAccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="max-w-2xl w-full shadow-2xl">
          <CardContent className="p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <ShieldAlert className="w-24 h-24 mx-auto mb-6 text-red-500" />
            </motion.div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ⛔ אין הרשאה
            </h1>
            
            <p className="text-xl text-gray-600 mb-2">
              דף זה מיועד למנהלים בלבד
            </p>
            
            <p className="text-gray-500 mb-8">
              אין לך הרשאות גישה לדף זה. אנא פנה למנהל המערכת.
            </p>

            <Button
              size="lg"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
            >
              <ArrowRight className="w-5 h-5 ml-2" />
              חזור לדף הבית
            </Button>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                💡 <strong>טיפ:</strong> אם אתה צריך גישה לדף זה, פנה למנהל המערכת
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}