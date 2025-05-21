// pages/dashboard/profile.js
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import styles from '../../styles/profile.module.css';
import Link from 'next/link'; // Keep this import at the top
import Image from 'next/image'; // Import Image for optimized images


const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      const accessToken = localStorage.getItem('access_token'); // Assuming you store it in localStorage
      try {
        const res = await fetch('http://localhost:8000/api/profile/', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(`Failed to fetch profile data: ${res.status} - ${JSON.stringify(errorData)}`);
        }
        const data = await res.json();
        setProfileData(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  if (loading) {
    return <div>Loading profile data...</div>;
  }

  if (error) {
    return <div>Error loading profile: {error}</div>;
  }

  if (!profileData) {
    return <div>No profile data available.</div>;
  }

  return (
    <DashboardLayout>
      <div className={styles.profileContainer}>
        <header className={styles.profileHeader}>
          <div className={styles.avatarContainer}>
            {profileData.profile_picture ? (
              <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '30%', overflow: 'hidden' }}>
                <Image
                  src={`http://localhost:8000${profileData.profile_picture}`}
                  alt="User Avatar"
                  layout="fill"
                  sizes="100px"
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                />
              </div>
            ) : (
              <Image
                src="/images/default-avatar.png"
                alt="User Avatar"
                width={100} // Specify width
                height={100} // Specify height
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
            )}
          </div>
          <h1 className={styles.username}>@{profileData.username}</h1>
        </header>

        <section className={styles.basicInfo}>
          <h2>Basic Information</h2>
          <div className={styles.infoItem}>
            <label>Username:</label>
            <span className={styles.fullName}>{profileData.username}</span>
          </div>
          <div className={styles.infoItem}>
            <label>Email:</label>
            <span className={styles.email}>{profileData.email}</span>
          </div>
          {profileData.first_name && profileData.last_name && (
            <div className={styles.infoItem}>
              <label>Full Name:</label>
              <span className={styles.fullName}>{`${profileData.first_name} ${profileData.last_name}`}</span>
            </div>
          )}
          {/* Add other basic info fields here if you included them in the UserSerializer */}
        </section>

        <section className={styles.greenhouseOverview}>
          <h2>Your Greenhouses</h2>
          <div className={styles.overviewStats}>
            <div className={styles.statItem}>
              <label>Total Greenhouses:</label>
              <span className={styles.totalCount}>{profileData.greenhouses.length}</span>
            </div>
          </div>

          <ul className={styles.greenhouseList}>
            {profileData.greenhouses.map((greenhouse) => (
              <li key={greenhouse.id} className={styles.greenhouseItem}>
                <h3>{greenhouse.name}</h3>
                <p>Location: {greenhouse.location}</p>
                <Link href={`/dashboard/greenhouse/${greenhouse.id}`}>View Details</Link> {/* Adjusted link path */}
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.greenhouseMap}>
          <h2>Greenhouse Locations</h2>
          <div className={styles.mapContainer} style={{ height: '300px' }}>
            {/* Map component will go here */}
            <div>Map Placeholder</div>
          </div>
        </section>

        <footer className={styles.profileActions}>
          <Link href="/dashboard/greenhouses">Manage Greenhouses</Link>
          <Link href="/dashboard/settings">Settings</Link>
          <Link href="/dashboard/change-password">Change Password</Link>
        </footer>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;