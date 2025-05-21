// pages/dashboard/settings.js
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import styles from '../../styles/settings.module.css';
import Image from 'next/image';
import Link from 'next/link'; // Import Link for navigation

const SettingsPage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('/images/default-avatar.png'); // Default image
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const accessToken = localStorage.getItem('access_token');
      try {
        const res = await fetch('http://localhost:8000/api/profile/update/', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(`Failed to fetch profile: ${res.status} - ${JSON.stringify(errorData)}`);
        }
        const data = await res.json();
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setEmail(data.email || '');
        if (data.profile_picture) {
          setProfilePicturePreview(`http://localhost:8000${data.profile_picture}`);
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file)); // Create a preview URL
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const accessToken = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('email', email);
    if (profilePicture) {
      formData.append('profile_picture', profilePicture);
    }

    try {
      const res = await fetch('http://localhost:8000/api/profile/update/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData, // Send FormData
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        // Re-fetch profile data to update the profile picture preview on this page
        const fetchProfile = async () => {
          try {
            const profileRes = await fetch('http://localhost:8000/api/profile/update/', {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            });
            if (!profileRes.ok) {
              const profileErrorData = await profileRes.json();
              throw new Error(`Failed to fetch updated profile: ${profileRes.status} - ${JSON.stringify(profileErrorData)}`);
            }
            const profileData = await profileRes.json();
            if (profileData.profile_picture) {
              setProfilePicturePreview(`http://localhost:8000${profileData.profile_picture}`);
            }
          } catch (profileErr) {
            setError(profileErr.message);
          }
        };
        fetchProfile();
        // Reset the file input
        document.getElementById('profilePicture').value = '';
        setProfilePicture(null);
      } else {
        setError(data.error || JSON.stringify(data));
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      console.error('Update profile error:', err);
    }
  };

  if (loading) {
    return <DashboardLayout><div>Loading settings...</div></DashboardLayout>;
  }

  if (error) {
    return <DashboardLayout><div>Error loading settings: {error}</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className={styles.settingsContainer}>
        <h1>Settings</h1>
        <h2>Update Profile Information</h2>
        {message && <p className={styles.success}>{message}</p>}
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleUpdateProfile} className={styles.profileForm}>
          <div className={styles.formGroup}>
            <label htmlFor="firstName">First Name:</label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="lastName">Last Name:</label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="profilePicture">Profile Picture:</label>
            <input
              type="file"
              id="profilePicture"
              accept="image/*"
              onChange={handlePictureChange}
            />
            {profilePicturePreview && (
              <div className={styles.profilePicturePreview}>
                <Image
                  src={profilePicturePreview}
                  alt="Profile Preview"
                  width={100}
                  height={100}
                  style={{ borderRadius: '50%', objectFit: 'cover' }}
                />
              </div>
            )}
          </div>
          <button type="submit" className={styles.updateButton}>Update Profile</button>
        </form>
        <p className={styles.backToProfile}>
          <Link href="/dashboard/profile">Back to Profile</Link>
        </p>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;