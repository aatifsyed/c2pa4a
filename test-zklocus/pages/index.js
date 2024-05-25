'use client'
import Image from "next/image";
import { Inter } from "next/font/google";
import React, { useState, useEffect } from 'react';
import getGeolocation from './components/getGeolocation';



const Home = () => {
  const [coordinates, setCoordinates] = useState({
    latitude: 0,
    longitude: 0,
  });
  const [error, setError] = useState('');
  // const [proof, setProof] = useState(null);

  useEffect(() => {
    const fetchGeolocation = async () => {
      try {
        const { latitude, longitude } = await getGeolocation();
        setCoordinates({ latitude, longitude });
      } catch (error) {
        setError(error.message || 'An error occurred.');
        console.error('Error:', error);
      }
    };

    fetchGeolocation();
  }, []);

  useEffect(() => {
    const fetchProof = async () => {
      if (coordinates.latitude !== 0 && coordinates.longitude !== 0) {
        try {
          const response = await fetch('/api/genLocusProof', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(coordinates),
          });

          if (response.ok) {
            const { proof } = await response.json();
            setProof(proof);
          } else {
            const { error } = await response.json();
            setError(error || 'An error occurred while generating the proof.');
          }
        } catch (error) {
          setError(error.message || 'An error occurred while generating the proof.');
          console.error('Error:', error);
        }
      }
    };

    fetchProof();
  }, [coordinates]);


  return (
    <div>
      <h1>Geolocation App</h1>
      {error ? (
        <p>Error: {error}</p>
      ) : (
        <div>
          <p>Latitude: {coordinates.latitude}</p>
          <p>Longitude: {coordinates.longitude}</p>
          {/* {proof && <p>Locus Proof: {proof}</p>} */}
        </div>
      )}
    </div>
  );
};

export default Home;