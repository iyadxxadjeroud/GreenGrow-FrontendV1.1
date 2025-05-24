// pages/dashboard/security.js
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { useRouter } from 'next/router';
import Link from 'next/link'; // Import Link for navigation
import axios from 'axios';

// Import the new sub-components
import LiveStreamPage from './live';
import RecordedFootagePage from './recorded';

function SecurityIndexPage() { // Renamed from SecurityPage to SecurityIndexPage
  const router = useRouter();
  const { greenhouse_id } = router.query;
  const { tab } = router.query; // Get the current tab from the query parameter

  const [userGreenhouses, setUserGreenhouses] = useState([]);
  const [loadingGreenhouses, setLoadingGreenhouses] = useState(true);
  const [greenhouseError, setGreenhouseError] = useState(null);

  // Determine which tab is active, default to 'live'
  const activeTab = tab || 'live';

  // Function to fetch user's greenhouses
  useEffect(() => {
    const fetchUserGreenhouses = async () => {
      setLoadingGreenhouses(true);
      setGreenhouseError(null);
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        setGreenhouseError('Authentication required. Please log in.');
        router.push('/login');
        return;
      }
      try {
        const response = await axios.get('http://localhost:8000/api/greenhouses/', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setUserGreenhouses(response.data);
        // If no greenhouse_id is in the URL, and there are greenhouses,
        // set the first one as the default.
        if (!greenhouse_id && response.data.length > 0) {
          router.replace({
            pathname: router.pathname,
            query: { ...router.query, greenhouse_id: response.data[0].id, tab: activeTab }
          }, undefined, { shallow: true });
        }
      } catch (err) {
        console.error('Error fetching greenhouses:', err);
        setGreenhouseError('Failed to load greenhouses. Please try again.');
      } finally {
        setLoadingGreenhouses(false);
      }
    };

    fetchUserGreenhouses();
  }, [greenhouse_id, router, activeTab]);

  const handleGreenhouseChange = (event) => {
    const newGreenhouseId = event.target.value;
    router.push({
      pathname: router.pathname,
      query: { ...router.query, greenhouse_id: newGreenhouseId, tab: activeTab }
    });
  };

  if (loadingGreenhouses) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-white rounded-lg shadow-md">
          <p>Loading greenhouses...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (greenhouseError) {
    return (
      <DashboardLayout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {greenhouseError}</span>
        </div>
      </DashboardLayout>
    );
  }

  if (userGreenhouses.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">No greenhouses found. Please add a greenhouse first.</p>
          <Link href="/dashboard/greenhouses/add" className="text-green-600 hover:underline mt-4 block">
            Add New Greenhouse
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Greenhouse Security</h2>

        {/* Greenhouse Selection Dropdown */}
        <div className="mb-6">
          <label htmlFor="greenhouse-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Greenhouse:
          </label>
          <select
            id="greenhouse-select"
            value={greenhouse_id || ''}
            onChange={handleGreenhouseChange}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
          >
            {!greenhouse_id && <option value="">-- Select a Greenhouse --</option>}
            {userGreenhouses.map((gh) => (
              <option key={gh.id} value={gh.id}>
                {gh.name}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <Link href={{ pathname: router.pathname, query: { ...router.query, tab: 'live' } }} scroll={false}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'live'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}>
                Live Stream
            </Link>
            <Link href={{ pathname: router.pathname, query: { ...router.query, tab: 'recorded' } }} scroll={false}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'recorded'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}>
                Recorded Footage
            </Link>
          </nav>
        </div>

        {/* Content Area - Render based on activeTab */}
        <div>
          {greenhouse_id ? ( // Only render child components if a greenhouse is selected
            activeTab === 'live' ? (
              <LiveStreamPage />
            ) : (
              <RecordedFootagePage />
            )
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-md">
              <p className="text-gray-500">Please select a greenhouse to view security details.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default SecurityIndexPage;