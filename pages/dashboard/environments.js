// pages/dashboard/environments.js
// This code includes HTTP data fetching, WebSocket real-time updates,
// and filters out Water Level and Solar Volt sensors for this page.

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

// Import the DashboardLayout component
import DashboardLayout from '../../components/DashboardLayout';

// Helper function to get the unit based on sensor type code
// Reused in both environments.js and resources.js
function getSensorUnit(sensorType) {
    switch (sensorType) {
        case 'TEMP':
            return '°C';
        case 'AIR_HUM':
            return '% RH';
        case 'CO2':
            return ' ppm'; // Added space for better readability
        case 'LIGHT':
            return ' Lux'; // Added space
        case 'SOIL_MOIST':
            return '% VWC'; // Added space
        case 'SOIL_TEMP':
            return '°C';
        case 'WATER_LVL':
            return ' L'; // Added space
        case 'SOLAR_VOLT':
            return ' V'; // Added space
        default:
            return ''; // Return empty string if unit is unknown
    }
}

// Dedicated component to render just the sensor value and unit for potentially smoother updates
// Reused in both environments.js and resources.js
// Wrapped with memo for performance optimization
// eslint-disable-next-line react/display-name -- Suppress display-name rule for memoized component
const SensorValueDisplay = React.memo(({ latestReading, sensorType, thresholds }) => { // <--- Added 'thresholds' prop
    // --- Added console logs for debugging ---
    console.log(`SensorValueDisplay: Initial Data for ${sensorType}:`, { latestReading, sensorType, thresholds });

    if (!latestReading) {
        return <span className="text-sm text-gray-500">No data yet</span>;
    }

    const value = latestReading.value;
    const unit = getSensorUnit(sensorType);

    // --- Start of new conditional styling logic ---
    let isAlert = false;
    if (thresholds) { // Only check if thresholds exist
        switch (sensorType) {
            case 'TEMP':
                isAlert = (thresholds.temperature_min !== null && value < thresholds.temperature_min) ||
                          (thresholds.temperature_max !== null && value > thresholds.temperature_max);
                break;
            case 'AIR_HUM':
                isAlert = (thresholds.humidity_min !== null && value < thresholds.humidity_min) ||
                          (thresholds.humidity_max !== null && value > thresholds.humidity_max);
                break;
            case 'CO2':
                isAlert = (thresholds.co2_max !== null && value > thresholds.co2_max);
                break;
            case 'LIGHT':
                isAlert = (thresholds.light_min !== null && value < thresholds.light_min);
                break;
            case 'SOIL_MOIST':
                isAlert = (thresholds.soil_moist_min !== null && value < thresholds.soil_moist_min);
                break;
            case 'SOIL_TEMP':
                isAlert = (thresholds.soil_temp_min !== null && value < thresholds.soil_temp_min);
                break;
            case 'WATER_LVL': // Though excluded from this page, keeping for completeness if used elsewhere
                isAlert = (thresholds.water_level_min !== null && value < thresholds.water_level_min);
                break;
            case 'SOLAR_VOLT': // Though excluded from this page, keeping for completeness if used elsewhere
                isAlert = (thresholds.solar_voltage_min !== null && value < thresholds.solar_voltage_min);
                break;
            default:
                // No specific thresholds or unknown sensor type, no alert
                isAlert = false;
        }
    }

    // --- Added console log for debugging alert status ---
    console.log(`SensorValueDisplay: Alert Check for ${sensorType}: Value=${value}, Thresholds=${JSON.stringify(thresholds)}, isAlert=${isAlert}`);


    // Apply red-600 if in alert, otherwise text-green-600 for values within range
    const valueClassName = `text-sm font-semibold ${isAlert ? 'text-red-600' : 'text-green-600'}`;
    // --- End of new conditional styling logic ---

    return (
        <span className={valueClassName}>
            {value} {unit}
        </span>
    );
});


