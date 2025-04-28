import React from "react";

import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config/firebase";

const ImgTest = () => {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Handle file selection
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!image) {
      setError("Please select an image first");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Create a reference to the file in Firebase Storage
      const storageRef = ref(storage, `test-images/${image.name}`);

      // Upload the file
      const snapshot = await uploadBytes(storageRef, image);
      console.log("Uploaded file:", snapshot);

      // Get download URL
      const url = await getDownloadURL(storageRef);
      setImageUrl(url);
      setUploadSuccess(true);
      console.log("Image URL:", url);
    } catch (error) {
      console.error("Error uploading image:", error);
      setError(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Firebase Storage Image Test</h2>

      <div className="mb-4">
        <input
          type="file"
          onChange={handleImageChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!image || uploading}
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700
                   focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload Image"}
      </button>

      {error && (
        <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {uploadSuccess && (
        <div className="mt-4 p-2 bg-green-100 border border-green-400 text-green-700 rounded">
          Upload successful!
        </div>
      )}

      {imageUrl && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Uploaded Image:</h3>
          <img
            src={imageUrl}
            alt="Uploaded from Firebase"
            className="w-full h-auto rounded-lg shadow-sm"
          />
          <p className="mt-2 text-xs text-gray-500 break-all">
            URL: {imageUrl}
          </p>
        </div>
      )}
    </div>
  );
};

export default ImgTest;
