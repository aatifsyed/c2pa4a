import axios from 'axios';
import FormData from 'form-data';
import PINATA_API_KEY from "./env";
  
/**
 * filename is a string, file must be a File, Blob, or readableStream, see:
 * https://docs.pinata.cloud/pinning/pinning-files#using-the-api
 */
const pinFileToIPFS = async (filename, file) => {
    const formData = new FormData();
    
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
          'Authorization': `Bearer ${PINATA_API_KEY}`
        }
      });
      return res.data.IpfsHash;
    } catch (error) {
      console.log(error);
    }
}

export default pinFileToIPFS;
