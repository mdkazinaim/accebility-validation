import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Vector Image Section */}
        <div className="relative">
          <img
            src="https://illustrations.popsy.co/gray/policeman-looking-at-clues.svg"
            alt="Page not found illustration"
            className="w-full h-auto max-h-[300px] mx-auto"
          />
          {/* Subtle Shadow/Glow behind the image */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10" />
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h1 className="text-8xl font-black text-gray-200">404</h1>
          <h2 className="text-3xl font-bold text-gray-900">Lost in Space?</h2>
          <p className="text-gray-500 max-w-xs mx-auto">
            The page you're looking for doesn't exist or has been moved to
            another coordinate.
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <button
            onClick={() => navigate("/login")}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
          >
            <Home className="w-4 h-4" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
