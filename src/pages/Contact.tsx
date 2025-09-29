import { Card, CardContent } from "../components/ui/card";
import { AlertCircle } from "lucide-react";

export default function Contact() {
  return (
    <div className="flex justify-center items-center w-full min-h-screen bg-gray-50">
      <Card className="mx-4 w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex gap-2 mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">Contact Us</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Contact us at support@adnate.com
          </p>
          <p className="mt-4 text-sm text-gray-600">
            We are here to help you with any questions or concerns you may have.
            <br /> 
            Our office is located in San Francisco, CA.
            <br />
            Our phone number is 123-456-7890.
            <br />
            Our email is support@adnate.com.
            <br />
            Our website is https://adnate.com.
            <br />
            Our social media is @adnate.
            <br />
            Our address is 123 Main St, San Francisco, CA 94101.
            <br />
            Our hours are 9am-5pm, Monday-Friday.
            <br />
            Our fax number is 123-456-7890.
            <br />
            Our toll-free number is 1-800-555-0123.
            <br />
            
            
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
