const getGeolocation = () => {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            resolve({ latitude, longitude, errorMessage: null });
          },
          (error) => {
            reject({errorMessage:error.message});
          }
        );
      } else {
        reject({errorMessage:'Geolocation is not supported by this browser.'});
      }
    });
  };
  
  export default getGeolocation;