import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  const handleLogin = () => {
    navigate('/login'); // Adjust path as needed
  };

  const handleSignup = () => {
    navigate('/signup'); // Adjust path as needed
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-xl p-8 md:p-10">
        {/* Icon/Emoji */}
        <div className="text-6xl mb-6">🔒</div>
        
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Access Restricted
        </h1>
        
        {/* Description */}
        <p className="text-gray-600 mb-8">
          You don't have permission to access this page. Please authenticate or return to the previous page.
        </p>

        {/* Error Code (Optional) */}
        <div className="inline-block px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium mb-8">
          Error 403 - Unauthorized Access
        </div>

        {/* Buttons Container */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </button>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            className="flex-1 py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Login
          </button>
        </div>

        {/* Signup Link */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-gray-600 mb-4">Don't have an account?</p>
          <button
            onClick={handleSignup}
            className="w-full py-3 px-6 border-2 border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors duration-200"
          >
            Create New Account
          </button>
        </div>

        {/* Home Link */}
        <div className="mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors duration-200"
          >
            ← Return to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;