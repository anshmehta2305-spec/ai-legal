import API_BASE from "../api";
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, User, Phone, Users, Calendar, Mail, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    gender: '',
    age: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const validate = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = 'Name is required';

    if (!formData.mobile.trim()) {
      tempErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      tempErrors.mobile = 'Mobile number must be exactly 10 digits';
    }

    if (!formData.gender) tempErrors.gender = 'Gender selection is required';

    if (!formData.age) {
      tempErrors.age = 'Age is required';
    } else if (isNaN(formData.age) || Number(formData.age) <= 0 || Number(formData.age) > 120) {
      tempErrors.age = 'Age must be a valid number between 1 and 120';
    }

    if (!formData.email.trim()) {
      tempErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      tempErrors.email = 'Enter a valid email address';
    }

    if (!formData.password) {
      tempErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error when typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/register`, {
        name: formData.name,
        mobile: formData.mobile,
        gender: formData.gender,
        age: parseInt(formData.age, 10),
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        setSuccessMsg("SignUp Success");
        // Clear form
        setFormData({
          name: '',
          mobile: '',
          gender: '',
          age: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg('Registration failed. Please make sure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <div className="glass p-8 rounded-2xl shadow-2xl relative">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-legal-gold/10 p-3 rounded-full border border-legal-gold/30 mb-2">
            <UserPlus className="w-8 h-8 text-legal-gold" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)] tracking-wide">Create Account</h2>
          <p className="text-xs text-gray-500 font-sans mt-1">Register to start clustering legal cases</p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-5 flex items-center gap-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">{successMsg}! Redirecting to Login...</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 flex items-center gap-3 bg-rose-950/40 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-mono uppercase text-gray-400 mb-1.5" htmlFor="name">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <User className="w-4 h-4" />
              </span>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter full name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full bg-legal-darker border ${errors.name ? 'border-rose-500' : 'border-legal-border'} focus:border-legal-gold text-[var(--text-primary)] pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition-colors`}
              />
            </div>
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
          </div>

          {/* Mobile Field */}
          <div>
            <label className="block text-xs font-mono uppercase text-gray-400 mb-1.5" htmlFor="mobile">Mobile Number</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <Phone className="w-4 h-4" />
              </span>
              <input
                id="mobile"
                name="mobile"
                type="text"
                maxLength="10"
                placeholder="Enter 10-digit mobile number"
                value={formData.mobile}
                onChange={handleChange}
                className={`w-full bg-legal-darker border ${errors.mobile ? 'border-rose-500' : 'border-legal-border'} focus:border-legal-gold text-[var(--text-primary)] pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition-colors`}
              />
            </div>
            {errors.mobile && <p className="text-xs text-rose-500 mt-1">{errors.mobile}</p>}
          </div>

          {/* Gender and Age Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Gender Field */}
            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-1.5" htmlFor="gender">Gender</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <Users className="w-4 h-4" />
                </span>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`w-full bg-legal-darker border ${errors.gender ? 'border-rose-500' : 'border-legal-border'} focus:border-legal-gold text-[var(--text-primary)] pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none appearance-none cursor-pointer transition-colors`}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {errors.gender && <p className="text-xs text-rose-500 mt-1">{errors.gender}</p>}
            </div>

            {/* Age Field */}
            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-1.5" htmlFor="age">Age</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  id="age"
                  name="age"
                  type="text"
                  placeholder="Age"
                  value={formData.age}
                  onChange={handleChange}
                  className={`w-full bg-legal-darker border ${errors.age ? 'border-rose-500' : 'border-legal-border'} focus:border-legal-gold text-[var(--text-primary)] pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition-colors`}
                />
              </div>
              {errors.age && <p className="text-xs text-rose-500 mt-1">{errors.age}</p>}
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-mono uppercase text-gray-400 mb-1.5" htmlFor="email">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
                className={`w-full bg-legal-darker border ${errors.email ? 'border-rose-500' : 'border-legal-border'} focus:border-legal-gold text-[var(--text-primary)] pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition-colors`}
              />
            </div>
            {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-mono uppercase text-gray-400 mb-1.5" htmlFor="password">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Choose password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full bg-legal-darker border ${errors.password ? 'border-rose-500' : 'border-legal-border'} focus:border-legal-gold text-[var(--text-primary)] pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition-colors`}
              />
            </div>
            {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-xs font-mono uppercase text-gray-400 mb-1.5" htmlFor="confirmPassword">Confirm Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full bg-legal-darker border ${errors.confirmPassword ? 'border-rose-500' : 'border-legal-border'} focus:border-legal-gold text-[var(--text-primary)] pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition-colors`}
              />
            </div>
            {errors.confirmPassword && <p className="text-xs text-rose-500 mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-legal-gold to-legal-goldDark hover:from-legal-goldLight hover:to-legal-gold text-legal-darker font-bold py-3 rounded-lg shadow-md cursor-pointer hover:shadow-legal-gold/20 hover:scale-[1.01] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing up...</span>
              </>
            ) : (
              <span>Sign Up</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-legal-gold hover:text-legal-goldLight font-semibold hover:underline">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
