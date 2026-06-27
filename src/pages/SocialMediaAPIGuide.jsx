
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Instagram, Play, Facebook, Youtube, CheckCircle, AlertCircle, ExternalLink, Copy, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirection

// IMPORTANT: The 'User' object and 'createPageUrl' function are external dependencies
// that are assumed to be available in your project.
// For this file to be syntactically correct and runnable, mock implementations are
// provided below. In your actual project, you would replace these mocks with your
// real imports and implementations (e.g., from a user authentication service or utility file).

// Mock User service - Replace with your actual User service import (e.g., import User from "@/services/user";)
// This mock simulates an asynchronous call to get user data.
const User = {
  me: async () => {
    // Simulate an API call delay
    await new Promise(resolve => setTimeout(resolve, 50));
    // Example: Return an admin user for testing success
    // return { role: 'admin' };
    // Example: Return a regular user to trigger redirection for non-admins
    return { role: 'user' };
    // Example: Return null or throw an error to trigger redirection if user is not logged in or an error occurs
    // throw new Error("User not authenticated");
    // return null;
  }
};

// Mock function to create page URLs - Replace with your actual navigation utility
// (e.g., import { createPageUrl } from "@/utils/navigation";)
const createPageUrl = (pageName) => {
  switch (pageName) {
    case "Dashboard":
      return "/dashboard"; // Adjust this path to your actual dashboard route
    // Add other page mappings as needed in your routing setup
    default:
      return "/";
  }
};


