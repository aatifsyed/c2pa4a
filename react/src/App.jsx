import { useState } from 'react'
import { Box, Text, HStack } from '@chakra-ui/react'

import './App.css'

const Header = () => {

  return (
    <Box bgColor='lightblue' padding='50px'>
      <HStack>
        <Text fontSize='2xl' as='b' spacing='20px'>C2PA4A</Text>
      </HStack>
    </Box>
  )
/*
    <Box w='700px' borderRadius='12px' overflow='hidden'>
      <Box bgColor='lightblue' padding='50px'>
        <Stack>
          <Text fontSize='4xl' as='b'>MrBeBack</Text>
        </Stack>
        <HeaderMenu isAuth={isAuth} onLogOut={handleLogOut} />
      </Box>
      <Box textAlign='left' bgColor='gray.50' padding='0px 30px' paddingBottom='20px'>
        <Outlet context={[handleLogIn]}/>
      </Box>
    </Box>
*/
}

const A = () => {
  return (
    <Text>AAAAAAAAAAA</Text>
  )
}

const MainPage = () => {
  return (
    <Box w='100%'>
      <Header />
      <Box padding='50px'>
        <A />
      </Box>
    </Box>
  )
}

const App = () => {
  const [count, setCount] = useState(0)

  return (
    <Box>
      <MainPage />
    </Box>
  )
}

export default App
