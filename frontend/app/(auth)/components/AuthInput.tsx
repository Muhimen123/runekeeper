"use client";

import { useState } from "react";

// 1. Extends standard input attributes so it can take value, onChange, placeholder, etc.
interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputLabel: string;
}

export function AuthInput({ 
  inputLabel, 
  type = "text", 
  value, 
  onChange, 
  ...rest // 2. Captures all extra properties automatically
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === "password";

  return (
    // Kept Code 1's fluid 'w-full' layout style
    <div className="flex flex-col gap-1 w-full">
      {/* Kept Code 1's exact label styling */}
      <label className="m-0 p-0 text-beige text-stroke-green">
        {inputLabel}
      </label>

      {/* Input + Eye Button Container */}
      <div className="relative flex items-center">
        <input
          type={isPasswordField && showPassword ? "text" : type}
          value={value}       // Form control from Code 2
          onChange={onChange} // Form control from Code 2
          {...rest}           // Spreads placeholder, required, disabled, etc. from Code 2
          // Kept Code 1's exact aesthetic styling
          className="
            w-full
            px-3
            py-2
            rounded-md
            bg-[rgba(0,0,0,0.4)]
            border border-beige
            text-beige
            outline-none
          "
        />

        {/* Kept Code 1's complete eye-toggle logic and asset handling */}
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 flex items-center justify-center"
          >
            <img
              src={
                showPassword
                  ? "/assets/eye_open.png"
                  : "/assets/eye_closed.png"
              }
              alt="Toggle password visibility"
              className="size-8 cursor-pointer"
            />
          </button>
        )}
      </div>
    </div>
  );
}