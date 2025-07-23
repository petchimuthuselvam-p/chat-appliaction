import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import EntryPage from './components/EntryPage';
import SignIn from    './components/SignIn';
import Register from './components/Register';
import ChatScreen from './components/ChatScreen';
import HomeChat from './components/HomeChat';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EntryPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<ChatScreen />} />
        {/* <Route path="/guest" element={<GuestChat />} /> */}
        <Route path="/home" element={<HomeChat/>}>
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
