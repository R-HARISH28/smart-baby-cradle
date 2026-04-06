import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Baby, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onSwitchView: () => void;
}

const AnimatedBaby = ({ isPasswordVisible }: { isPasswordVisible: boolean }) => (
  <div className="absolute -top-28 left-1/2 transform -translate-x-1/2 w-40 h-40 z-0 flex justify-center items-start">
    <svg viewBox="0 0 100 100" className="w-32 h-32 overflow-visible" xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      <circle cx="50" cy="50" r="40" fill="#fcd5ce" />
      
      {/* Three curly tufts of hair */}
      <g fill="#8b5a2b">
        <path d="M 43 14 Q 50 -5 57 14 Q 50 22 43 14" />
        <path d="M 35 22 Q 40 5 46 16 Q 40 25 35 22" />
        <path d="M 54 16 Q 60 5 65 22 Q 60 25 54 16" />
      </g>
      
      {/* Face details react to visibility state */}
      {isPasswordVisible ? (
         <g className="transition-all duration-300">
           {/* Open Eyes */}
           <circle cx="35" cy="45" r="4" fill="#333" />
           <circle cx="65" cy="45" r="4" fill="#333" />
           {/* Big Smile */}
           <path d="M 38 60 Q 50 75 62 60" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
         </g>
      ) : (
         <g className="transition-all duration-300">
           {/* Closed / Squinting Eyes */}
           <path d="M 30 45 Q 35 40 40 45" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
           <path d="M 60 45 Q 65 40 70 45" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
           {/* Small mouth */}
           <path d="M 45 65 Q 50 68 55 65" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
         </g>
      )}

      {/* Hands covering eyes with actual fingers! */}
      <g 
        className="transition-transform duration-500 ease-in-out"
        style={{ transform: isPasswordVisible ? 'translateY(30px)' : 'translateY(0px)' }}
      >
        {/* Left Hand */}
        <g>
          {/* Hand Outline & Base */}
          <path d="M 26 50 L 26 43 A 2 2 0 0 1 30 43 L 30 40 A 2 2 0 0 1 34 40 L 34 39 A 2 2 0 0 1 38 39 L 38 41 A 2 2 0 0 1 42 41 L 42 44 A 2 2 0 0 1 46 44 L 46 50 A 10 10 0 0 1 26 50 Z" 
                fill="#fcd5ce" stroke="#e8b4a8" strokeWidth="1.5" strokeLinejoin="round" />
          {/* Inner Finger Lines */}
          <polyline points="30,43 30,48" stroke="#e8b4a8" strokeWidth="1.5" strokeLinecap="round" />
          <polyline points="34,40 34,48" stroke="#e8b4a8" strokeWidth="1.5" strokeLinecap="round" />
          <polyline points="38,39 38,48" stroke="#e8b4a8" strokeWidth="1.5" strokeLinecap="round" />
          <polyline points="42,41 42,48" stroke="#e8b4a8" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* Right Hand */}
        <g>
          {/* Hand Outline & Base */}
          <path d="M 54 50 L 54 44 A 2 2 0 0 1 58 44 L 58 41 A 2 2 0 0 1 62 41 L 62 39 A 2 2 0 0 1 66 39 L 66 40 A 2 2 0 0 1 70 40 L 70 43 A 2 2 0 0 1 74 43 L 74 50 A 10 10 0 0 1 54 50 Z" 
                fill="#fcd5ce" stroke="#e8b4a8" strokeWidth="1.5" strokeLinejoin="round" />
          {/* Inner Finger Lines */}
          <polyline points="58,44 58,48" stroke="#e8b4a8" strokeWidth="1.5" strokeLinecap="round" />
          <polyline points="62,41 62,48" stroke="#e8b4a8" strokeWidth="1.5" strokeLinecap="round" />
          <polyline points="66,39 66,48" stroke="#e8b4a8" strokeWidth="1.5" strokeLinecap="round" />
          <polyline points="70,40 70,48" stroke="#e8b4a8" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  </div>
);

export default function Login({ onSwitchView }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4 pt-24">
      <div className="relative w-full max-w-md">
        
        <AnimatedBaby isPasswordVisible={showPassword} />

        <div className="relative z-10 bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-blue-500 rounded-full mb-4">
              <Baby className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to monitor your baby</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 mb-6 text-sm">
              <AlertCircle className="w-4 h-4" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
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
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Enter your password"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 mt-4"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600">
            Don't have an account?{' '}
            <button onClick={onSwitchView} className="text-blue-500 hover:text-blue-600 font-medium">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}