import React, { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios, { AxiosError } from 'axios';

interface FormData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ErrorResponse {
  detail?: string;
  message?: string;
  [key: string]: string | undefined;
}

function StartWithUs() {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const registerData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password2: formData.confirmPassword,
        first_name: formData.firstName,
        last_name: formData.lastName
      };

      await axios.post('http://localhost:8000/api/register/', registerData);
      
      // Show success message and redirect to login page
      setError('Registration successful! Please log in.');
      setTimeout(() => router.push('/login'), 2000);

    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error('Registration error:', axiosError.response?.data);
      
      const errorData = axiosError.response?.data;
      const errorMessage = errorData?.detail || 
                          errorData?.message ||
                          (typeof errorData === 'object' ? Object.values(errorData)[0] : null) ||
                          'Registration failed. Please try again.';
      
      setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">🌱 Join GreenGrow</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Create Account
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-green-600 hover:text-green-500">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default StartWithUs;