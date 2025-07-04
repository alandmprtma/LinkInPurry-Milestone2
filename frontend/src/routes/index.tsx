import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-wrap justify-between items-center min-h-screen px-12 overflow-hidden bg-[#f7f9fa]">
      {/* Left Section */}
      <div className="flex-1 min-w-[300px]">
        <img
          src="./LinkInPurry-crop.png"
          alt="InPurry Logo"
          className="w-36"
        />
        <h1 className="text-4xl my-5 text-[#333] z-[10px]">Welcome to your professional community</h1>
        <div className="flex flex-col mt-7 gap-4">
          <button
            className="px-8 py-4 text-xl font-semibold text-white bg-[#0066cc] rounded-full hover:bg-[#005bb5]"
            onClick={() => navigate({ to: '/login' })}
          >
            Log in
          </button>
          <button
            className="px-8 py-4 text-xl font-semibold text-[#0066cc] bg-white border-2 border-[#0066cc] rounded-full hover:bg-[#f1f1f1]"
            onClick={() => navigate({ to: '/register' })}
          >
            Register
          </button>
          <button
            className="flex items-center justify-center px-8 py-4 text-xl font-semibold text-[#333] bg-[#f1f1f1] border-2 border-[#ccc] rounded-full hover:bg-[#e0e0e0]"
            onClick={() => navigate({ to: '/users' })}
          >
            <i className="fas fa-user mr-3 text-lg"></i> Continue as Guest
          </button>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex-1 flex justify-center items-end relative min-w-[300px]">
        <img
          src="./indexLinkIn.svg"
          alt="Person working"
          className="w-full max-w-[600px] max-h-[70vh] object-contain"
        />
      </div>
    </div>
  );
}
