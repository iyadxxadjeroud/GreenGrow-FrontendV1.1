// pages/change-password.js
import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import styles from '../../styles/changePassword.module.css';
import Link from 'next/link'; // Import Link for navigation


const ChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
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
          confirm_new_password: confirmNewPassword, // Include this field
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setError(data.error || JSON.stringify(data));
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      console.error('Change password error:', err);
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.changePasswordContainer}>
        <h1>Change Password</h1>
        {message && <p className={styles.success}>{message}</p>}
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleChangePassword} className={styles.changePasswordForm}>
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
          <button type="submit" className={styles.changePasswordButton}>Change Password</button>
        </form>
        <p className={styles.backToProfile}>
          <Link href="/dashboard/profile">Back to Profile</Link>
        </p>
      </div>
    </DashboardLayout>
  );
};

export default ChangePasswordPage;