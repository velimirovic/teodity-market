import React from 'react'
import Home from "./pages/Home/Home";
import Shop from "./pages/Shop/Shop";
import ProductInfo from "./pages/ProductInfo/ProductInfo";
import ProductEdit from "./pages/ProductEdit/ProductEdit";
import {Routes,Route} from "react-router-dom"
import NavBar from "./components/NavBar/NavBar";
import ProductAdd from './pages/ProductAdd/ProductAdd';
import Footer from './components/Footer/Footer'; 
import SignUp from './pages/SignUp/SignUp';
import SignIn from './pages/SignIn/SignIn';
import BuyerCart from './pages/BuyerCart/BuyerCart';
import { AuthProvider } from './contexts/AuthContext';
import { NavigationProvider } from './contexts/NavigationContext';
import ForSale from './pages/ForSale/ForSale';
import ToBeMarked from './pages/ToBeMarked/ToBeMarked'; 
import TransactionHistory from './pages/TransactionHistory/TransactionHistory';
import './App.css';
import PurchaseHistory from './pages/PurchaseHistory/PurchaseHistory';
import UserProfile from './pages/UserProfile/UserProfile';
import MyReviews from './pages/MyReviews/MyReviews';
import EditProfile from './pages/EditProfile/EditProfile';
import AdminReviews from './pages/AdminReviews/AdminReviews';
import AdminReports from './pages/AdminReports/AdminReports';
import AdminUsers from './pages/AdminUsers/AdminUsers';
import AdminSuspiciousUsers from './pages/AdminSuspiciousUsers/AdminSuspiciousUsers';

const App = () => {
  return (
  <AuthProvider>
    <NavigationProvider>
    <div className="app-wrapper">
          <NavBar />
          <main className="main-content">
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sold" element={<Shop />} />
            <Route path="/products/:id" element={<ProductInfo />} />
            <Route path="/products/edit/:id" element={<ProductEdit />} />
            <Route path="/add" element={<ProductAdd />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/cart/:id" element={<BuyerCart />} />
            <Route path="/profile/:userId" element={<UserProfile />} />
            <Route path="/my-reviews" element={<MyReviews />} />  
            
            {/* BUYER RUTE */}
            <Route path="/buyer/shop" element={<Shop />} />
            <Route path="/buyer/cart/:id" element={<BuyerCart />} />
            <Route path="/buyer/history/:id" element={<PurchaseHistory />} />
            
            {/* SELLER RUTE */}
            <Route path="/seller/for-sale" element={<ForSale />} />
            <Route path="/seller/pending" element={<ToBeMarked />} />
            <Route path="/seller/history" element={<TransactionHistory />} />

            <Route path="/edit-profile/:id" element={<EditProfile />} />

            <Route path="/admin/reviews" element={<AdminReviews />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/suspicious-users" element={<AdminSuspiciousUsers />} />
            
          </Routes>
          </main>
          <Footer /> {}
      </div>
    </NavigationProvider>
  </AuthProvider>
  )
}

export default App