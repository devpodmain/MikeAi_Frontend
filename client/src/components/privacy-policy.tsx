import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Database, Lock, Trash2, Share2, Eye, Clock, Mail } from "lucide-react";
import { SiGoogle, SiX } from "react-icons/si";

export function PrivacyPolicySection() {
  const lastUpdated = "December 1, 2025";
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Shield className="w-6 h-6" />
            <span>Privacy Policy</span>
          </CardTitle>
          <p className="text-sm text-blue-700">
            Last updated: {lastUpdated}
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            At MikeAI, we are committed to protecting your privacy and ensuring the security of your personal information. 
            This Privacy Policy explains how we collect, use, store, and protect your data when you use our fitness and wellness platform.
          </p>
        </CardContent>
      </Card>

      {/* Data We Collect */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-800">
            <Database className="w-5 h-5 text-purple-600" />
            <span>Data We Collect</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Account Information</h4>
            <ul className="space-y-2 text-sm text-gray-700 ml-4">
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Email address</strong> - Used for account identification, login, and communications</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Full name</strong> - Used for personalization and display within the application</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Profile picture</strong> - Optional, used for account personalization</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Password</strong> - Securely hashed and stored for email-based authentication</span>
              </li>
            </ul>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Health & Fitness Data</h4>
            <ul className="space-y-2 text-sm text-gray-700 ml-4">
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Height, weight, age, and body measurements</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Fitness goals and dietary preferences</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Workout progress and habit tracking data</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Meal plans and nutrition information</span>
              </li>
            </ul>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Usage Data</h4>
            <ul className="space-y-2 text-sm text-gray-700 ml-4">
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Session information and login timestamps</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Feature usage patterns to improve our services</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Google OAuth Data Section */}
      <Card className="border-2 border-red-100">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
          <CardTitle className="flex items-center space-x-2 text-gray-800">
            <SiGoogle className="w-5 h-5 text-red-500" />
            <span>Data We Collect from Google Sign-In</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <p className="text-sm text-gray-700">
            When you choose to sign in with Google, our application accesses the following Google user data:
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg border">
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Full Name</strong> - Your name as displayed on your Google account</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Email Address</strong> - Your primary Google email address</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Profile Picture</strong> - Your Google profile photo (optional)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Authentication Tokens</strong> - Secure tokens to maintain your login session</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Why We Collect This Data</h4>
            <p className="text-sm text-gray-700">
              We collect this information solely to:
            </p>
            <ul className="space-y-2 text-sm text-gray-700 ml-4">
              <li>• Create and authenticate your MikeAI account</li>
              <li>• Personalize your dashboard experience</li>
              <li>• Securely manage your user identity within the application</li>
              <li>• Enable seamless login without requiring a separate password</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-800 font-medium">
              <strong>Important:</strong> MikeAI does NOT use Google data for advertising, does NOT sell your data to third parties, 
              and does NOT access any other Google services beyond basic profile information for authentication.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Twitter/X OAuth Data Section */}
      <Card className="border-2 border-gray-200">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
          <CardTitle className="flex items-center space-x-2 text-gray-800">
            <SiX className="w-5 h-5 text-black" />
            <span>Data We Collect from Twitter/X Sign-In</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <p className="text-sm text-gray-700">
            When you choose to sign in with Twitter/X, our application accesses the following data:
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg border">
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Display Name</strong> - Your name as displayed on your Twitter/X profile</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Username</strong> - Your Twitter/X handle</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Email Address</strong> - Your email associated with Twitter/X (if available)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Profile Picture</strong> - Your Twitter/X profile photo</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Authentication Tokens</strong> - Secure tokens to maintain your login session</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-gray-700">
            This data is used exclusively for account creation, authentication, and personalization within MikeAI.
          </p>
        </CardContent>
      </Card>

      {/* How We Use Your Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-800">
            <Eye className="w-5 h-5 text-blue-600" />
            <span>How We Use Your Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start space-x-3">
              <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <span><strong>Account Management:</strong> To create, authenticate, and manage your user account</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <span><strong>Personalization:</strong> To generate personalized meal plans, workout recommendations, and AI-powered suggestions based on your goals and preferences</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <span><strong>Service Delivery:</strong> To provide our fitness coaching, habit tracking, and wellness features</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
              <span><strong>Communications:</strong> To send account-related notifications, password resets, and important service updates</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">5</span>
              <span><strong>Improvement:</strong> To analyze usage patterns and improve our platform's features and user experience</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* How We Store Your Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-800">
            <Lock className="w-5 h-5 text-green-600" />
            <span>How We Store & Secure Your Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <Lock className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Data is stored securely in PostgreSQL databases hosted on Neon with encryption at rest</span>
              </li>
              <li className="flex items-start space-x-2">
                <Lock className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>All communications are encrypted using SSL/TLS protocols</span>
              </li>
              <li className="flex items-start space-x-2">
                <Lock className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Passwords are hashed using bcrypt with secure salting</span>
              </li>
              <li className="flex items-start space-x-2">
                <Lock className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Authentication tokens are stored securely and never exposed to client-side code</span>
              </li>
              <li className="flex items-start space-x-2">
                <Lock className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>We follow industry-standard security practices for token handling and session management</span>
              </li>
              <li className="flex items-start space-x-2">
                <Lock className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Payment information is processed securely through Stripe and never stored on our servers</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-800">
            <Clock className="w-5 h-5 text-orange-600" />
            <span>Data Retention</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            We retain your personal data for as long as your account is active or as needed to provide you with our services. 
            Specifically:
          </p>
          <ul className="space-y-2 text-sm text-gray-700 ml-4">
            <li>• <strong>Account data:</strong> Retained until you delete your account</li>
            <li>• <strong>Fitness and health data:</strong> Retained until you delete your account or specific data</li>
            <li>• <strong>Session data:</strong> Automatically expires after 7 days of inactivity</li>
            <li>• <strong>Authentication tokens:</strong> Refreshed regularly and invalidated upon logout</li>
          </ul>
        </CardContent>
      </Card>

      {/* Data Sharing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-800">
            <Share2 className="w-5 h-5 text-red-600" />
            <span>Data Sharing</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-red-800 font-semibold mb-3">
              MikeAI does NOT sell, rent, or share your personal data with third parties for advertising or marketing purposes.
            </p>
          </div>
          
          <p className="text-sm text-gray-700">
            We may share data only in the following limited circumstances:
          </p>
          <ul className="space-y-2 text-sm text-gray-700 ml-4">
            <li>• <strong>With your consent:</strong> When you explicitly authorize us to share information</li>
            <li>• <strong>Service providers:</strong> With trusted third parties who help us operate our services (e.g., Stripe for payments, Resend for emails) under strict confidentiality agreements</li>
            <li>• <strong>Organization coaches:</strong> If you are a client of an organization, your assigned coach may view your progress data</li>
            <li>• <strong>Legal requirements:</strong> When required by law, legal process, or to protect our rights</li>
          </ul>
        </CardContent>
      </Card>

      {/* Data Deletion */}
      <Card className="border-2 border-purple-200">
        <CardHeader className="bg-purple-50">
          <CardTitle className="flex items-center space-x-2 text-gray-800">
            <Trash2 className="w-5 h-5 text-purple-600" />
            <span>Your Rights & Data Deletion</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <p className="text-sm text-gray-700">
            You have the following rights regarding your personal data:
          </p>
          <ul className="space-y-2 text-sm text-gray-700 ml-4">
            <li>• <strong>Access:</strong> Request a copy of your personal data</li>
            <li>• <strong>Correction:</strong> Request correction of inaccurate data</li>
            <li>• <strong>Deletion:</strong> Request deletion of your data and account</li>
            <li>• <strong>Portability:</strong> Request your data in a portable format</li>
            <li>• <strong>Withdraw consent:</strong> Revoke any previously given consent</li>
          </ul>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">How to Delete Your Data</h4>
            <p className="text-sm text-gray-700">
              You may delete your data at any time by:
            </p>
            <ul className="space-y-2 text-sm text-gray-700 ml-4">
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>In-App Deletion:</strong> Navigate to Settings → Account → Delete Account</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Email Request:</strong> Send a deletion request to <a href="mailto:support@mikeai.co" className="text-purple-600 underline">support@mikeai.co</a></span>
              </li>
            </ul>
            <p className="text-sm text-gray-600 italic">
              Upon account deletion, all your personal data, health information, and associated records will be permanently removed from our systems within 30 days.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-800 mb-2">Revoking Google/Twitter Access</h4>
            <p className="text-sm text-gray-700">
              You can also revoke MikeAI's access to your Google or Twitter account at any time:
            </p>
            <ul className="space-y-1 text-sm text-gray-700 ml-4 mt-2">
              <li>• <strong>Google:</strong> Visit <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">myaccount.google.com/permissions</a></li>
              <li>• <strong>Twitter/X:</strong> Visit <a href="https://twitter.com/settings/connected_apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">twitter.com/settings/connected_apps</a></li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Mail className="w-5 h-5" />
            <span>Contact Us</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            If you have any questions about this Privacy Policy, your data, or wish to exercise your rights, please contact us:
          </p>
          <div className="bg-white p-4 rounded-lg border">
            <ul className="space-y-2 text-sm text-gray-700">
              <li><strong>Email:</strong> <a href="mailto:support@mikeai.co" className="text-blue-600 underline">support@mikeai.co</a></li>
              <li><strong>Data Protection Inquiries:</strong> <a href="mailto:nkrvivek@gmail.com" className="text-blue-600 underline">nkrvivek@gmail.com</a></li>
              <li><strong>Website:</strong> <a href="https://mikeai.co" className="text-blue-600 underline">https://mikeai.co</a></li>
            </ul>
          </div>
          <p className="text-sm text-gray-600 italic">
            We aim to respond to all privacy-related inquiries within 48 hours.
          </p>
        </CardContent>
      </Card>

      {/* Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-800">
            <Shield className="w-5 h-5 text-green-600" />
            <span>Compliance & Standards</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">
            MikeAI is committed to complying with applicable data protection regulations including:
          </p>
          <ul className="space-y-2 text-sm text-gray-700 ml-4 mt-3">
            <li>• Google API Services User Data Policy</li>
            <li>• Google APIs Terms of Service</li>
            <li>• Twitter Developer Agreement and Policy</li>
            <li>• General Data Protection Regulation (GDPR) principles</li>
            <li>• California Consumer Privacy Act (CCPA) principles</li>
          </ul>
        </CardContent>
      </Card>

      {/* Policy Updates */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <p className="text-sm text-gray-600 text-center">
            <strong>Policy Updates:</strong> We may update this Privacy Policy from time to time. 
            We will notify you of any material changes by posting the new Privacy Policy on this page 
            and updating the "Last updated" date above. Continued use of MikeAI after changes constitutes 
            acceptance of the updated policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
