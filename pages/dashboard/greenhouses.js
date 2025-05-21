// pages/greenhouses.js
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout'; // Adjust path if needed
import Link from 'next/link';
import styles from '../../styles/manageGreenhouses.module.css'; // Import the CSS module

const ManageGreenhousesPage = () => {
  const [greenhouses, setGreenhouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingGreenhouseId, setEditingGreenhouseId] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedLocation, setEditedLocation] = useState('');
  const [selectedGreenhouseThresholds, setSelectedGreenhouseThresholds] = useState(null);
  const [loadingThresholds, setLoadingThresholds] = useState(false);
  const [errorThresholds, setErrorThresholds] = useState(null);
  const [viewingThresholdsId, setViewingThresholdsId] = useState(null);

  // --- Fetch Greenhouses ---
  useEffect(() => {
    const fetchGreenhouses = async () => {
      const accessToken = localStorage.getItem('access_token');
      try {
        const res = await fetch('http://localhost:8000/api/greenhouses/', { // Adjust URL if needed
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            `Failed to fetch greenhouses: ${res.status} - ${JSON.stringify(
              errorData
            )}`
          );
        }
        const data = await res.json();
        setGreenhouses(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchGreenhouses();
  }, []);

  // --- Edit Greenhouse Handlers ---
  const startEditing = (id, name, location) => {
    setEditingGreenhouseId(id);
    setEditedName(name);
    setEditedLocation(location);
  };

  const cancelEditing = () => {
    setEditingGreenhouseId(null);
    setEditedName('');
    setEditedLocation('');
  };

  const saveChanges = async (id) => {
    const accessToken = localStorage.getItem('access_token');
    try {
      const res = await fetch(`http://localhost:8000/api/greenhouses/${id}/`, { // Corrected URL
        method: 'PUT', // Use PUT for full updates, PATCH for partial
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json', // Important for sending JSON data
        },
        body: JSON.stringify({ name: editedName, location: editedLocation }), // Send the updated data
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          `Failed to update greenhouse: ${res.status} - ${JSON.stringify(
            errorData
          )}`
        );
      }

      // Update the local state
      setGreenhouses(greenhouses.map(greenhouse =>
        greenhouse.id === id ? { ...greenhouse, name: editedName, location: editedLocation } : greenhouse
      ));
      setEditingGreenhouseId(null); // Exit edit mode
      setEditedName('');
      setEditedLocation('');

    } catch (error) {
      setError(error.message);
    }
  };

  // --- Threshold Management Handlers ---
  const fetchThresholds = async (greenhouseId) => {
    setLoadingThresholds(true);
    setErrorThresholds(null);
    setSelectedGreenhouseThresholds(null);
    setViewingThresholdsId(greenhouseId);

    const accessToken = localStorage.getItem('access_token');
    try {
      const res = await fetch(`http://localhost:8000/api/greenhouses/${greenhouseId}/thresholds/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          `Failed to fetch thresholds: ${res.status} - ${JSON.stringify(errorData)}`
        );
      }
      const data = await res.json();
      // Transform the flat API response into the nested structure expected by the UI
      const transformedThresholds = {
        TEMP: { min: data.temperature_min, max: data.temperature_max },
        AIR_HUM: { min: data.humidity_min, max: data.humidity_max },
        CO2: { max: data.co2_max },
        LIGHT: { min: data.light_min },
        SOIL_MOIST: { min: data.soil_moist_min },
        SOIL_TEMP: { min: data.soil_temp_min },
        WATER_LVL: { min: data.water_level_min },
        SOLAR_VOLT: { min: data.solar_voltage_min },
      };
      setSelectedGreenhouseThresholds(transformedThresholds); // Use the transformed data
      setLoadingThresholds(false);
    } catch (err) {
      setErrorThresholds(err.message);
      setLoadingThresholds(false);
    }
  };

  const handleThresholdChange = (thresholdType, field, value) => {
    setSelectedGreenhouseThresholds(prevThresholds => ({
      ...prevThresholds,
      [thresholdType]: {
        ...prevThresholds[thresholdType],
        [field]: value,
      },
    }));
  };

  const saveThresholds = async (greenhouseId) => {
    const accessToken = localStorage.getItem('access_token');
    try {
      // Transform nested state back to flat structure for the API
      const payload = {
        temperature_min: selectedGreenhouseThresholds.TEMP?.min,
        temperature_max: selectedGreenhouseThresholds.TEMP?.max,
        humidity_min: selectedGreenhouseThresholds.AIR_HUM?.min,
        humidity_max: selectedGreenhouseThresholds.AIR_HUM?.max,
        co2_max: selectedGreenhouseThresholds.CO2?.max,
        light_min: selectedGreenhouseThresholds.LIGHT?.min,
        soil_moist_min: selectedGreenhouseThresholds.SOIL_MOIST?.min,
        soil_temp_min: selectedGreenhouseThresholds.SOIL_TEMP?.min,
        water_level_min: selectedGreenhouseThresholds.WATER_LVL?.min,
        solar_voltage_min: selectedGreenhouseThresholds.SOLAR_VOLT?.min,
      };

      const res = await fetch(`http://localhost:8000/api/greenhouses/${greenhouseId}/thresholds/`, {
        method: 'PUT', // Or PATCH depending on your API
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload), // Send the transformed payload
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          `Failed to update greenhouse thresholds: ${res.status} - ${JSON.stringify(
            errorData
          )}`
        );
      }
      setViewingThresholdsId(null); // Close the threshold view on success
      setSelectedGreenhouseThresholds(null);
      // Optionally, refresh the greenhouse list if needed
    } catch (error) {
      setErrorThresholds(error.message);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div>Loading greenhouses...</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div>Error loading greenhouses: {error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.greenhousesContainer}>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Manage Your Greenhouses
        </h2>

        <ul className={styles.greenhouseList}>
          {greenhouses.map((greenhouse) => (
            <li key={greenhouse.id} className={styles.greenhouseItem}>
              {editingGreenhouseId === greenhouse.id ? (
                <>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                  />
                  <input
                    type="text"
                    value={editedLocation}
                    onChange={(e) => setEditedLocation(e.target.value)}
                  />
                  <button onClick={() => saveChanges(greenhouse.id)}>Save</button>
                  <button onClick={cancelEditing}>Cancel</button>
                </>
              ) : (
                <>
                  <h3>{greenhouse.name}</h3>
                  <p>Location: {greenhouse.location}</p>
                  <Link href={`/dashboard/greenhouse/${greenhouse.id}`}>
                    View Details
                  </Link>
                  <button
                    onClick={() =>
                      startEditing(
                        greenhouse.id,
                        greenhouse.name,
                        greenhouse.location
                      )
                    }
                  >
                    Edit
                  </button>
                  <button onClick={() => fetchThresholds(greenhouse.id)}>View Thresholds</button>
                </>
              )}

              {viewingThresholdsId === greenhouse.id && (
                <div className={styles.thresholdsSection}>
                  <h4>Thresholds</h4>
                  {loadingThresholds && <div>Loading thresholds...</div>}
                  {errorThresholds && <div>Error loading thresholds: {errorThresholds}</div>}
                  {selectedGreenhouseThresholds && Object.keys(selectedGreenhouseThresholds).length > 0 ? (
                    Object.entries(selectedGreenhouseThresholds).map(
                      ([thresholdType, values]) => (
                        <div
                          key={thresholdType}
                          className={styles.thresholdGroup}
                        >
                          <h5>{thresholdType}</h5>
                          {/* Ensure 'values' is an object before iterating */}
                          {values && Object.entries(values).map(([field, value]) => (
                            <div
                              key={field}
                              className={styles.thresholdInputGroup}
                            >
                              <label>{field}:</label>
                              <input
                                type="number"
                                value={value ?? ''} // Use nullish coalescing to display empty string for null/undefined
                                onChange={(e) =>
                                  handleThresholdChange(
                                    thresholdType,
                                    field,
                                    parseFloat(e.target.value) || null // Convert to number, or null if invalid
                                  )
                                }
                              />
                            </div>
                          ))}
                        </div>
                      )
                    )
                  ) : (
                    <p>No thresholds set for this greenhouse.</p>
                  )}
                  <button onClick={() => saveThresholds(greenhouse.id)}>
                    Save Thresholds
                  </button>
                  <button onClick={() => setViewingThresholdsId(null)}>Close Thresholds</button>
                </div>
              )}
            </li>
          ))}
        </ul>
        <div className={styles.backToProfile}>
          <Link href="/dashboard/profile">Back to Profile</Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageGreenhousesPage;