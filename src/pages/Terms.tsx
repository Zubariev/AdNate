import { Card, CardContent } from "../components/ui/card";
import { AlertCircle } from "lucide-react";

export default function Terms() {
  return (
    <div className="flex justify-center items-center w-full min-h-screen bg-gray-50">
      <Card className="mx-4 w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex gap-2 mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">Terms and Conditions</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Terms and Conditions
            <br />
            Privacy Policy
            <br />
            Cookie Policy
            <br />
            Refund Policy
            <br />
            Contact Us
            <br />
            About Us
            <br />
            Our Mission
            <br />
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
