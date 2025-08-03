import React, { useState } from 'react';
/* eslint-disable no-unused-vars */
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
/* eslint-enable no-unused-vars */
import { FiMenu, FiX, FiUser, FiShoppingCart, FiHome, FiInfo, FiGrid, FiMail, FiLogOut, FiPackage, FiChevronDown, FiSettings } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CartIcon from './CartIcon';
import CartSidebar from './CartSidebar';

const mainLinks = [
  {
    name: 'Home',
    path: '/',
    color: 'from-yellow-100 to-amber-200 hover:from-yellow-200 hover:to-amber-300',
    icon: <FiHome className="text-lg" />,
    mobileColor: 'bg-amber-100'
  },
  {
    name: 'Collection',
    path: '/collection',
    color: 'from-purple-100 to-violet-200 hover:from-purple-200 hover:to-violet-300',
    icon: <FiGrid className="text-lg" />,
    mobileColor: 'bg-violet-100'
  },
  {
    name: 'About',
    path: '/about',
    color: 'from-blue-100 to-sky-200 hover:from-blue-200 hover:to-sky-300',
    icon: <FiInfo className="text-lg" />,
    mobileColor: 'bg-sky-100'
  },
  {
    name: 'Contact',
    path: '/contact',
    color: 'from-pink-100 to-rose-200 hover:from-pink-200 hover:to-rose-300',
    icon: <FiMail className="text-lg" />,
    mobileColor: 'bg-rose-100'
  },
];

const FloatingFlower = ({ emoji, size }) => {
  const initialX = Math.random() * 100;
  const initialY = Math.random() * 100;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        fontSize: `${size}rem`,
        left: `${initialX}%`,
        top: `${initialY}%`,
      }}
      initial={{
        opacity: 0,
        rotate: Math.random() * 360
      }}
      animate={{
        x: [0, (Math.random() * 15 - 7.5)],
        y: [0, (Math.random() * 8 - 4)],
        rotate: [0, Math.random() * 180],
        opacity: [0.4, 0.7, 0.4]
      }}
      transition={{
        duration: 12 + Math.random() * 6,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut'
      }}
    >
      {emoji}
    </motion.div>
  );
};

const UserIcons = ({ isMobile = false }) => {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { logout, isAuthenticated } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleCartClick = () => {
    navigate('/cart');
  };

  const handleProfileClick = () => {
    if (isAuthenticated) {
      setShowProfileDropdown(!showProfileDropdown);
    } else {
      navigate('/login');
    }
  };

  const handleLogout = () => {
    logout();
    setShowProfileDropdown(false);
    navigate('/');
  };

  return (
    <div className={`flex items-center ${isMobile ? 'space-x-4' : 'space-x-3'}`}>
      {/* Profile Button with dropdown */}
      <div 
        className="relative"
        onMouseEnter={() => isAuthenticated && setShowProfileDropdown(true)}
        onMouseLeave={() => setShowProfileDropdown(false)}
      >
        <motion.button
          onClick={handleProfileClick}
          className="p-2 rounded-full bg-gradient-to-r from-blue-100 to-sky-200 text-black hover:from-blue-200 hover:to-sky-300 flex items-center space-x-1"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiUser className="h-5 w-5" />
          {/* {isAuthenticated && <FiChevronDown className="h-3 w-3" />} */}
        </motion.button>

        {/* Profile Dropdown */}
        <AnimatePresence>
          {showProfileDropdown && isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50"
            >
              {/* <div className="p-3 border-b">
                <p className="font-medium text-gray-800">{user?.name}</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div> */}
              <div className="py-1">
                <Link
                  to="/profile"
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowProfileDropdown(false)}
                >
                  <FiSettings className="mr-3 h-4 w-4" />
                  My Profile
                </Link>
                <Link
                  to="/my-orders"
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowProfileDropdown(false)}
                >
                  <FiPackage className="mr-3 h-4 w-4" />
                  My Orders
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  <FiLogOut className="mr-3 h-4 w-4" />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Cart Icon with count badge */}
      <motion.button
        onClick={handleCartClick}
        className="p-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-200 text-black hover:from-green-200 hover:to-emerald-300 relative"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FiShoppingCart className="h-5 w-5" />
        {cartCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
          >
            {cartCount > 99 ? '99+' : cartCount}
          </motion.span>
        )}
      </motion.button>
    </div>
  );
};