export default function SocialMediaAPIGuide() {
  const navigate = useNavigate(); // Initialize the navigate function from react-router-dom
  const [copiedText, setCopiedText] = useState(null);

  useEffect(() => {
    // Call checkAuth when the component mounts
    checkAuth();
  }, []); // Empty dependency array ensures this runs only once on mount

  const checkAuth = async () => {
    // ⚠️ Protection: Only admin users should access this page!
    try {
      // Attempt to fetch user data. .catch(() => null) ensures that if User.me()
      // throws an error or rejects, userData will be null instead of crashing.
      const userData = await User.me().catch(() => null);

      // If user data is not found, or the user's role is not 'admin', redirect them.
      if (!userData || userData.role !== 'admin') {
        navigate(createPageUrl("Dashboard")); // Redirect to the dashboard page
      }
    } catch (error) {
      // In case of any unexpected error during auth check, also redirect.
      console.error("Authentication check failed:", error);
      navigate(createPageUrl("Dashboard"));
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-purple-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">🔗 מדריך התחברות APIs</h1>
          <p className="text-gray-600">חבר את החשבונות שלך לפרסום אוטומטי ומשיכת נתונים</p>
        </div>

        {/* Status Overview */}
        <Card className="shadow-xl border-none mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <Instagram className="w-8 h-8 text-pink-600" />
                <div>
                  <p className="font-semibold">Instagram</p>
                  <Badge className="bg-yellow-100 text-yellow-800">בתהליך</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Play className="w-8 h-8 text-black" />
                <div>
                  <p className="font-semibold">TikTok</p>
                  <Badge className="bg-yellow-100 text-yellow-800">בתהליך</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Facebook className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-semibold">Facebook</p>
                  <Badge className="bg-yellow-100 text-yellow-800">בתהליך</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Youtube className="w-8 h-8 text-red-600" />
                <div>
                  <p className="font-semibold">YouTube</p>
                  <Badge className="bg-yellow-100 text-yellow-800">בתהליך</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="instagram" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="instagram">
              <Instagram className="w-4 h-4 ml-2" />
              Instagram
            </TabsTrigger>
            <TabsTrigger value="tiktok">
              <Play className="w-4 h-4 ml-2" />
              TikTok
            </TabsTrigger>
            <TabsTrigger value="facebook">
              <Facebook className="w-4 h-4 ml-2" />
              Facebook
            </TabsTrigger>
            <TabsTrigger value="youtube">
              <Youtube className="w-4 h-4 ml-2" />
              YouTube
            </TabsTrigger>
          </TabsList>

          {/* Instagram Tab */}
          <TabsContent value="instagram">
            <Card className="shadow-xl border-none">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-pink-50 to-purple-50">
                <CardTitle className="flex items-center gap-3">
                  <Instagram className="w-6 h-6" />
                  Instagram Business API
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Step 1 */}
                <div className="border-r-4 border-pink-500 pr-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">המר לחשבון עסקי</h3>
                      <p className="text-gray-600 mb-3">עבור להגדרות → חשבון → עבור לחשבון מקצועי → בחר "עסק"</p>
                      <Badge className="bg-pink-100 text-pink-800">חובה!</Badge>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="border-r-4 border-blue-500 pr-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">צור Facebook App</h3>
                      <p className="text-gray-600 mb-3">Instagram API עובד דרך Facebook</p>
                      <Button
                        variant="outline"
                        className="mb-3"
                        onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 ml-2" />
                        פתח Facebook Developers
                      </Button>
                      <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                        <p>• לחץ על "Create App"</p>
                        <p>• בחר "Business" כסוג האפליקציה</p>
                        <p>• הוסף את המוצר "Instagram Basic Display"</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="border-r-4 border-purple-500 pr-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">קבל Access Token</h3>
                      <div className="space-y-3">
                        <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                          <p className="font-semibold mb-2">📋 Redirect URI להעתקה:</p>
                          <div className="flex gap-2">
                            <code className="flex-1 bg-white p-2 rounded text-sm">
                              https://yourdomain.com/api/instagram/callback
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard('https://yourdomain.com/api/instagram/callback', 'ig-redirect')}
                            >
                              {copiedText === 'ig-redirect' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">העתק את ה-App ID ו-App Secret</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="border-r-4 border-green-500 pr-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">חבר את החשבון</h3>
                      <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                        <Instagram className="w-4 h-4 ml-2" />
                        התחבר ל-Instagram
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">נדרש אישור מפייסבוק - תהליך לוקח 1-3 ימים</p>
                    </div>
                  </div>
                </div>

                {/* What You Can Do */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    מה תוכל לעשות אחרי ההתחברות:
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-green-600" />
                      <span>פרסום פוסטים אוטומטי (תמונות + Reels)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-green-600" />
                      <span>תזמון פוסטים מראש</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-green-600" />
                      <span>משיכת נתונים: לייקים, תגובות, צפיות, שמירות</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-green-600" />
                      <span>ניהול תגובות ו-DMs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-green-600" />
                      <span>ניתוח ביצועים מתקדם</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TikTok Tab */}
          <TabsContent value="tiktok">
            <Card className="shadow-xl border-none">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-black to-gray-800 text-white">
                <CardTitle className="flex items-center gap-3">
                  <Play className="w-6 h-6" />
                  TikTok for Business API
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Step 1 */}
                <div className="border-r-4 border-black pr-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">1</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">המר לחשבון עסקי</h3>
                      <p className="text-gray-600 mb-3">הגדרות → ניהול חשבון → עבור לחשבון עסקי</p>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="border-r-4 border-pink-500 pr-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">הירשם ל-TikTok for Developers</h3>
                      <Button
                        variant="outline"
                        className="mb-3"
                        onClick={() => window.open('https://developers.tiktok.com/', '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 ml-2" />
                        פתח TikTok Developers
                      </Button>
                      <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                        <p>• צור אפליקציה חדשה</p>
                        <p>• בחר "Content Posting API"</p>
                        <p>• הגש בקשה לאישור</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="border-r-4 border-blue-500 pr-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">קבל Client Key & Secret</h3>
                      <div className="space-y-3">
                        <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                          <p className="font-semibold mb-2">📋 Redirect URI:</p>
                          <div className="flex gap-2">
                            <code className="flex-1 bg-white p-2 rounded text-sm">
                              https://yourdomain.com/api/tiktok/callback
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard('https://yourdomain.com/api/tiktok/callback', 'tt-redirect')}
                            >
                              {copiedText === 'tt-redirect' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Important Note */}
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-yellow-900 mb-2">⚠️ חשוב לדעת:</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• TikTok דורש אישור ידני - תהליך של 7-14 ימים</li>
                        <li>• צריך להסביר למה אתה צריך את ה-API</li>
                        <li>• רק חשבונות עסקיים מאושרים יכולים להשתמש</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* What You Can Do */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    יכולות TikTok API:
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-green-600" />
                      <span>העלאת סרטונים אוטומטית</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-green-600" />
                      <span>משיכת analytics מתקדמים</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-green-600" />
                      <span>ניהול תגובות</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-green-600" />
                      <span>מעקב אחרי trending sounds</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Facebook Tab */}
          <TabsContent value="facebook">
            <Card className="shadow-xl border-none">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-500 to-blue-700 text-white">
                <CardTitle className="flex items-center gap-3">
                  <Facebook className="w-6 h-6" />
                  Facebook Pages API
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Step 1 */}
                <div className="border-r-4 border-blue-500 pr-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">צור דף עסקי בפייסבוק</h3>
                      <p className="text-gray-600 mb-3">אם אין לך כבר - צור דף עסקי חדש</p>
                      <Button
                        variant="outline"
                        onClick={() => window.open('https://www.facebook.com/pages/create', '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 ml-2" />
                        צור דף עסקי
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="border-r-4 border-purple-500 pr-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">צור Facebook App (אם אין לך)</h3>
                      <Button
                        variant="outline"
                        className="mb-3"
                        onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 ml-2" />
                        Facebook Developers Console
                      </Button>
                      <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                        <p>• צור App → סוג Business</p>
                        <p>• הוסף המוצר "Pages API"</p>
                        <p>• הוסף permission: pages_manage_posts, pages_read_engagement</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="border-r-4 border-green-500 pr-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">קבל Page Access Token</h3>
                      <p className="text-sm text-gray-600 mb-3">Access Token מאפשר פרסום אוטומטי בדף</p>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Facebook className="w-4 h-4 ml-2" />
                        התחבר לדף פייסבוק
                      </Button>
                    </div>
                  </div>
                </div>

                {/* What You Can Do */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    יכולות Facebook Pages API:
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-green-600" />
                      <span>פרסום פוסטים אוטומטי (טקסט, תמונות, סרטונים)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-green-600" />
                      <span>תזמון פוסטים</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-green-600" />
                      <span>משיכת insights: הגעה, מעורבות, לייקים</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-green-600" />
                      <span>ניהול תגובות והודעות</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-green-600" />
                      <span>ניתוח demographics של העוקבים</span>
                    </li>
                  </ul>
                </div>

                {/* Pro Tip */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-2">💡 טיפ מקצועי:</h4>
                  <p className="text-sm text-gray-700">
                    פייסבוק זה הכי קל להתחבר! התהליך לוקח 5 דקות והאישור מיידי. 
                    מומלץ להתחיל מפה ואחר כך לעבור לאינסטגרם וטיקטוק.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* YouTube Tab */}
          <TabsContent value="youtube">
            <Card className="shadow-xl border-none">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-red-500 to-red-700 text-white">
                <CardTitle className="flex items-center gap-3">
                  <Youtube className="w-6 h-6" />
                  YouTube Data API v3
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Step 1 */}
                <div className="border-r-4 border-red-500 pr-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">צור Google Cloud Project</h3>
                      <Button
                        variant="outline"
                        className="mb-3"
                        onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 ml-2" />
                        Google Cloud Console
                      </Button>
                      <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                        <p>• צור פרויקט חדש</p>
                        <p>• הפעל את YouTube Data API v3</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="border-r-4 border-blue-500 pr-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">צור OAuth 2.0 Credentials</h3>
                      <div className="space-y-3">
                        <p className="text-gray-600 text-sm">APIs & Services → Credentials → Create Credentials → OAuth client ID</p>
                        <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                          <p className="font-semibold mb-2">📋 Redirect URI:</p>
                          <div className="flex gap-2">
                            <code className="flex-1 bg-white p-2 rounded text-sm">
                              https://yourdomain.com/api/youtube/callback
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard('https://yourdomain.com/api/youtube/callback', 'yt-redirect')}
                            >
                              {copiedText === 'yt-redirect' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="border-r-4 border-green-500 pr-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">חבר את הערוץ</h3>
                      <Button className="bg-red-600 hover:bg-red-700">
                        <Youtube className="w-4 h-4 ml-2" />
                        התחבר ל-YouTube
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">דרושה אימות Google</p>
                    </div>
                  </div>
                </div>

                {/* What You Can Do */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    יכולות YouTube API:
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-green-600" />
                      <span>העלאת סרטונים אוטומטית</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-green-600" />
                      <span>עדכון metadata (כותרת, תיאור, תגיות)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-green-600" />
                      <span>משיכת analytics מפורטים</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-green-600" />
                      <span>ניהול תגובות</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-green-600" />
                      <span>ניהול playlists</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help Card */}
        <Card className="shadow-xl border-none mt-8 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">💬 צריך עזרה?</h3>
            <p className="text-gray-600 mb-4">
              התהליך נראה מסובך? אני כאן לעזור! שלח לי הודעה ואני אסביר צעד אחר צעד.
            </p>
            <div className="flex gap-3">
              <Button variant="outline">
                📧 שלח מייל לתמיכה
              </Button>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                💬 צ'אט עם התמיכה
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
