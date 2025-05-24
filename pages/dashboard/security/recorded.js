// pages/dashboard/security/recorded.js
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

function RecordedFootagePage() {
  const router = useRouter();
  const { greenhouse_id } = router.query;

  const [cameras, setCameras] = useState([]); // NEW: State to store cameras
  const [selectedCameraId, setSelectedCameraId] = useState(null); // NEW: State for selected camera

  const [recordedFootage, setRecordedFootage] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null); // Changed to store the full recording object
  const [loadingRecorded, setLoadingRecorded] = useState(true);
  const [recordedError, setRecordedError] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [recordingName, setRecordingName] = useState(''); // NEW: State for recording name filter

  const recordedVideoRef = useRef(null);

  // NEW EFFECT: Fetch Cameras for the selected greenhouse
  useEffect(() => {
    if (!greenhouse_id) {
      setCameras([]);
      setSelectedCameraId(null);
      return;
    }

    const fetchCameras = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        // Error handling for authentication is already in parent or common layout
        return;
      }

      try {
        const response = await axios.get(`http://localhost:8000/api/greenhouses/${greenhouse_id}/cameras/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setCameras(response.data);
        if (response.data.length > 0) {
          const defaultCamera = response.data.find(cam => String(cam.id) === String(selectedCameraId)) || response.data[0];
          setSelectedCameraId(defaultCamera.id);
        } else {
          setSelectedCameraId(null);
        }
      } catch (err) {
        console.error('Error fetching cameras:', err);
        setRecordedError('Failed to load cameras for this greenhouse.');
        setCameras([]);
        setSelectedCameraId(null);
      }
    };

    fetchCameras();
  }, [greenhouse_id]);

  // MODIFIED: Fetch Recorded Footage (now depends on selectedCameraId, startDate, recordingName)
  const fetchRecordedFootage = useCallback(async () => {
    if (!greenhouse_id || !selectedCameraId) { // Ensure both are selected
      setLoadingRecorded(false);
      setRecordedError("Please select a greenhouse and a camera to view recorded footage.");
      setRecordedFootage([]);
      setSelectedRecording(null);
      return;
    }

    setLoadingRecorded(true);
    setRecordedError(null);
    setRecordedFootage([]);
    setSelectedRecording(null); // Clear selected recording when refetching

    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      router.push('/login');
      return;
    }

    try {
      let url = `http://localhost:8000/api/greenhouses/${greenhouse_id}/recorded-footage/`;
      const params = { camera_id: selectedCameraId }; // Always filter by camera

      if (startDate) {
        params.start_date = format(startDate, 'yyyy-MM-dd');
      }
      // If you want a name filter in backend, you need to add logic to views.py to filter by recordingName
      // For now, we'll just filter on the frontend if the backend doesn't support it.
      // If you add it to backend: if (recordingName) { params.name = recordingName; }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: params,
      });

      let recordings = response.data;

      // Frontend filter by name if backend doesn't support it or as an additional layer
      if (recordingName) {
        recordings = recordings.filter(rec =>
          rec.video_url && // Ensure video_url exists
          rec.video_url.toLowerCase().includes(recordingName.toLowerCase())
          // This will search in the full URL. A better way is to add a 'name' field to your VideoRecording model
          // or derive a human-readable name from start_time
        );
      }

      setRecordedFootage(recordings);
      // No automatic selection here, user will click from the list
    } catch (err) {
      console.error('Error fetching recorded footage:', err);
      setRecordedError('Failed to fetch recorded footage. Please try again later.');
    } finally {
      setLoadingRecorded(false);
    }
  }, [greenhouse_id, selectedCameraId, startDate, recordingName, router]); // Re-run effect when these change

  useEffect(() => {
    fetchRecordedFootage();
  }, [fetchRecordedFootage]);

  const handleCameraChange = (event) => {
    setSelectedCameraId(event.target.value);
  };

  // NEW: Handle clicking a recording from the list
  const handleRecordingClick = (recording) => {
    setSelectedRecording(recording);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-medium text-gray-700 mb-4">Recorded Footage</h3>

      {/* Camera Selection Dropdown */}
      <div className="mb-6">
        <label htmlFor="camera-select-rec" className="block text-sm font-medium text-gray-700 mb-2">
          Select Camera:
        </label>
        <select
          id="camera-select-rec"
          value={selectedCameraId || ''}
          onChange={handleCameraChange}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
          disabled={loadingRecorded || cameras.length === 0}
        >
          {cameras.length === 0 ? (
            <option value="">No cameras available</option>
          ) : (
            <>
              {!selectedCameraId && <option value="">-- Choose a Camera --</option>}
              {cameras.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.name}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      {/* Filters: Date Picker (startDate only) and Recording Name */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">From Date:</label>
          <DatePicker
            id="startDate"
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            placeholderText="Select start date"
          />
        </div>
        <div>
          <label htmlFor="recordingName" className="block text-sm font-medium text-gray-700">Recording Name/Keyword:</label>
          <input
            type="text"
            id="recordingName"
            value={recordingName}
            onChange={(e) => setRecordingName(e.target.value)}
            placeholder="e.g., '20230101' or 'motion'"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          />
        </div>
        <button
          onClick={fetchRecordedFootage}
          className="mt-6 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Apply Filter
        </button>
      </div>

      {loadingRecorded && (
        <div className="flex items-center justify-center h-64 border border-gray-200 rounded-md bg-gray-50">
          <p className="text-gray-600">Loading recorded footage...</p>
        </div>
      )}

      {recordedError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {recordedError}</span>
        </div>
      )}

      {!loadingRecorded && !recordedError && recordedFootage.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* List of Recordings */}
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-2">
            <h4 className="text-lg font-medium text-gray-800 mb-2">Available Recordings</h4>
            {recordedFootage.map(rec => (
              <div
                key={rec.id}
                onClick={() => handleRecordingClick(rec)}
                className={`p-3 border rounded-md cursor-pointer transition-all duration-200 ease-in-out
                  ${selectedRecording && selectedRecording.id === rec.id ? 'bg-green-100 border-green-500 shadow-md' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`
                }
              >
                <p className="font-semibold text-gray-800">
                  Recording from {format(new Date(rec.start_time), 'yyyy-MM-dd HH:mm')}
                </p>
                <p className="text-sm text-gray-600">
                  Duration: {rec.duration_seconds ? `${rec.duration_seconds} seconds` : 'Unknown'}
                </p>
                {/* Displaying a derived name or part of the URL could be useful */}
                <p className="text-xs text-gray-500 break-all">
                  File: {rec.video_url ? rec.video_url.split('/').pop() : 'N/A'}
                </p>
              </div>
            ))}
          </div>

          {/* Video Player */}
          <div>
            <h4 className="text-lg font-medium text-gray-800 mb-2">Selected Recording Playback</h4>
            {selectedRecording ? (
              <div className="relative w-full overflow-hidden" style={{ paddingTop: '56.25%' }}>
                <video
                  ref={recordedVideoRef}
                  key={selectedRecording.video_url}
                  src={selectedRecording.video_url}
                  controls
                  autoPlay
                  className="absolute top-0 left-0 w-full h-full object-cover rounded-md"
                  onError={(e) => {
                    console.error("Recorded video element error:", e);
                    setRecordedError("Failed to play recorded video. The file might be corrupted or an unsupported format.");
                    setSelectedRecording(null);
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-md">
                <p className="text-gray-500">Click on a recording from the list to play.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        !loadingRecorded && !recordedError && recordedFootage.length === 0 && (
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-md">
            <p className="text-gray-500">No recorded footage found for the selected camera and filters.</p>
          </div>
        )
      )}
    </div>
  );
}

export default RecordedFootagePage;