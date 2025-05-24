// components/DashboardLayout.js

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import Image from 'next/image';
import { SelectedGreenhouseProvider } from '../context/SelectedGreenhouseContext';

function DashboardLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [greenhouses, setGreenhouses] = useState([]);
  const [selectedGreenhouseId, setSelectedGreenhouseId] = useState('');
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [initialError, setInitialError] = useState(null);

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

    const fetchAllData = async (token) => {
      setLoadingInitialData(true);
      setInitialError(null);
      try {
        // Fetch user data
        const userResponse = await axios.get('http://localhost:8000/api/users/me/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userResponse.data);

        // Fetch greenhouses
        const greenhousesResponse = await axios.get('http://localhost:8000/api/greenhouses/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedGreenhouses = greenhousesResponse.data;
        setGreenhouses(fetchedGreenhouses);

        // --- Handle Persistent and Initial Greenhouse Selection ---
        let initialSelectedId = localStorage.getItem('selectedGreenhouseId');
        let newSelectedId = '';

        if (fetchedGreenhouses.length > 0) {
          if (initialSelectedId && fetchedGreenhouses.some(gh => String(gh.id) === initialSelectedId)) {
            // Use persisted ID if it's valid and still exists in the fetched list
            newSelectedId = initialSelectedId;
          } else {
            // Otherwise, default to the first greenhouse
            newSelectedId = String(fetchedGreenhouses[0].id);
          }
        }

        setSelectedGreenhouseId(newSelectedId);
        // Persist the (potentially new) selected ID
        if (newSelectedId) {
          localStorage.setItem('selectedGreenhouseId', newSelectedId);
        } else {
          localStorage.removeItem('selectedGreenhouseId');
        }

      } catch (error) {
        console.error('DashboardLayout: Error fetching initial data:', error);
        setInitialError('Failed to load dashboard data. Please log in again.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        router.push('/login');
      } finally {
        setLoadingInitialData(false);
      }
    };

    fetchAllData(accessToken);

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
    setSelectedGreenhouseId(newGreenhouseId);
    // Persist the new selection immediately
    localStorage.setItem('selectedGreenhouseId', newGreenhouseId);

    // Update the URL only if there's a greenhouse selected.
    const currentPath = router.pathname;
    const newQuery = { ...router.query };
    if (newGreenhouseId) {
      newQuery.greenhouse_id = newGreenhouseId;
    } else {
      delete newQuery.greenhouse_id;
    }

    router.replace({
      pathname: currentPath,
      query: newQuery,
    }, undefined, { shallow: true });
  };


  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/login');
    setIsProfileMenuOpen(false);
  };

  const getProfilePictureSrc = (user) => {
    let rawPath = user?.profile_picture;
    const baseUrl = 'http://localhost:8000';

    if (!user || typeof rawPath !== 'string' || rawPath.trim() === '') {
      return '/images/default-avatar.png';
    }

    let finalUrl = rawPath.trim();

    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (!finalUrl.startsWith('/')) {
        finalUrl = '/' + finalUrl;
      }
      finalUrl = `${baseUrl}${finalUrl}`;
    }

    try {
      new URL(finalUrl);
      return finalUrl;
    } catch (e) {
      console.error('DashboardLayout: Invalid URL detected for profile picture:', finalUrl, 'Error:', e);
      return '/images/default-avatar.png';
    }
  };


  if (loadingInitialData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading dashboard data...</div>
      </div>
    );
  }

  if (initialError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {initialError}</span>
        </div>
      </div>
    );
  }

  // If no greenhouses are found, redirect to add greenhouse page or show message
  if (greenhouses.length === 0 && !loadingInitialData && router.pathname !== '/dashboard/greenhouses' && router.pathname !== '/dashboard/greenhouses/add') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">No Greenhouses Found</h2>
            <p className="text-gray-600 mb-6">You need to add at least one greenhouse to use the dashboard features.</p>
            <Link href="/dashboard/greenhouses/add" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
              Add New Greenhouse
            </Link>
          </div>
        </div>
      );
    }


  return (
    <SelectedGreenhouseProvider selectedGreenhouseId={selectedGreenhouseId}>
      <div className="min-h-screen bg-gray-100 flex">
        <aside className={`bg-gray-200 p-6 flex-shrink-0 ${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
          <div className={`${isSidebarOpen ? 'block' : 'hidden'}`}>
            <div className="mb-8">
              <div className="text-2xl font-bold text-green-500">🌱 GreenGrow</div>
            </div>

            {/* Greenhouse Selection Dropdown */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-700 mb-2">Select Greenhouse</h3>
              <div>
                <select
                  id="global-greenhouse-select"
                  className="block w-full px-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm text-gray-900"
                  value={selectedGreenhouseId}
                  onChange={handleGreenhouseChange}
                  disabled={greenhouses.length === 0}
                >
                  {greenhouses.length === 0 ? (
                    <option value="">No Greenhouses</option>
                  ) : (
                    <>
                      {greenhouses.map((greenhouse) => (
                        <option key={greenhouse.id} value={greenhouse.id}>
                          {greenhouse.name || `Greenhouse ${greenhouse.id}`}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>

            <nav>
              <h3 className="font-semibold text-gray-700 mb-2">Sections</h3>
              <Link href={{ pathname: '/dashboard', query: { greenhouse_id: selectedGreenhouseId } }} className={`block py-2 text-gray-600 hover:text-green-500 ${router.pathname === '/dashboard' ? 'text-green-600 font-bold' : ''} ${!selectedGreenhouseId ? 'pointer-events-none opacity-50' : ''}`}>
                Overview
              </Link>
              <Link href={{ pathname: '/dashboard/environments', query: { greenhouse_id: selectedGreenhouseId } }} className={`block py-2 text-gray-600 hover:text-green-500 ${router.pathname.startsWith('/dashboard/environments') ? 'text-green-600 font-bold' : ''} ${!selectedGreenhouseId ? 'pointer-events-none opacity-50' : ''}`}>
                Environments
              </Link>
              <Link href={{ pathname: '/dashboard/resources', query: { greenhouse_id: selectedGreenhouseId } }} className={`block py-2 text-gray-600 hover:text-green-500 ${router.pathname.startsWith('/dashboard/resources') ? 'text-green-600 font-bold' : ''} ${!selectedGreenhouseId ? 'pointer-events-none opacity-50' : ''}`}>
                Resources
              </Link>
              <Link href={{ pathname: '/dashboard/security', query: { greenhouse_id: selectedGreenhouseId } }} className={`block py-2 text-gray-600 hover:text-green-500 ${router.pathname.startsWith('/dashboard/security') ? 'text-green-600 font-bold' : ''} ${!selectedGreenhouseId ? 'pointer-events-none opacity-50' : ''}`}>
                Security
              </Link>
              <Link href={{ pathname: '/dashboard/support', query: { greenhouse_id: selectedGreenhouseId } }} className={`block py-2 text-gray-600 hover:text-green-500 ${router.pathname.startsWith('/dashboard/support') ? 'text-green-600 font-bold' : ''} ${!selectedGreenhouseId ? 'pointer-events-none opacity-50' : ''}`}>
                Support
              </Link>
              {/* REMOVED: Manage Greenhouses link */}
              {/* <Link href="/dashboard/greenhouses" className={`block py-2 text-gray-600 hover:text-green-500 ${router.pathname.startsWith('/dashboard/greenhouses') ? 'text-green-600 font-bold' : ''}`}>
                  Manage Greenhouses
              </Link> */}
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
                {getProfilePictureSrc(user) !== '/images/default-avatar.png' ? (
                  <Image
                    src={getProfilePictureSrc(user)}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    unoptimized={true}
                    onError={(e) => { e.target.src = '/images/default-avatar.png'; }}
                  />
                ) : (
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
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 focus:outline-none">
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
    </SelectedGreenhouseProvider>
  );
}

export default DashboardLayout;