import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter as Router, Routes, Route, Form } from "react-router-dom";
import Home from "../src/components/page/Home/Home";
import "./index.css";
import WasteClassification from "./components/page/WasteClassification/WasteClassification";
import TrashCatchGame from "./components/TrashCatchGame/TrashCatchGame";
import Contact from "./components/page/Contact/Contact";
import About from "./components/page/About/About";
import MainContent from "./components/page/RecyclingGuide/MainContent";
import Login from "./components/page/Login/Login";
import Register from "./components/page/Register/Register";
import Profile from "./components/page/Profile/Profile";
import BlogList from "./components/page/Blog/BlogList";
import BlogDetail from "./components/page/Blog/BlogDetail";
import BlogCreate from "./components/page/Blog/BlogCreate";
import Admin from "./components/page/Admin/Admin";
import EcoShop from "./components/page/EcoShop/EcoShop";
import Cart from "./components/page/Cart/Cart";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Router>
      <App>
        <Routes>
          <Route index path="/" element={<Home />} />
          <Route path="/classify" element={<WasteClassification />} />
          <Route path="/guide" element={<MainContent />} />
          <Route path="/game" element={<TrashCatchGame />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route path="/blog/create" element={<BlogCreate />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/shop" element={<EcoShop />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </App>
    </Router>
  </React.StrictMode>
);
