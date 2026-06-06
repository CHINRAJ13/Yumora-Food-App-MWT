import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  disabled?: boolean;
}

const OTPInput = ({ length = 6, onComplete, disabled = false }: OTPInputProps) => {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    // Take only the last character if multiple are entered (e.g. paste)
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Trigger onComplete if all digits are filled
    const combinedOtp = newOtp.join("");
    if (combinedOtp.length === length) {
      onComplete(combinedOtp);
    }

    // Move to next input if value is entered
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace if current is empty
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").substring(0, length).split("");
    if (data.every(item => !isNaN(Number(item)))) {
      const newOtp = [...otp];
      data.forEach((value, index) => {
        newOtp[index] = value;
      });
      setOtp(newOtp);
      const combinedOtp = newOtp.join("");
      if (combinedOtp.length === length) {
        onComplete(combinedOtp);
      }
      // Focus the last filled input or the last one
      const lastIndex = Math.min(data.length, length - 1);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  return (
    <div className="flex justify-between gap-2 sm:gap-4" onPaste={handlePaste}>
      {otp.map((digit, index) => (
        <Input
          key={index}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          ref={(el) => (inputRefs.current[index] = el)}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white/50 backdrop-blur-sm transition-all"
        />
      ))}
    </div>
  );
};

export default OTPInput;
