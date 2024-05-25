const axios = require('axios');
const FormData = require('form-data');
const PINATA_API_KEY = process.env.PINATA_API_KEY;
  
/*file as fs.createReadStream*/
const pinFileToIPFS = async (filename, file) => {
    const formData = new FormData();
    const src = "path/to/file.png";
    
    formData.append('file', file)
    
    const pinataMetadata = JSON.stringify({
      name: filename,
    });
    formData.append('pinataMetadata', pinataMetadata);
    
    const pinataOptions = JSON.stringify({
      cidVersion: 0,
    })
    formData.append('pinataOptions', pinataOptions);

    try{
      const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        maxBodyLength: "Infinity",
        headers: {
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
          'Authorization': `Bearer ${JWT}`
        }
      });
      console.log(res.data);
    } catch (error) {
      console.log(error);
    }
}

export default pinFileToIPFS;
