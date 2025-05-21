// pages/api/send-email.js

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { email, subject, message, name } = req.body; // <--- Receive 'name' from frontend

      // Replace with your Django backend API endpoint URL for sending email
      const djangoApiUrl = 'http://localhost:8000/api/send-email/';

      const response = await fetch(djangoApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject, message, recipient: 'elboddya@gmail.com', sender: email, name: name }), // <--- Forward 'name' to Django
      });

      const data = await response.json();

      if (response.ok) {
        res.status(response.status).json(data); // Forward the Django success response
      } else {
        console.error('Error sending email to Django backend:', data);
        res.status(response.status).json(data); // Forward the Django error response
      }

    } catch (error) {
      console.error('Error communicating with Django backend:', error);
      res.status(500).json({ error: 'Failed to send message to support.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}