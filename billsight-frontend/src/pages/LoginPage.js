import React, { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useForm } from "react-hook-form";
import api from "../api/axios";
import './Auth.css'; 

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      const resp = await api.post("/token", new URLSearchParams({
        username: data.username,
        password: data.password,
      }));
      await login(resp.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setServerError("Invalid username or password.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-info-panel">
        <h1>Billsight</h1>
        <p>Your intelligent receipt management and expense tracking companion. Gain clarity on your spending.</p>
      </div>
      <div className="auth-form-panel">
        <div className="form-container">
          <h2>Welcome Back!</h2>
          <p className="form-subtitle">Please enter your details to log in.</p>
          
          {serverError && <div className="server-error-message">{serverError}</div>}
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                {...register("username", { required: "Username is required" })}
                autoFocus
              />
              {errors.username && <p className="field-error-message">{errors.username.message}</p>}
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                {...register("password", { required: "Password is required" })}
              />
              {errors.password && <p className="field-error-message">{errors.password.message}</p>}
            </div>

            <button type="submit" className="btn-auth" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p className="auth-switch-text">
            Don't have an account? <Link to="/register">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;