function EnvironmentsPage() {
    const router = useRouter();
    const { greenhouse_id } = router.query; // Get greenhouse_id from the URL query


    const [greenhouse, setGreenhouse] = useState(null);
    // State will hold the sensors relevant for THIS page (excluding Water Level and Solar Volt)
    const [sensors, setSensors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Define sensor types to EXCLUDE from this page
    const EXCLUDED_SENSOR_TYPES = ['WATER_LVL', 'SOLAR_VOLT'];


    // --- Effect for Initial Data Fetch and WebSocket Setup ---
    // This effect runs on mount and when greenhouse_id or router.isReady changes.
    // It handles fetching initial data and setting up/tearing down the WebSocket.
    // Dependencies ensure the effect re-runs when the selected greenhouse changes or on initial load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        let websocket = null; // Use a local variable for the WebSocket instance within the effect


        const fetchInitialData = async (id) => { // Accept id as a parameter
            console.log('Environments Page: Starting initial data fetch.');
            if (!id) {
                setLoading(false); setGreenhouse(null); setSensors([]); setError('');
                console.log('Environments Page: No greenhouse ID, skipping initial data fetch.');
                return;
            }

            setLoading(true); setError('');
            const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
             if (!accessToken) {
                // If no token, redirect to login. Use router.push within useEffect.
                router.push('/login');
                return; // Stop execution
            }

            try {
                // Fetch greenhouse details
                const greenhouseResponse = await axios.get(`http://localhost:8000/api/greenhouses/${id}/`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                setGreenhouse(greenhouseResponse.data);
                console.log('Environments Page: Initial Greenhouse details fetched:', greenhouseResponse.data);

                // Fetch all sensors for this greenhouse using the existing API endpoint
                const sensorsResponse = await axios.get(`http://localhost:8000/api/greenhouses/${id}/sensors/`, {
                    headers: { Authorization: `Bearer ${accessToken}`, },
                });
                // Filter out excluded sensors before setting state
                const filteredSensors = sensorsResponse.data.filter(sensor =>
                    !EXCLUDED_SENSOR_TYPES.includes(sensor.type)
                );
                setSensors(filteredSensors);
                console.log('Environments Page: Initial Sensors data fetched and filtered.');

            } catch (error) {
                console.error('Environments Page: Error fetching initial data:', error);
                // Set specific error message based on response or error type
                if (error.response) {
                    if (error.response.status === 401 || error.response.status === 403) {
                        // If unauthorized/forbidden, redirect to login (token expired or invalid)
                        router.push('/login');
                        return; // Stop execution
                    }
                    if (error.response.status === 404) {
                        setError('Greenhouse or sensors not found.');
                    } else {
                        setError(`Failed to load data: Server error ${error.response.status}.`);
                    }
                } else if (error.request) {
                    // The request was made but no response was received
                    setError('Failed to load data: No response from server.');
                } else {
                    // Something else happened in setting up the request
                    setError(`Failed to load data: ${error.message}`);
                }
                setGreenhouse(null); setSensors([]); // Clear previous state on error
            } finally {
                setLoading(false); console.log('Environments Page: Initial fetch finished.');
            }
        };

        // --- WebSocket Setup ---
        const setupWebSocket = (id) => { // Accept id as a parameter
            console.log('Environments Page: Starting WebSocket setup.');
            // Only attempt WebSocket setup if we have a greenhouse ID
            if (!id) {
                console.log('Environments Page: No greenhouse ID, skipping WebSocket setup.');
                return;
            }

            // Determine WebSocket URL scheme (ws or wss)
            const wsScheme = typeof window !== 'undefined' ? (window.location.protocol === 'https:' ? 'wss' : 'ws') : 'ws';
            // Construct the WebSocket URL to match your backend routing
            // Adjust port if needed (assuming Django Channels is on port 8000)
            const wsUrl = `${wsScheme}://${typeof window !== 'undefined' ? window.location.host.split(':')[0] : 'localhost'}:8000/ws/greenhouses/${id}/data/`;

            console.log(`Environments Page: Attempting to connect WebSocket to: ${wsUrl}`);

            // Ensure WebSocket connection is attempted only in the browser environment
            if (typeof window !== 'undefined') {
                websocket = new WebSocket(wsUrl); // Create the WebSocket instance

                // WebSocket Event Handlers
                websocket.onopen = () => {
                    console.log('Environments Page: WebSocket connection opened.');
                    setError(''); // Clear any previous connection error message on successful open
                    // You could send an initial message here if needed for subscription confirmation
                    // e.g., websocket.send(JSON.stringify({ 'command': 'subscribe', 'greenhouse_id': id }));
                };

                websocket.onmessage = (event) => {
                    console.log('Environments Page: WebSocket message received:', event.data);
                    try {
                        // Parse the incoming message data (expected to be JSON)
                        const data = JSON.parse(event.data);
                        console.log('Environments Page: Parsed WebSocket data:', data); // Use console.log

                        // Check if the received data has the expected structure for a sensor update
                        // and if the sensor type is one we care about for THIS page.
                        if (data && data.sensor_id !== undefined && data.latest_reading && data.sensor_type) {
                            const updatedSensorId = data.sensor_id;
                            const newLatestReading = data.latest_reading;
                            const updatedSensorType = data.sensor_type; // Get sensor type from WS message

                            // Only process updates for sensor types NOT EXCLUDED from this page
                            const isRelevant = !EXCLUDED_SENSOR_TYPES.includes(updatedSensorType);

                            if (isRelevant) {
                                console.log(`Environments Page: WebSocket update for sensor ID ${updatedSensorId} (Type: ${updatedSensorType}) is RELEVANT.`);
                                // Update the state for the specific sensor that changed
                                setSensors(currentSensors => {
                                    // Create a new array by mapping over the current sensors
                                    const updatedSensors = currentSensors.map(sensor => {
                                        // If this sensor matches the one from the message
                                        if (sensor.id === updatedSensorId) {
                                            console.log(`Updating state for sensor ID ${updatedSensorId} with received reading.`);
                                            // Create a NEW object for this sensor with the updated latest_reading
                                            return {
                                                ...sensor, // Copy existing properties
                                                latest_reading: newLatestReading // Update latest_reading
                                            };
                                        }
                                        // Return other sensors unchanged
                                        return sensor;
                                    });
                                    // Return the new updatedSensors array to set state
                                    // This will trigger a re-render if any sensor's object reference changed
                                    return updatedSensors;
                                });

                            } else {
                                console.log(`Environments Page: WebSocket update for sensor ID ${updatedSensorId} (Type: ${updatedSensorType}) is NOT RELEVANT for this page.`);
                            }


                        } else {
                            console.warn("Environments Page: WebSocket: Received message with unexpected data structure or missing data:", data);
                        }

                    } catch (e) {
                        console.error('Environments Page: Error parsing message data:', e);
                        setError('Error processing real-time data.');
                    }
                };

                websocket.onerror = (error) => {
                    console.error('Environments Page: WebSocket error:', error);
                    // Set an error state for UI display, but don't immediately stop trying to reconnect
                    setError('WebSocket connection error. Attempting to reconnect...');
                    // The 'onclose' handler will typically be called after an error, potentially triggering reconnection logic
                };

                websocket.onclose = (event) => {
                    console.log('Environments Page: WebSocket connection closed:', event);
                    setError(`WebSocket connection closed (Code: ${event.code}). Attempting to reconnect...`); // Display closure status/error on UI

                    // Attempt to reconnect after a delay if the closure was not clean (e.g., server restart, network issue)
                    // Clean closures (code 1000) usually happen on purpose (e.g., component unmount or manual close)
                    // Only attempt reconnect if the closure was not clean AND we still have a valid greenhouse ID
                    if (!event.wasClean && id) { // Use the local 'id' from the effect scope
                        console.log('Environments Page: WebSocket died unexpectedly, attempting to reconnect...');
                        // Implement a reconnection strategy (e.g., exponential backoff is better than fixed delay)
                        setTimeout(() => setupWebSocket(id), 1000); // Pass id back to setup function
                    } else if (event.wasClean) {
                        console.log('Environments Page: WebSocket closed cleanly, not attempting to reconnect.');
                        setError('WebSocket connection closed.'); // Clear error or show clean closed status
                    } else if (!id) { // Use the local 'id' from the effect scope
                        console.log('Environments Page: WebSocket died, but no greenhouse ID available. Not attempting reconnect.');
                    }
                };
            } // End if (typeof window !== 'undefined')

        }; // End setupWebSocket function

        // --- Effect Logic: Run on Mount and dependencies change ---
        // This section calls the fetch and setup functions.
        // Depend on the 'greenhouse_id' from the router query and router.isReady.
        // This ensures the effect re-runs to fetch data and set up WS
        // when the selected greenhouse changes or on initial load.
        if (router.isReady && greenhouse_id) { // Start fetch/WS only if router is ready AND greenhouse_id is available
            console.log('Environments Page: Router ready and greenhouse ID available. Starting initial data fetch and WebSocket setup.');
            fetchInitialData(greenhouse_id); // Pass greenhouse_id
            setupWebSocket(greenhouse_id); // Pass greenhouse_id
        } else if (router.isReady && !greenhouse_id) {
            console.log('Environments Page: Router ready, but no greenhouse ID.');
            setLoading(false); // Not loading if no ID
            setError('No Greenhouse selected. Please select a greenhouse from the dashboard.');
        }


        // --- Cleanup Function: Runs on Unmount or Dependencies Change ---
        // This is crucial to close the WebSocket connection properly when the component unmounts
        // or when the effect re-runs due to dependencies changing (e.g., selected greenhouse changes).
        return () => {
            console.log('Environments Page: Cleanup function running. Closing WebSocket if open.');
            // Check if the WebSocket instance exists and is currently open before attempting to close.
            if (websocket && websocket.readyState === WebSocket.OPEN) {
                console.log('Environments Page: Closing active WebSocket connection.');
                websocket.close(); // Close the connection cleanly
            } else if (websocket) {
                // Log if WebSocket exists but is not open (e.g., already closed, closing, or connecting)
                console.log(`Environments Page: WebSocket exists but not open (State: ${websocket.readyState}). No close needed.`);
            } else {
                // Log if the WebSocket instance was never created in this effect run
                console.log('Environments Page: No WebSocket instance to close.');
            }
            // If you implemented reconnection timeouts, you would need to clear them here too.
        };

    }, [greenhouse_id, router.isReady]); // <-- DEPENDENCIES: Depend on 'greenhouse_id' and router readiness


    return (
        <DashboardLayout>
            <div>
                {/* Display selected greenhouse name if available. Fallback to a generic message. */}
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Environment Overview for {greenhouse ? greenhouse.name : 'Selected Greenhouse'}
                </h2>

                {/* Conditional rendering based on loading, error, or availability of greenhouse_id */}
                {loading ? (
                    <p className="text-gray-600">Loading environment data...</p>
                ) : error ? (
                    <p className="text-red-500">Error: {error}</p>
                ) : !greenhouse_id ? ( // Check if greenhouse_id is available to show the "No Greenhouse selected" message
                    // Render message if no greenhouse is selected
                    <p className="text-gray-600">No Greenhouse selected. Please select a greenhouse from the dashboard.</p>
                ) : ( // This 'else' block renders when the page is not loading, has no error, and greenhouse_id is available
                    <div className="bg-white shadow rounded-md p-6 mb-6">
                        {/* Title for the displayed sensors */}
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Sensors (Excluding Water Level and Solar Volt)</h3> {/* Updated title */}
                        {/* Conditional rendering based on whether the filtered sensors array is not empty */}
                        {Array.isArray(sensors) && sensors.length > 0 ? (
                            <ul>
                                {/* Map over the 'sensors' state array, which contains only the filtered environment sensors */}
                                {sensors.map(sensor => (
                                    <li key={sensor.id} className="mb-4 p-4 border rounded-md bg-gray-50">
                                        <div className="flex justify-between items-center mb-2">
                                            {/* Display sensor name or type */}
                                            <strong className="text-gray-800">{sensor.name || sensor.type}:</strong>
                                            {/* Use the dedicated component for value display */}
                                            <SensorValueDisplay
                                                latestReading={sensor.latest_reading}
                                                sensorType={sensor.type}
                                                thresholds={greenhouse?.threshold} // <--- Pass the thresholds here
                                            />
                                        </div>
                                        {/* Display sensor description */}
                                        <p className="text-sm text-gray-600">{sensor.description || 'No description'}</p>
                                        {sensor.latest_reading && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Last updated: {new Date(sensor.latest_reading.timestamp).toLocaleString()}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            // Message to display if no environment sensors are found after filtering
                            <p className="text-gray-600">No environment sensors found for this greenhouse (excluding Water Level and Solar Volt).</p>
                        )}
                    </div>
                )}

                {/* You can add other content for the Environments page here if needed */}
            </div>
        </DashboardLayout>
    );
}

export default EnvironmentsPage;