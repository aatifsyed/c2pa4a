import React from 'react'
import { Box, Text, HStack, Input, Button } from '@chakra-ui/react'
import { Outlet } from "react-router-dom";
import pinFileToIPFS from './IPFS';

const Video = ({ dataURL }) => {
  return (
    <video src={dataURL}></video>
  )
}

const Photo = () => {

  const [video, setVideo] = React.useState(null);
  const [videoFile, setVideoFile] = React.useState(null);

  const handleChange = (e) => {
    let reader = new FileReader();
    reader.onload = (e) => {
      setVideo(e.target.result);
    };
    setVideoFile(e.target.files[0]);
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleClick = (e) => {
    pinFileToIPFS('Test', videoFile);
  }
  return (
    <Box>
      <Box>
        {video ? <Video dataURL={video}/> : 'No video selected'}
      </Box>
      <Input type='file' id='input' onChange={handleChange} />
      <Button onClick={handleClick}>Sign and Pin Video</Button>
    </Box>
  )
}

export default Photo

