import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import { doc, setDoc, collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { firestoreDb } from './config/firebase';

const ImgTest = () => {
  // User form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    employeeId: ''
  });

  // QR Code state
  const [qrValue, setQrValue] = useState('');
  const [userId, setUserId] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Users list state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState('add');

  // Ref for the QR code component
  const qrCodeRef = useRef(null);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Generate a unique user ID
  const generateUserId = () => {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  };

  // Convert SVG to image data URL
  const convertSvgToImage = () => {
    if (!qrCodeRef.current) return null;

    // Get the SVG element
    const svgElement = qrCodeRef.current.querySelector('svg');
    if (!svgElement) return null;

    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set dimensions
    const svgRect = svgElement.getBoundingClientRect();
    canvas.width = svgRect.width;
    canvas.height = svgRect.height;

    // Create an image from the SVG
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();

    return new Promise((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        // Get the data URL
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    });
  };

  // Save user data to Firestore
  const saveUserToFirestore = async (userObj, qrImageUrl) => {
    try {
      await setDoc(doc(firestoreDb, "users", userObj.userId), {
        ...userObj,
        qrCodeUrl: qrImageUrl,
        createdAt: Timestamp.now()
      });

      console.log("User created successfully:", userObj.userId);
      return true;
    } catch (error) {
      console.error("Error creating user:", error);
      return false;
    }
  };

  // Fetch users from Firestore
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersCollection = collection(firestoreDb, 'users');
      const q = query(usersCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setUsers(usersData);
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      // Generate a unique user ID
      const newUserId = generateUserId();
      setUserId(newUserId);

      // Create QR data with user info
      const qrData = JSON.stringify({
        userId: newUserId,
        name: formData.name,
        employeeId: formData.employeeId,
        timestamp: Date.now(),
        type: 'user'
      });

      // Set QR value and show QR code
      setQrValue(qrData);
      setShowQR(true);

      // Wait for QR code to render
      setTimeout(async () => {
        // Convert QR code to image
        const qrImageUrl = await convertSvgToImage();

        if (qrImageUrl) {
          // Create user object
          const userObj = {
            userId: newUserId,
            ...formData,
          };

          // Save to Firestore
          const success = await saveUserToFirestore(userObj, qrImageUrl);

          if (success) {
            setSuccessMessage(`User ${formData.name} created successfully with QR code!`);
            // Fetch updated users list
            fetchUsers();
            // Reset form
            setFormData({
              name: '',
              email: '',
              phone: '',
              department: '',
              employeeId: ''
            });
          }
        }

        setIsSubmitting(false);
      }, 500); // Small delay to ensure QR code is rendered

    } catch (error) {
      console.error("Error in form submission:", error);
      setIsSubmitting(false);
    }
  };

  // Download QR code as image
  const downloadQRCode = async (existingQrUrl = null, userName = '', userIdValue = userId) => {
    let qrImageUrl = existingQrUrl;

    if (!existingQrUrl) {
      qrImageUrl = await convertSvgToImage();
    }

    if (qrImageUrl) {
      const link = document.createElement('a');
      link.href = qrImageUrl;
      link.download = `qrcode_${userName || formData.name || 'user'}_${userIdValue}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">User QR Code System</h1>

      {/* Tab navigation */}
      <div className="flex mb-6 border-b">
        <button
          className={`px-4 py-2 ${activeTab === 'add' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('add')}
        >
          Add New User
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'view' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('view')}
        >
          User Database
        </button>
      </div>

      {/* Add User Form */}
      {activeTab === 'add' && (
        <div>
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Employee ID</label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating User...' : 'Create User with QR Code'}
            </button>
          </form>

          {showQR && qrValue && (
            <div className="mt-6 p-4 border rounded">
              <h2 className="text-xl font-bold mb-4">User QR Code</h2>

              <div className="flex flex-col items-center" ref={qrCodeRef}>
                <QRCode value={qrValue} size={200} />

                <div className="mt-4">
                  <p className="mb-2">User ID: {userId}</p>
                  <p className="mb-4">Name: {formData.name}</p>

                  <button
                    onClick={() => downloadQRCode()}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Download QR Code
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Users Table */}
      {activeTab === 'view' && (
        <div>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <p>Total Users: {users.length}</p>
            <button
              onClick={fetchUsers}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center p-4">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border">Name</th>
                    <th className="px-4 py-2 border">Employee ID</th>
                    <th className="px-4 py-2 border">Department</th>
                    <th className="px-4 py-2 border">Email</th>
                    <th className="px-4 py-2 border">QR Code</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border">{user.name}</td>
                      <td className="px-4 py-2 border">{user.employeeId}</td>
                      <td className="px-4 py-2 border">{user.department}</td>
                      <td className="px-4 py-2 border">{user.email}</td>
                      <td className="px-4 py-2 border text-center">
                        {user.qrCodeUrl ? (
                          <div className="flex flex-col items-center">
                            <img
                              src={user.qrCodeUrl}
                              alt={`QR Code for ${user.name}`}
                              className="w-16 h-16"
                            />
                            <button
                              onClick={() => downloadQRCode(user.qrCodeUrl, user.name, user.userId)}
                              className="text-blue-500 text-sm mt-1 hover:underline"
                            >
                              Download
                            </button>
                          </div>
                        ) : (
                          <span className="text-red-500">No QR Code</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center">
                        No users found. Add some users to see them here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImgTest;