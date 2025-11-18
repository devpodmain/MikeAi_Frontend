import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Shield, Users, FileText, TrendingUp } from "lucide-react";

export function DisclaimerSection() {
  return (
    <Card className="border-2 border-amber-200 bg-amber-50/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-amber-800">
          <AlertTriangle className="w-5 h-5" />
          <span>Important Disclaimer & Terms</span>
        </CardTitle>
        <p className="text-sm text-amber-700">
          Please read and understand these important guidelines before using our platform
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Catchy Opening Statement */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
          <p className="text-lg font-semibold text-gray-800 text-center">
            "Results vary based on dedication – not magic. If you're in the same spot after a year, it might be your hustle, not our hustle."
          </p>
        </div>

        {/* Medical Disclaimer */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-red-600" />
            <h3 className="font-semibold text-gray-800">Medical Disclaimer</h3>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-gray-700">
              <strong>This platform is NOT a substitute for professional medical advice.</strong> Always consult with your healthcare provider before starting any fitness or nutrition program. Our coaches provide general fitness guidance only and are not medical professionals unless specifically stated in their credentials.
            </p>
          </div>
        </div>

        <Separator />

        {/* General Guidelines */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-800">General Guidelines & Terms of Use</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Use this platform responsibly and follow all provided guidelines and instructions</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Respect intellectual property rights of all content, programs, and materials</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Do not share login credentials or account access with unauthorized individuals</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Report any technical issues, inappropriate behavior, or safety concerns immediately</span>
            </li>
          </ul>
        </div>

        <Separator />

        {/* Professional Behavior */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-green-600" />
            <h3 className="font-semibold text-gray-800">Professional & Respectful Behavior</h3>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <ul className="space-y-2 text-sm text-gray-700">
              <li><strong>Coaches must:</strong> Maintain professional boundaries, provide qualified guidance within their expertise, and treat all clients with respect and dignity</li>
              <li><strong>Users must:</strong> Communicate respectfully, follow coach instructions safely, and provide honest feedback about their progress and limitations</li>
              <li><strong>Zero tolerance</strong> for harassment, discrimination, inappropriate conduct, or any behavior that compromises user safety</li>
            </ul>
          </div>
        </div>

        <Separator />

        {/* Data Accuracy */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold text-gray-800">Data Accuracy & Truthfulness</h3>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-700">
              All users and coaches must provide <strong>accurate, truthful, and up-to-date information</strong> in their profiles, health assessments, and progress reports. False information compromises safety and effectiveness of programs. Misrepresentation of credentials, experience, or progress may result in account suspension.
            </p>
          </div>
        </div>

        <Separator />

        {/* Results & Responsibility */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <h3 className="font-semibold text-gray-800">Results & User Responsibility</h3>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                <strong>Individual results vary</strong> based on numerous factors including: consistency, effort, starting fitness level, genetics, lifestyle factors, adherence to recommendations, and individual health conditions.
              </p>
              <p>
                <strong>We are not responsible for:</strong>
              </p>
              <ul className="ml-4 space-y-1">
                <li>• Lack of progress due to inconsistent effort or non-compliance with programs</li>
                <li>• Individual biological or genetic factors affecting results</li>
                <li>• External lifestyle factors that impact fitness outcomes</li>
                <li>• User expectations that are unrealistic or not aligned with program capabilities</li>
              </ul>
              <p className="font-semibold text-orange-800">
                Success requires commitment, consistency, and realistic expectations. Your results are primarily determined by your dedication and effort.
              </p>
            </div>
          </div>
        </div>

        {/* Final Agreement */}
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
          <p className="text-sm text-gray-700 text-center">
            <strong>By using this platform, you acknowledge that you have read, understood, and agree to these terms and disclaimers.</strong>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function CompactDisclaimer() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <h4 className="font-semibold text-amber-800">Important Reminder</h4>
      </div>
      
      <div className="text-sm text-amber-700 space-y-2">
        <p className="font-medium">
          "Results vary based on dedication – not magic. If you're in the same spot after a year, it might be your hustle, not our hustle."
        </p>
        
        <p>
          This platform provides fitness guidance only and is not medical advice. Always consult healthcare providers for medical concerns. All profile information must be accurate and truthful.
        </p>
        
        <p className="text-xs">
          By proceeding, you agree to maintain professional behavior and understand that results depend on your personal commitment and effort.
        </p>
      </div>
    </div>
  );
}