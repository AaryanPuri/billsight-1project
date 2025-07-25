import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../api/axios";
import './Auth.css'; 

const RegisterPage = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await api.post("/register", {
        username: data.username,
        email: data.email,
        password: data.password,
      });
      navigate("/login");
    } catch (err) {
      setServerError(err.response?.data?.detail || "Registration failed. Please try again.");
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
          <h2>Create an Account</h2>
          <p className="form-subtitle">Start tracking your expenses with Billsight today.</p>

          {serverError && <div className="server-error-message">{serverError}</div>}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                {...register("username", { required: "Username is required" })}
              />
              {errors.username && <p className="field-error-message">{errors.username.message}</p>}
            </div>

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && <p className="field-error-message">{errors.email.message}</p>}
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                {...register("password", { required: "Password is required", minLength: { value: 6, message: "Password must be at least 6 characters" } })}
              />
              {errors.password && <p className="field-error-message">{errors.password.message}</p>}
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: val => val === watch("password") || "Passwords must match"
                })}
              />
              {errors.confirmPassword && <p className="field-error-message">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" className="btn-auth" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <p className="auth-switch-text">
            Already have an account? <Link to="/login">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;