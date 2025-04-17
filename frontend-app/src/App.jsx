import React from 'react'
import { Route, Routes } from 'react-router-dom'
import './index.css'
import UserLogin from './pages/userLogin'
import UserSignup from './pages/usersignup'
import CaptainLogin from './pages/CaptainLogin'
import CaptainSignup from './pages/captainsignup'
import Start from './pages/Start';
import UserProtectWrapper from './pages/UserProtectWrapper';
import CaptainProtectWrapper from './pages/CaptainProtectWrapper';
import Home from './pages/Home';
import UserLogout from './pages/UserLogout';
import CaptainHome from './pages/CaptainHome';
import CaptainLogout from './pages/CaptainLogout';
import Riding from './pages/Riding'

const App = () => {
  return (
    <div>
      <Routes>
         <Route path='/' element={<Start />} />
         <Route path='/login' element={<UserLogin/>}/>
         <Route path='/signup' element={<UserSignup/>}/>
         <Route path='/riding' element={<Riding/>} />
         <Route path='/captain-login' element={<CaptainLogin/>}/>
         <Route path='/captain-signup' element={<CaptainSignup/>}/>
         <Route path='/home'
          element={
            <UserProtectWrapper>
              <Home />
            </UserProtectWrapper>
          } />
        <Route path='/user/logout'
          element={<UserProtectWrapper>
            <UserLogout />
          </UserProtectWrapper>
          } />
        <Route path='/captain-home' element={
          <CaptainProtectWrapper>
            <CaptainHome />
          </CaptainProtectWrapper>

        } />
        <Route path='/captain/logout' element={
          <CaptainProtectWrapper>
            <CaptainLogout/>
          </CaptainProtectWrapper>
        } />
      </Routes>
    </div>
  )
}

export default App
