import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import styles from '../../styles/profile.module.css';
import Image from 'next/image';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Settings state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('/images/default-avatar.png');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      const accessToken = localStorage.getItem('access_token');
      try {
        const res = await fetch('http://localhost:8000/api/profile/', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch profile data`);
        }
        const data = await res.json();
        setProfileData(data);
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

    fetchProfileData();
  }, []);

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
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Profile updated successfully');
        if (data.profile_picture) {
          setProfilePicturePreview(`http://localhost:8000${data.profile_picture}`);
        }
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setError(`An unexpected error occurred: ${error.message}`);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    const accessToken = localStorage.getItem('access_token');

    try {
      const res = await fetch('http://localhost:8000/api/profile/change-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_new_password: confirmNewPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (error) {
      setError(`An unexpected error occurred: ${error.message}`);
    }
  };

  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  };

  if (loading) {
    return <div>Loading profile data...</div>;
  }

  if (error) {
    return <div>Error loading profile: {error}</div>;
  }

  return (
    <DashboardLayout>
      <div className={styles.profileContainer}>
        <header className={styles.profileHeader}>
          <div className={styles.avatarContainer}>
            <Image
              src={profilePicturePreview}
              alt="User Avatar"
              width={100}
              height={100}
              className={styles.avatar}
            />
          </div>
          <h1 className={styles.username}>@{profileData?.username}</h1>
        </header>

        <div className={styles.tabsContainer}>
          <button
            className={`${styles.tabButton} ${activeTab === 'profile' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'settings' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'security' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
        </div>

        {message && <div className={styles.successMessage}>{message}</div>}
        {error && <div className={styles.errorMessage}>{error}</div>}

        {activeTab === 'profile' && (
          <section className={styles.basicInfo}>
            <h2>Basic Information</h2>
            <div className={styles.infoItem}>
              <label>Username:</label>
              <span>{profileData?.username}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Email:</label>
              <span>{profileData?.email}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Full Name:</label>
              <span>{`${profileData?.first_name || ''} ${profileData?.last_name || ''}`}</span>
            </div>
          </section>
        )}

        {activeTab === 'settings' && (
          <form onSubmit={handleUpdateProfile} className={styles.settingsForm}>
            <h2>Edit Profile</h2>
            <div className={styles.formGroup}>
              <label htmlFor="profilePicture">Profile Picture:</label>
              <input
                type="file"
                id="profilePicture"
                accept="image/*"
                onChange={handlePictureChange}
              />
            </div>
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
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" className={styles.submitButton}>Save Changes</button>
          </form>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className={styles.securityForm}>
            <h2>Change Password</h2>
            <div className={styles.formGroup}>
              <label htmlFor="currentPassword">Current Password:</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="newPassword">New Password:</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirmNewPassword">Confirm New Password:</label>
              <input
                type="password"
                id="confirmNewPassword"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={styles.submitButton}>Change Password</button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;