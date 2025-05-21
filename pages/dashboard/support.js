// pages/dashboard/support.js

import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import ContactForm from '../../components/ContactForm'; // Import the new component

function SupportPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Support</h2>

        {/* FAQ Section (Keep this) */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Frequently Asked Questions (FAQs)</h3>
          {/* ... Your FAQ items ... */}
        </div>

        {/* Contact Information Section (Update this to include the form) */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Contact Support</h3>
          <div className="text-gray-600 space-y-2 mb-4">
            <p>If you need further assistance, please fill out the form below, and we°ll get back to you as soon as possible.</p>
            {/* You can keep the direct contact info as well if you like */}
            <p>Email: <a href="mailto:ayad.adjeroud@student.umc.edu.dz" className="text-blue-600 hover:underline">support@yourgreengrowapp.com</a></p>
            <p>Phone: +213 540-991-022 (Available Saturday-Thursday, 9 AM - 5 PM Local Time)</p>
          </div>

          {/* Render the Contact Form component here */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-800 mb-2">Send us a message directly:</h4>
            <ContactForm />
          </div>
        </div>

        {/* Other Useful Resources Section (Keep this) */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Other Useful Resources</h3>
          {/* ... Your resource links ... */}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default SupportPage;