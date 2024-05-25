import React from 'react'
import { Box, Text, HStack, Input } from '@chakra-ui/react'
import { Outlet } from "react-router-dom";

const Canvas = () => {
  return (
    
  );
}

const Photo = () => {

  const [video, setVideo] = React.useState(null);

  const handleChange = (e) => {
    setVideo(e.target.files[0]);
  };
  return (
    <Box>
      <Box>
        {video ? 'Video!' : 'No video selected'}
      </Box>
      <Input type='file' id='input' onChange={handleChange} />
    </Box>
  )
}

export default Photo

