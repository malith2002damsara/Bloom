import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="bg-gradient-to-br from-pink-50 via-blue-50 to-green-50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          {/* Image Section - Left Side */}
          <motion.div 
            className="md:w-1/2 mb-8 md:mb-0 md:pr-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-gradient-to-br from-pink-200 to-blue-200 rounded-xl h-64 md:h-96 w-full flex items-center justify-center overflow-hidden">
              <motion.img 
                src="/grad-hero.png" 
                alt="Graduation Bouquet"
                className="h-full w-full object-cover"
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse' }}
              />
            </div>
          </motion.div>
          
          {/* Content Section - Right Side */}
          <motion.div 
            className="md:w-1/2 md:pl-8"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Celebrate Your <span className="text-pink-600">Achievement</span> in Bloom
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Custom bouquets and teddy bears designed specially for your university convocation. 
              Make your graduation day unforgettable!
            </p>
            {/* <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <motion.button 
                className="bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Customize Your Bouquet
              </motion.button> */}
              {/* <motion.button 
                className="border-2 border-green-500 text-green-600 hover:bg-green-50 px-6 py-3 rounded-lg font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
               onClick={() => navigate('/collection')} // Add this onClick handler
          >
            Shop Collections
              </motion.button>
            </div> */}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;