import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-pink-50 via-blue-50 to-green-50 py-8 sm:py-12 md:py-16 lg:py-24">
      <div className="container mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex flex-col lg:flex-row items-center">
          {/* Image Section - Left Side */}
          <motion.div 
            className="w-full lg:w-1/2 mb-6 sm:mb-8 lg:mb-0 lg:pr-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-gradient-to-br from-pink-200 to-blue-200 rounded-xl h-48 sm:h-64 md:h-80 lg:h-96 w-full flex items-center justify-center overflow-hidden">
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
            className="w-full lg:w-1/2 lg:pl-8 text-center lg:text-left"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-3 sm:mb-4">
              Celebrate Your <span className="text-pink-600">Achievement</span> in Bloom
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed">
              Custom bouquets and teddy bears designed specially for your university convocation. 
              Make your graduation day unforgettable!
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;