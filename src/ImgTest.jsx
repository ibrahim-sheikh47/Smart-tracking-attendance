import React, { useState } from 'react';
import {  storage } from './config/firebase';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

const UploadFile = () => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [downloadURL, setDownloadURL] = useState('');

  const handleUpload = () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    const path = `test-uploads/${file.name}`;
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progressValue = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(progressValue.toFixed(2));
        console.log(`Upload is ${progressValue}% done`);
      },
      (error) => {
        console.error('Upload failed:', error.code, error);
        switch (error.code) {
          case 'storage/unauthorized':
            alert('You don’t have permission to upload.');
            break;
          case 'storage/canceled':
            alert('Upload was canceled.');
            break;
          case 'storage/unknown':
            alert('An unknown error occurred.');
            break;
          default:
            alert('Error: ' + error.message);
        }
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          setDownloadURL(url);
          console.log('File available at:', url);
        });
      }
    );
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Firebase File Upload Test</h2>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <br /><br />
      <button onClick={handleUpload}>Upload</button>
      <br /><br />
      <progress value={progress} max="100" style={{ width: '100%' }}></progress>
      {progress > 0 && <p>{progress}% uploaded</p>}
      {downloadURL && (
        <div>
          <p>File uploaded successfully:</p>
          <a href={downloadURL} target="_blank" rel="noopener noreferrer">{downloadURL}</a>
        </div>
      )}
    </div>
  );
};

export default UploadFile;