const Navbar = () => {
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { scrollY } = useScroll();
  const [isOpen, setIsOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > lastScrollY && latest > 100) {
      setHidden(true);
    } else if (latest < lastScrollY || latest < 100) {
      setHidden(false);
    }
    setLastScrollY(latest);
  });

  const flowers = [
    { emoji: "🌹", size: 1.5 },
    { emoji: "🌸", size: 1.2 },
    { emoji: "💐", size: 1.8 },
    { emoji: "🌺", size: 1.3 },
    { emoji: "🌹", size: 2.5 },
    { emoji: "🌸", size: 1.2 },
    { emoji: "💐", size: 1.8 },
    { emoji: "🌺", size: 2.3 },
    { emoji: "🌻", size: 2 },
    { emoji: "🌷", size: 1 },
    { emoji: "🏵️", size: 1.2 },
    { emoji: "🌼", size: 2.8 },
    { emoji: "🌻", size: 2 },
    { emoji: "🌷", size: 1.1 },
    { emoji: "🏵️", size: 1.2 },
    { emoji: "🌼", size: 0.8 },
  ];

  return (
    <>
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-500 to-pink-500 shadow-lg w-full h-16"
      initial={{ y: -100, opacity: 0 }}
      animate={{
        y: hidden ? -100 : 0,
        opacity: hidden ? 0 : 1
      }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 10
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {flowers.map((flower, index) => (
          <FloatingFlower
            key={index}
            emoji={flower.emoji}
            size={flower.size}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto px-4 sm:px-6 h-full w-full max-w-7xl">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between h-full w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center"
            >
              <motion.span
                className="text-2xl sm:text-3xl font-bold bg-white text-green-600 px-3 py-1 rounded-lg mr-1 shadow-md"
                initial={{ rotate: -5 }}
                animate={{ rotate: 0 }}
                transition={{ type: 'spring' }}
              >
                Bloom
              </motion.span>
              <motion.span
                className="text-2xl sm:text-3xl font-bold text-white"
                initial={{ rotate: 5 }}
                animate={{ rotate: 0 }}
                transition={{ type: 'spring' }}
              >
                Grad
              </motion.span>
            </motion.div>
          </Link>

          {/* Centered Navigation Links */}
          <motion.nav
            className="flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: hidden ? 0 : 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center space-x-4">
              {mainLinks.map((link, index) => (
                <Link to={link.path} key={link.name}>
                  <motion.div
                    className={`px-4 py-2 rounded-full text-gray-800 font-medium bg-gradient-to-r ${link.color} 
                              shadow-sm hover:shadow-md flex items-center space-x-2 transition-all duration-300 text-sm sm:text-base`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.1,
                      type: 'spring',
                      stiffness: 300,
                      damping: 10
                    }}
                    whileHover={{
                      y: -3,
                      scale: 1.03,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.nav>

          <div className="flex items-center">
            <UserIcons />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex items-center justify-between h-full w-11/12 md:hidden">
          <Link to="/" className="flex items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center"
            >
              <motion.span
                className="text-2xl sm:text-3xl font-bold bg-white text-green-600 px-3 py-1 rounded-lg mr-1 shadow-md"
                initial={{ rotate: -5 }}
                animate={{ rotate: 0 }}
                transition={{ type: 'spring' }}
              >
                Bloom
              </motion.span>
              <motion.span
                className="text-2xl sm:text-3xl font-bold text-white"
                initial={{ rotate: 5 }}
                animate={{ rotate: 0 }}
                transition={{ type: 'spring' }}
              >
                Grad
              </motion.span>
            </motion.div>
          </Link>

          <div className="flex items-center space-x-2">
            <UserIcons isMobile />

            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-full bg-gradient-to-r from-pink-400 to-blue-500 text-white shadow-md md:hidden"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden absolute top-16 left-0 right-0"
            >
              <div className="flex flex-col space-y-2 px-4 py-3 bg-white/90 backdrop-blur-sm rounded-b-lg shadow-lg">
                {mainLinks.map((link, index) => (
                  <Link 
                    to={link.path} 
                    key={`mobile-${link.name}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <motion.div
                      className={`px-4 py-3 rounded-lg ${link.mobileColor} text-gray-800 font-medium
                                flex items-center space-x-3 shadow-sm`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.1 + index * 0.05,
                        type: 'spring',
                        stiffness: 300
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {link.icon}
                      <span>{link.name}</span>
                    </motion.div>
                  </Link>
                ))}
                
                
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
    <CartSidebar />
    </>
  );
};

export default Navbar;