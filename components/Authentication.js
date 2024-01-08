import React, { useState, useContext, useEffect } from "react";
import { authContext } from "@/lib/store/auth-context";
import { FcGoogle } from "react-icons/fc";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { toast } from "react-toastify";

function Authentication() {
  const {
    googleLoginHandler,
    registerWithEmailAndPassword,
    loginWithEmailAndPassword,
  } = useContext(authContext);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [useDemoAccount, setUseDemoAccount] = useState(true);

  useEffect(() => {
    if (useDemoAccount) {
      setFormData({
        name: "",
        email: "demo@gmail.com",
        password: "123456",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
      });
    }
  }, [useDemoAccount, isRegistering]);

  const togglePasswordVisibility = () => {
    setPasswordVisible((prev) => !prev);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, email, password } = formData;
    if (isRegistering) {
      registerWithEmailAndPassword(email, password, name).catch((error) => {
        if (error.code === "auth/email-already-in-use") {
          toast.error(
            "The email address is already in use by another account."
          );
        }
      });
    } else {
      loginWithEmailAndPassword(email, password).catch((error) => {
        if (error.code === "auth/invalid-login-credentials") {
          toast.error("Incorrect username or password.");
        }
      });
    }
  };

  const handleRegisterLoginToggle = () => {
    if (isRegistering) {
      setUseDemoAccount(true);
    }

    setIsRegistering((prev) => {
      if (!prev) {
        setUseDemoAccount(false);
        setFormData({
          name: "",
          email: "",
          password: "",
        });
      }
      return !prev;
    });
  };

  return (
    <main className="container max-w-2xl px-6 mx-auto">
      <h1 className="mt-4 mb-6 text-5xl font-bold text-center">Welcome 👋</h1>

      <div className="flex flex-col overflow-hidden shadow-md shadow-slate-500 bg-slate-800 rounded-2xl">
        <div className="h-52">
          <img className="object-cover w-full h-full" src="/home.png" />
        </div>

        <div className="px-4 py-4 w-70% mx-auto">
          <h3 className="text-2xl text-center">
            {isRegistering
              ? "Please sign up to continue"
              : "Please sign in to continue"}
          </h3>

          <p className="text-xs mt-3 text-center">
            {isRegistering ? "" : "If you are already a member, easily login!"}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegistering && (
              <input
                className="p-2 mt-1 rounded-xl focus:outline-none"
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            )}

            <input
              className={`p-2 ${
                isRegistering ? "" : "mt-4"
              } rounded-xl focus:outline-none`}
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <div className="relative">
              <input
                className="p-2 rounded-xl w-full focus:outline-none"
                type={passwordVisible ? "text" : "password"}
                name="password"
                placeholder="Password"
                id="password-input"
                value={formData.password}
                onChange={handleChange}
                minLength={6}
                required
              />
              <span
                className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                onClick={togglePasswordVisibility}
              >
                {passwordVisible ? (
                  <AiOutlineEye size={16} />
                ) : (
                  <AiOutlineEyeInvisible size={16} />
                )}
              </span>
            </div>
            {!isRegistering && (
              <label className="flex items-center mt-2 ml-2">
                <input
                  type="checkbox"
                  checked={useDemoAccount}
                  onChange={() => setUseDemoAccount(!useDemoAccount)}
                />
                <span className="text-sm ml-3">
                  Click to Fill in the Demo Account
                </span>
              </label>
            )}
            <button className="py-2 mt-1 w-full btn btn-primary-outline">
              {isRegistering ? "Register" : "Login"}
            </button>

            <div className="mt-3 grid grid-cols-3 items-center text-gray-400">
              <hr className="border-gray-400" />
              <p className="text-center text-sm">OR</p>
              <hr className="border-gray-400" />
            </div>

            <button
              onClick={googleLoginHandler}
              type="button"
              className="flex self-start gap-2 p-4 mx-auto mt-2 font-medium align-middle bg-gray-700 rounded-lg"
            >
              <FcGoogle className="text-2xl" /> Login with Google
            </button>

            <div className="mt-2 text-xs flex justify-between items-center">
              <p>
                {isRegistering
                  ? "Already have an account?"
                  : "Don't have an account?"}
              </p>
              <button
                type="button"
                className="py-2 px-3 btn btn-primary-outline"
                onClick={handleRegisterLoginToggle}
              >
                {isRegistering ? "Login" : "Register"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

export default Authentication;
