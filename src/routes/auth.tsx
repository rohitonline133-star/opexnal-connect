import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { User, Lock, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthComponent,
});

function AuthComponent() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      console.log("Logging in:", { emailOrPhone, password });
    } else {
      console.log("Signing up:", { emailOrPhone, password });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4 font-sans select-none">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Top Logo */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-[#8B5CF6] tracking-tight">Opexnal</h1>
        </div>

        {/* Heading & Subheading */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">
            {isLogin ? "Welcome Back!" : "Create Account"}
          </h2>
          <p className="text-xs text-gray-400 font-medium">
            {isLogin ? "Login to continue" : "Sign up to get started"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-3.5">
          {/* Email or Phone Input */}
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400">
              <User size={18} />
            </span>
            <input
              type="text"
              placeholder="Email or Phone"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
              className="w-full h-12 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition"
            />
          </div>

          {/* Password Input */}
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400">
              <Lock size={18} />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-12 pl-11 pr-11 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-gray-400 hover:text-white transition"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Forgot Password Link */}
          {isLogin && (
            <div className="text-right pt-0.5">
              <a href="#" className="text-xs font-semibold text-[#8B5CF6] hover:underline">
                Forgot Password?
              </a>
            </div>
          )}

          {/* Primary Gradient Action Button */}
          <button
            type="submit"
            className="w-full h-12 mt-2 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-sm rounded-xl transition-all shadow-lg active:scale-[0.99]"
          >
            {isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        {/* Divider */}
        <div className="w-full my-6 flex items-center justify-center relative">
          <div className="w-full border-t border-[#222222]"></div>
          <span className="absolute bg-black px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            OR
          </span>
        </div>

        {/* Social Authentication Stack (Thick Solid White Buttons) */}
        <div className="w-full space-y-3">
          {/* Instagram Button */}
          <button
            type="button"
            className="w-full h-12 bg-white text-black font-semibold text-sm rounded-xl flex items-center justify-center space-x-2.5 hover:bg-gray-100 transition active:scale-[0.99]"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                fill="url(#instagram-gradient)"
              />
              <defs>
                <linearGradient
                  id="instagram-gradient"
                  x1="2"
                  y1="21.5"
                  x2="21.5"
                  y2="2"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#f09433" />
                  <stop offset="25%" stopColor="#e6683c" />
                  <stop offset="50%" stopColor="#dc2743" />
                  <stop offset="75%" stopColor="#cc2366" />
                  <stop offset="100%" stopColor="#bc1888" />
                </linearGradient>
              </defs>
            </svg>
            <span>Continue with Instagram</span>
          </button>

          {/* Google Button */}
          <button
            type="button"
            className="w-full h-12 bg-white text-black font-semibold text-sm rounded-xl flex items-center justify-center space-x-2.5 hover:bg-gray-100 transition active:scale-[0.99]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Apple Button */}
          <button
            type="button"
            className="w-full h-12 bg-white text-black font-semibold text-sm rounded-xl flex items-center justify-center space-x-2.5 hover:bg-gray-100 transition active:scale-[0.99]"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.54c.63-.78 1.07-1.85.95-2.93-.93.04-2.07.62-2.73 1.39-.59.68-1.11 1.78-.97 2.84 1.05.08 2.12-.52 2.75-1.3" />
            </svg>
            <span>Continue with Apple</span>
          </button>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 font-medium">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#8B5CF6] font-semibold hover:underline ml-1"
            >
              {isLogin ? "Sign Up" : "Log In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
