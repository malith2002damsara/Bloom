// src/pages/Contact.jsx
import Footer from '../components/Footer';
import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import {
  FaPhoneAlt,
  FaWhatsapp,
  FaPhoneSquareAlt,
  FaFacebookF
} from 'react-icons/fa';

const Contact = () => {
  const formItem = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const hotline = '0776270882';
  const whatsapp = '0781277601';
  const secondary = '0781277601';

  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${whatsapp}`, '_blank');
  };

  const handleCallClick = (number) => {
    window.open(`tel:${number}`, '_blank');
  };

  return (
    <div className="bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      <div className="min-h-screen pt-20 px-4">
        <div className="max-w-6xl mx-auto py-12">
          <motion.h1
                             className="text-4xl sm:text-5xl lg:text-5xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 mb-6 drop-shadow-sm"
                             initial={{ opacity: 0, y: -20 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ duration: 0.6, ease: 'easeOut' }}
                           >
                              Contact Us
                           </motion.h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Contact Form */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="bg-white p-8 rounded-xl shadow-xl border-t-4 border-pink-500"
            >
              <motion.form 
                variants={container}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <motion.div variants={formItem}>
                  <label htmlFor="name" className="block text-lg font-medium text-gray-700">
                    <span className="text-pink-600">✏️</span> Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="mt-2 block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all"
                  />
                </motion.div>
                
                <motion.div variants={formItem}>
                  <label htmlFor="email" className="block text-lg font-medium text-gray-700">
                    <span className="text-pink-600">✉️</span> Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="mt-2 block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all"
                  />
                </motion.div>
                
                <motion.div variants={formItem}>
                  <label htmlFor="message" className="block text-lg font-medium text-gray-700">
                    <span className="text-pink-600">💬</span> Message
                  </label>
                  <textarea
                    id="message"
                    rows="4"
                    className="mt-2 block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all"
                  ></textarea>
                </motion.div>
                
                <motion.div variants={formItem}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white py-4 rounded-xl hover:shadow-lg transition-all text-lg font-semibold shadow-md"
                  >
                    <span className="mr-2">🚀</span> Send Message
                  </motion.button>
                </motion.div>
              </motion.form>
            </motion.div>

            {/* Right Column - Contact Info */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="space-y-6"
            >
              <div className="bg-white p-8 rounded-xl shadow-xl border-t-4 border-blue-500">
                <h2 className="text-2xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                  Quick Contact
                </h2>
                
                <div className="space-y-4">
                  {/* Hotline */}
                  <div className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    <button 
                      onClick={() => handleCallClick(hotline)}
                      className="p-3 bg-blue-100 rounded-full mr-4 hover:bg-blue-200 transition-colors"
                    >
                      <FaPhoneAlt className="text-blue-600 text-xl" />
                    </button>
                    <div>
                      <p className="text-gray-600">Hotline</p>
                      <p className="text-lg font-semibold">{hotline}</p>
                    </div>
                  </div>
                  
                  {/* WhatsApp */}
                  <div className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                    <button 
                      onClick={handleWhatsAppClick}
                      className="p-3 bg-green-100 rounded-full mr-4 hover:bg-green-200 transition-colors"
                    >
                      <FaWhatsapp className="text-green-600 text-xl" />
                    </button>
                    <div>
                      <p className="text-gray-600">WhatsApp</p>
                      <p className="text-lg font-semibold">{whatsapp}</p>
                    </div>
                  </div>
                  
                  {/* Secondary */}
                  <div className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                    <button 
                      onClick={() => handleCallClick(secondary)}
                      className="p-3 bg-purple-100 rounded-full mr-4 hover:bg-purple-200 transition-colors"
                    >
                      <FaPhoneSquareAlt className="text-purple-600 text-xl" />
                    </button>
                    <div>
                      <p className="text-gray-600">Secondary</p>
                      <p className="text-lg font-semibold">{secondary}</p>
                    </div>
                  </div>
                  
                  {/* Facebook */}
                  <div className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    <a 
                      href="https://www.facebook.com/profile.php?id=100093008904723" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center"
                    >
                      <span className="p-3 bg-blue-100 rounded-full mr-4 hover:bg-blue-200 transition-colors">
                        <FaFacebookF className="text-blue-600 text-xl" />
                      </span>
                      <div>
                        <p className="text-gray-600">Facebook</p>
                        <p className="text-lg font-semibold">BloomGrad</p>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;