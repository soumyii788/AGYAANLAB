import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Lock, User, Building2, AlertCircle } from 'lucide-react';

export const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    organization: '',
    role: 'researcher',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      const errors = err.response?.data;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        const msg = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : errors[firstKey];
        setError(`${firstKey}: ${msg}`);
      } else {
        setError('Registration failed. Please check the values provided.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#1E2022]">Create AGYAAN LAB Account</h2>
        <p className="text-xs text-[#4A4D55] mt-1">
          Join the intelligence layer designed to find what science missed.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First Name"
            name="first_name"
            placeholder="Ada"
            value={formData.first_name}
            onChange={handleChange}
            required
          />
          <Input
            label="Last Name"
            name="last_name"
            placeholder="Lovelace"
            value={formData.last_name}
            onChange={handleChange}
            required
          />
        </div>

        <Input
          label="Username"
          name="username"
          placeholder="alovelace"
          value={formData.username}
          onChange={handleChange}
          leftIcon={<User className="w-4 h-4" />}
          required
        />

        <Input
          label="Email Address"
          type="email"
          name="email"
          placeholder="ada@lovelace.org"
          value={formData.email}
          onChange={handleChange}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <Input
          label="Institution / Organization"
          name="organization"
          placeholder="Stanford AI Lab"
          value={formData.organization}
          onChange={handleChange}
          leftIcon={<Building2 className="w-4 h-4" />}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            name="password_confirm"
            placeholder="••••••••"
            value={formData.password_confirm}
            onChange={handleChange}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-3"
          isLoading={loading}
        >
          Create Account
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-[#E5E7EB] text-center">
        <p className="text-xs text-[#4A4D55]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#3B82F6] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
