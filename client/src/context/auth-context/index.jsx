import { Skeleton } from "@/components/ui/skeleton";
import { initialSignInFormData, initialSignUpFormData } from "@/config";
import { checkAuthService, loginService, otpService, registerService } from "@/services";
import { message } from "antd";
import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [signInFormData, setSignInFormData] = useState(initialSignInFormData);
  const [signUpFormData, setSignUpFormData] = useState(initialSignUpFormData);
  const [otpFormData, setOtpFormData] = useState({ otp: ""});
  const [otpVisible,setOtpVisible]=useState(false);
  const [auth, setAuth] = useState({
    authenticate: false,
    user: null,
  });
  const [loading, setLoading] = useState(true);

  async function handleRegisterUser(event) {
    event.preventDefault();
  
    // Set the user email for OTP form
    setOtpFormData((prev) => ({
      ...prev,
      userEmail: signUpFormData.userEmail,
    }));
  
    try {
      // Make API call to register user
      const data = await registerService(signUpFormData);
  
      if (data.success) {
        // Handle successful registration
        message.success("OTP sent to your email");
        setOtpVisible(true);
        // You can proceed to the next step (e.g., OTP verification)
      } else {
        // Handle registration failure (show an error message)
        console.error('Registration failed:', data.message);
        // Show a user-friendly error message, e.g., using Ant Design's message component
        message.error(`Registration failed: ${data.message}`);
      }
    } catch (error) {
      // Handle unexpected errors, such as network issues or API errors
      console.error('Error during registration:', error);
      message.error('An error occurred while registering. Please try again.');
    }
  }

  async function handleOtpVerification(event) {
    event.preventDefault();
  
    try {
      // Make API call to verify OTP
      const data = await otpService(otpFormData);
  
      if (data.success) {
        // Handle successful OTP verification
        message.success('OTP verification successful!');
        // Proceed to the next step (e.g., user login or dashboard)
      } else {
        // Handle OTP verification failure
        console.error('OTP verification failed:', data.message);
        message.error(`OTP verification failed: ${data.message}`);
      }
    } catch (error) {
      // Handle unexpected errors, such as network issues or API errors
      console.error('Error during OTP verification:', error);
      message.error('An error occurred while verifying OTP. Please try again.');
    }
  }
  
  


  async function handleLoginUser(event) {
    event.preventDefault();
    const data = await loginService(signInFormData);
    console.log(data, "datadatadatadatadata");

    if (data.success) {
      sessionStorage.setItem(
        "accessToken",
        JSON.stringify(data.data.accessToken)
      );
      setAuth({
        authenticate: true,
        user: data.data.user,
      });
    } else {
      setAuth({
        authenticate: false,
        user: null,
      });
      message.error(data.message)
    }
  }

  //check auth user

  async function checkAuthUser() {
    try {
      const data = await checkAuthService();
      if (data.success) {
        setAuth({
          authenticate: true,
          user: data.data.user,
        });
        setLoading(false);
      } else {
        setAuth({
          authenticate: false,
          user: null,
        });
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      if (!error?.response?.data?.success) {
        setAuth({
          authenticate: false,
          user: null,
        });
        setLoading(false);
      }
    }
  }

  function resetCredentials() {
    setAuth({
      authenticate: false,
      user: null,
    });
  }

  useEffect(() => {
    checkAuthUser();
  }, []);

  console.log(auth, "gf");

  return (
    <AuthContext.Provider
      value={{
        signInFormData,
        setSignInFormData,
        signUpFormData,
        setSignUpFormData,
        handleRegisterUser,
        handleLoginUser,
        otpFormData,
        auth,
        resetCredentials,
        handleOtpVerification,
        setOtpFormData,
        otpVisible
      }}
    >
      {loading ? <Skeleton /> : children}
    </AuthContext.Provider>
  );
}
