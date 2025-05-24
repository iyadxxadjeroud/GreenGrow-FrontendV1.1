// pages/dashboard/security/live.js
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

function LiveStreamPage() {
  const router = useRouter();
  const { greenhouse_id } = router.query;

  const [cameras, setCameras] = useState([]); // NEW: State to store cameras
  const [selectedCameraId, setSelectedCameraId] = useState(null); // NEW: State for selected camera

  const [streamUrl, setStreamUrl] = useState(null);
  const [loadingLive, setLoadingLive] = useState(true);
  const [liveError, setLiveError] = useState(null);

  const videoRef = useRef(null);

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
          // If a camera was previously selected and is still in the list, keep it.
          // Otherwise, default to the first camera.
          const defaultCamera = response.data.find(cam => String(cam.id) === String(selectedCameraId)) || response.data[0];
          setSelectedCameraId(defaultCamera.id);
        } else {
          setSelectedCameraId(null);
        }
      } catch (err) {
        console.error('Error fetching cameras:', err);
        setLiveError('Failed to load cameras for this greenhouse.');
        setCameras([]);
        setSelectedCameraId(null);
      }
    };

    fetchCameras();
  }, [greenhouse_id]); // Re-run when greenhouse_id changes

  // MODIFIED EFFECT: Fetch Live Stream URL (now depends on selectedCameraId)
  useEffect(() => {
    if (!greenhouse_id || !selectedCameraId) { // Ensure both are selected
      setLoadingLive(false);
      if (!greenhouse_id) {
        setLiveError("Please select a greenhouse.");
      } else {
        setLiveError("Please select a camera to view its live stream.");
      }
      setStreamUrl(null);
      return;
    }

    const fetchStreamUrl = async () => {
      setLoadingLive(true);
      setLiveError(null);
      setStreamUrl(null);

      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        // Error handling for authentication handled by parent layout or redirect
        return;
      }

      try {
        const response = await axios.get(`http://localhost:8000/api/greenhouses/${greenhouse_id}/live-feed/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            camera_id: selectedCameraId // Pass the selected camera ID
          }
        });
        const receivedStreamUrl = response.data.stream_url;

        if (receivedStreamUrl) {
          setStreamUrl(receivedStreamUrl);
          if (videoRef.current) {
            videoRef.current.load();
            videoRef.current.play().catch(e => console.error("Error playing live video:", e));
          }
        } else {
          setLiveError('No live stream URL provided for the selected camera.');
        }
      } catch (err) {
        console.error('Error fetching live stream URL:', err);
        setLiveError('Failed to fetch live stream. Please ensure the camera is configured.');
      } finally {
        setLoadingLive(false);
      }
    };

    fetchStreamUrl();
  }, [greenhouse_id, selectedCameraId, router]); // Re-run when selectedCameraId changes

  const handleCameraChange = (event) => {
    setSelectedCameraId(event.target.value);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-medium text-gray-700 mb-4">Live Stream</h3>

      {/* Camera Selection Dropdown */}
      <div className="mb-6">
        <label htmlFor="camera-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Camera:
        </label>
        <select
          id="camera-select"
          value={selectedCameraId || ''}
          onChange={handleCameraChange}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
          disabled={loadingLive || cameras.length === 0}
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

      {loadingLive && (
        <div className="flex items-center justify-center h-64 border border-gray-200 rounded-md bg-gray-50">
          <p className="text-gray-600">Loading live stream...</p>
        </div>
      )}

      {liveError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {liveError}</span>
        </div>
      )}

      {!loadingLive && !liveError && streamUrl ? (
        <div className="relative w-full overflow-hidden" style={{ paddingTop: '56.25%' }}>
          <video
            ref={videoRef}
            src={streamUrl}
            controls
            autoPlay
            muted
            loop
            className="absolute top-0 left-0 w-full h-full object-cover rounded-md"
            onError={(e) => {
              console.error("Live video element error:", e);
              setLiveError("Failed to play live stream. The stream might be offline or an unsupported format.");
              setStreamUrl(null);
            }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      ) : (
        !loadingLive && !liveError && (
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-md">
            <p className="text-gray-500">No live stream available for this camera or greenhouse.</p>
          </div>
        )
      )}
    </div>
  );
}

export default LiveStreamPage;