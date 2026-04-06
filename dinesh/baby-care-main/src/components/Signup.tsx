import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Baby, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface SignupProps {
  onSwitchView: () => void;
}

const AnimatedBaby = ({ isPasswordVisible }: { isPasswordVisible: boolean }) => (
  <div 
    className="absolute left-1/2 z-0 flex justify-center items-start transition-transform duration-500 ease-in-out w-40 h-40"
    style={{ 
      top: '0px', // Anchors to the top edge of the card
      // Slides up by 100px to peek out, or slides down by 20px to completely hide behind the card
      transform: `translateX(-50%) translateY(${isPasswordVisible ? '-100px' : '20px'})`
    }}
  >
    <svg viewBox="0 0 100 100" className="w-32 h-32 overflow-visible" xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      <circle cx="50" cy="50" r="40" fill="#fcd5ce" />
      
      {/* Three curly tufts of hair */}
      <g fill="#8b5a2b">
        <path d="M 43 14 Q 50 -5 57 14 Q 50 22 43 14" />
        <path d="M 35 22 Q 40 5 46 16 Q 40 25 35 22" />
        <path d="M 54 16 Q 60 5 65 22 Q 60 25 54 16" />
      </g>
      
      {/* Face: Happy & smiling */}
      <g>
         <circle cx="35" cy="45" r="4" fill="#333" />
         <circle cx="65" cy="45" r="4" fill="#333" />
         <path d="M 38 60 Q 50 75 62 60" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Hands gripping the top edge of the card */}
      <g>
        {/* Left Hand */}
        <g>
          <path d="M 18 85 L 18 76 A 3 3 0 0 1 24 76 L 24 73 A 3 3 0 0 1 30 73 L 30 71 A 3 3 0 0 1 36 71 L 36 74 A 3 3 0 0 1 42 74 L 42 85 Z" 
                fill="#fcd5ce" stroke="#e8b4a8" strokeWidth="1.5" strokeLinejoin="round" />
          <polyline points="24,76 24,85" stroke="#e8b4a8" strokeWidth="1.5" strokeLinecap="round" />
          <polyline points="30,73 30,85" stroke="#e8b4a8" strokeWidth="1.5" strokeLinecap="round" />
          <polyline points="36,71 36,85" stroke="#e8b4a8" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* Right Hand */}
        <g>
          <path d="M 58 85 L 58 74 A 3 3 0 0 1 64 74 L 64 71 A 3 3 0 0 1 70 71 L 70 73 A 3 3 0 0 1 76 73 L 76 76 A 3 3 0 0 1 82 76 L 82 85 Z" 
                fill="#fcd5ce" stroke="#e8b4a8" strokeWidth="1.5" strokeLinejoin="round" />
          <polyline points="64,74 64,85" stroke="#e8b4a8" strokeWidth="1.5" strokeLinecap="round" />
          <polyline points="70,71 70,85" stroke="#e8b4a8" strokeWidth="1.5" strokeLinecap="round" />
          <polyline points="76,73 76,85" stroke="#e8b4a8" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  </div>
);

export default function Signup({ onSwitchView }: SignupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    setIsLoading(true);
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4 pt-24">
      <div className="relative w-full max-w-md">
        
        {/* Animated Baby sliding behind the card */}
        <AnimatedBaby isPasswordVisible={showPassword} />

        {/* Z-10 ensures the solid white card covers the sliding SVG */}
        <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-indigo-500 rounded-full mb-4">
              <Baby className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
            <p className="text-gray-500 text-sm mt-1">Start monitoring your baby today</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 mb-6 text-sm">
              <AlertCircle className="w-4 h-4" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 mt-6"
            >
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600">
            Already have an account?{' '}
            <button onClick={onSwitchView} className="text-indigo-500 hover:text-indigo-600 font-medium">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}