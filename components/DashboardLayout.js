// components/DashboardLayout.js

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import Image from 'next/image'; // Import the Image component from Next.js

function DashboardLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [greenhouses, setGreenhouses] = useState([]);
  const [selectedGreenhouse, setSelectedGreenhouse] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
      console.log('DashboardLayout: No access token found, redirecting to login.');
      router.push('/login');
      return;
    }

    const fetchFullUserData = async (token) => {
      try {
        const response = await axios.get('http://localhost:8000/api/users/me/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data);
      } catch (error) {
        console.error('DashboardLayout: Error fetching full user data:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        router.push('/login');
      }
    };

    const fetchGreenhouses = async (token) => {
      try {
        const response = await axios.get('http://localhost:8000/api/greenhouses/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setGreenhouses(response.data);
        return response.data;
      } catch (error) {
        console.error('DashboardLayout: Error fetching greenhouses list:', error);
        setGreenhouses([]);
        return [];
      }
    };

    fetchFullUserData(accessToken);

    fetchGreenhouses(accessToken).then(fetchedGreenhouses => {
      if (fetchedGreenhouses.length > 0 && selectedGreenhouse === '') {
        if (fetchedGreenhouses[0] && fetchedGreenhouses[0].id !== undefined) {
          setSelectedGreenhouse(String(fetchedGreenhouses[0].id));
        }
      }
    });

  }, [router]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuRef]);

  const handleGreenhouseChange = (event) => {
    const newGreenhouseId = event.target.value;
    setSelectedGreenhouse(newGreenhouseId);
    const currentPath = router.pathname;
    router.push({
      pathname: currentPath,
      query: { ...router.query, greenhouse_id: newGreenhouseId },
    });
  };

  // REVISED MODIFICATION: Handle full URL from backend
  const getProfilePictureSrc = (user) => {
    let rawPath = user?.profile_picture;
    const baseUrl = 'http://localhost:8000';

    // 1. Basic checks for existence and type
    if (!user || typeof rawPath !== 'string' || rawPath.trim() === '') {
      return '/images/default-avatar.png'; // Fallback if no user, no picture, or empty string
    }

    let finalUrl = rawPath.trim();

    // 2. Check if the path is already a full URL
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      // If it's a relative path, ensure it starts with '/' and prepend base URL
      if (!finalUrl.startsWith('/')) {
          finalUrl = '/' + finalUrl;
      }
      finalUrl = `${baseUrl}${finalUrl}`;
    }

    // 3. Validate the URL before returning to Next.js Image component
    try {
        new URL(finalUrl); // Attempt to create a URL object to validate
        console.log('DashboardLayout: Successfully constructed image URL:', finalUrl); // For debugging
        return finalUrl;
    } catch (e) {
        console.error('DashboardLayout: Invalid URL detected for profile picture:', finalUrl, 'Error:', e);
        return '/images/default-avatar.png'; // Fallback on invalid URL construction
    }
  };


  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading user data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className={`bg-gray-200 p-6 flex-shrink-0 ${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className={`${isSidebarOpen ? 'block' : 'hidden'}`}>
          <div className="mb-8">
            <div className="text-2xl font-bold text-green-500">🌱 GreenGrow</div>
          </div>
          <nav>
            <h3 className="font-semibold text-gray-700 mb-2">Sections</h3>
            <Link href={{ pathname: '/dashboard', query: { ...router.query, greenhouse_id: selectedGreenhouse } }} className={`block py-2 text-gray-600 hover:text-green-500 ${router.pathname === '/dashboard' ? 'text-green-600 font-bold' : ''} ${!selectedGreenhouse ? 'pointer-events-none opacity-50' : ''}`}>
              Overview
            </Link>
            <Link href={{ pathname: '/dashboard/environments', query: { ...router.query, greenhouse_id: selectedGreenhouse } }} className={`block py-2 text-gray-600 hover:text-green-500 ${router.pathname === '/dashboard/environments' ? 'text-green-600 font-bold' : ''} ${!selectedGreenhouse ? 'pointer-events-none opacity-50' : ''}`}>
              Environments
            </Link>
            <Link href={{ pathname: '/dashboard/resources', query: { ...router.query, greenhouse_id: selectedGreenhouse } }} className={`block py-2 text-gray-600 hover:text-green-500 ${router.pathname === '/dashboard/resources' ? 'text-green-600 font-bold' : ''} ${!selectedGreenhouse ? 'pointer-events-none opacity-50' : ''}`}>
              Resources
            </Link>
            <Link href={{ pathname: '/dashboard/security', query: { ...router.query, greenhouse_id: selectedGreenhouse } }} className={`block py-2 text-gray-600 hover:text-green-500 ${router.pathname === '/dashboard/security' ? 'text-green-600 font-bold' : ''} ${!selectedGreenhouse ? 'pointer-events-none opacity-50' : ''}`}>
              Security
            </Link>
            <Link href={{ pathname: '/dashboard/support', query: { ...router.query, greenhouse_id: selectedGreenhouse } }} className={`block py-2 text-gray-600 hover:text-green-500 ${router.pathname === '/dashboard/support' ? 'text-green-600 font-bold' : ''} ${!selectedGreenhouse ? 'pointer-events-none opacity-50' : ''}`}>
              Support
            </Link>

            <div className="mt-8">
              <h3 className="font-semibold text-gray-700 mb-2">Greenhouses</h3>
              <div>
                <select
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={selectedGreenhouse}
                  onChange={handleGreenhouseChange}
                >
                  <option value="">Select Greenhouse</option>
                  {Array.isArray(greenhouses) && greenhouses.map((greenhouse) => (
                    <option key={greenhouse.id} value={greenhouse.id}>
                      {greenhouse.name || `Greenhouse ${greenhouse.id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </nav>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col ${isSidebarOpen ? 'ml-0' : 'ml-0'}`}>
        <header className="bg-white shadow-md p-4 flex justify-between items-center flex-shrink-0">
          <button onClick={toggleSidebar} className="text-gray-600 hover:text-gray-800 focus:outline-none">
            {isSidebarOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            )}
          </button>

          <div></div>

          <div className="relative">
            <button onClick={toggleProfileMenu} className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold focus:outline-none overflow-hidden">
              {/* Using Next.js Image component for profile picture */}
              {getProfilePictureSrc(user) !== '/images/default-avatar.png' ? ( // Only render Image if it's not the default fallback
                <Image
                  src={getProfilePictureSrc(user)}
                  alt="Profile"
                  width={32} // Required width, matches w-8
                  height={32} // Required height, matches h-8
                  className="w-full h-full object-cover" // Tailwind classes for styling
                  unoptimized={true} // Crucial for external/localhost images
                  onError={(e) => {
                    // Fallback to default avatar if image fails to load after initial URL validation
                    e.target.src = '/images/default-avatar.png'; // Make sure this path is correct
                  }}
                />
              ) : (
                // Fallback to first letter of username if no picture or an invalid one
                user && user.username ? user.username.charAt(0).toUpperCase() : 'U'
              )}
            </button>
            {isProfileMenuOpen && (
              <div ref={profileMenuRef} className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-10">
                <Link href="/dashboard/profile" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">
                  Profile
                </Link>
                <Link href="/dashboard/settings" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">
                  Settings
                </Link>
                <Link href="/dashboard/greenhouses" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">
                  Manage Greenhouses
                </Link>
                <Link href="/dashboard/change-password" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">
                  Change Password
                </Link>
                <button onClick={() => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); router.push('/login'); setIsProfileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 focus:outline-none">
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;