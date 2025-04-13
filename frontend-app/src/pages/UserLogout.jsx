import React from 'react'
import axios from 'axios'
const UserLogout = () => {
  
    const token = localStorage.getItem('token')
    axios.get(`${import.meta.env.VITE_BASE_URL}`,{
        headers:{
            Authorization:`Bearer ${token}`
        }
    }).then
  
    return (
    <div>
      
    </div>
  )
}

export default UserLogout
