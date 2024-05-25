import { useState } from 'react'
import { Box, Text, HStack } from '@chakra-ui/react'
import { Outlet } from "react-router-dom";

import './App.css'

const Header = () => {

  return (
    <Box bgColor='lightblue' padding='50px'>
      <HStack>
        <Text fontSize='2xl' as='b' spacing='20px'>C2PA4A</Text>
      </HStack>
    </Box>
  )
}

const MainPage = () => {
  return (
    <Box w='100%'>
      <Header />
      <Box padding='50px'>
        <Outlet />
      </Box>
    </Box>
  )
}

export default MainPage
