// context/GreenhouseContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

// Create the context
const GreenhouseContext = createContext();

// Create a custom hook for easy consumption
export const useGreenhouse = () => useContext(GreenhouseContext);

// Create the provider component
export const GreenhouseProvider = ({ children }) => {
  const router = useRouter();
  const [selectedGreenhouseId, setSelectedGreenhouseId] = useState(null);
  const [userGreenhouses, setUserGreenhouses] = useState([]);
  const [loadingGreenhouses, setLoadingGreenhouses] = useState(true);
  const [greenhouseError, setGreenhouseError] = useState(null);

  // --- Fetch User Greenhouses ---
  useEffect(() => {
    const fetchGreenhouses = async () => {
      setLoadingGreenhouses(true);
      setGreenhouseError(null);
      const accessToken = localStorage.getItem('access_token');

      if (!accessToken) {
        // If not authenticated, clear greenhouses and stop loading
        setUserGreenhouses([]);
        setSelectedGreenhouseId(null);
        setLoadingGreenhouses(false);
        // Optionally, redirect to login if authentication is critical here
        // router.push('/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:8000/api/greenhouses/', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const greenhouses = response.data;
        setUserGreenhouses(greenhouses);

        // --- Persistence Logic ---
        let persistedGreenhouseId = localStorage.getItem('selectedGreenhouseId');

        // Check if the persisted ID is still valid (exists in the fetched list)
        let newSelectedId = null;
        if (persistedGreenhouseId && greenhouses.some(gh => String(gh.id) === persistedGreenhouseId)) {
          newSelectedId = persistedGreenhouseId;
        } else if (greenhouses.length > 0) {
          // If no persisted ID, or it's invalid, default to the first greenhouse
          newSelectedId = String(greenhouses[0].id);
        }

        setSelectedGreenhouseId(newSelectedId);
        if (newSelectedId) {
          localStorage.setItem('selectedGreenhouseId', newSelectedId);
        } else {
          localStorage.removeItem('selectedGreenhouseId'); // Clear if no greenhouse is selected
        }

      } catch (err) {
        console.error('Error fetching greenhouses in context:', err);
        setGreenhouseError('Failed to load greenhouses. Please refresh.');
        setUserGreenhouses([]);
        setSelectedGreenhouseId(null);
      } finally {
        setLoadingGreenhouses(false);
      }
    };

    fetchGreenhouses();
  }, [router]); // Dependency on router to potentially trigger re-fetch on route change if needed, though usually not for global context

  // --- Handle Greenhouse Change ---
  const handleGreenhouseChange = (e) => {
    const newId = e.target.value;
    setSelectedGreenhouseId(newId);
    localStorage.setItem('selectedGreenhouseId', newId); // Persist
    // You might also want to update the URL's query param here if you want it to reflect in the URL for sharing/bookmarking.
    // Example: router.replace({ query: { ...router.query, greenhouse_id: newId } }, undefined, { shallow: true });
  };

  const selectedGreenhouse = userGreenhouses.find(gh => String(gh.id) === String(selectedGreenhouseId));


  return (
    <GreenhouseContext.Provider
      value={{
        selectedGreenhouseId,
        selectedGreenhouse, // Provide the full object for convenience
        userGreenhouses,
        loadingGreenhouses,
        greenhouseError,
        handleGreenhouseChange,
      }}
    >
      {children}
    </GreenhouseContext.Provider>
  );
};