// pages/api/support/contact.js

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { email, subject, message } = req.body;

      // Replace with your Django backend API endpoint URL
      const djangoApiUrl = 'http://localhost:8000/api/send-email/';

      const response = await fetch(djangoApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject, message, recipient: 'elboddya@gmail.com', sender: email }),
      });

      const data = await response.json();

      if (response.ok) {
        res.status(response.status).json(data); // Forward the Django response
      } else {
        console.error('Error sending message to Django backend:', data);
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