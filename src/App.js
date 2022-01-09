import React, { useEffect } from "react";
import Market from "./pages/Market.js";
import { Router, Route, Routes } from "react-router-dom";
import Header from "./components/Header.js";
import AddService from "./pages/AddService.js"
import axios from "axios";
import Web3Modal from "web3modal";
import './App.css';

function App() {
  return (
    <div className="app">
      
        <Header/>
        <Routes>
        <Route path="/" element={<Market/>}/>
        <Route path="/Add" element={<AddService/>}/>
        </Routes>
    </div>
  );
}

export default App;
