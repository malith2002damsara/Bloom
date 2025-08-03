// src/pages/About.jsx
import React from 'react';
import Footer from '../components/Footer';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const About = () => {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

  const staggerContainer = {
    visible: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      <div className="min-h-screen pt-20 px-4">
        <div className="max-w-6xl mx-auto py-12">
         <motion.h1
                    className="text-4xl sm:text-5xl lg:text-5xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 mb-6 drop-shadow-sm"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  >
                    About BloomGrad
                  </motion.h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - About Content */}
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-8 text-lg"
            >
              <motion.div 
                variants={fadeIn}
                className="p-6 bg-white rounded-xl shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-300 text-gray-700"
              >
                <span className="text-2xl mr-2 text-purple-600">🌸</span>
                BloomGrad was founded in 2020 with a simple mission: to bring joy through flowers.
              </motion.div>
              
              <motion.div 
                variants={fadeIn}
                className="p-6 bg-white rounded-xl shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-shadow duration-300 text-gray-700"
              >
                <span className="text-2xl mr-2 text-blue-600">🌿</span>
                Our team of expert florists carefully selects each stem to ensure the highest quality
                and most beautiful arrangements for our customers.
              </motion.div>
              
              <motion.div 
                variants={fadeIn}
                className="p-6 bg-white rounded-xl shadow-lg border-l-4 border-pink-500 hover:shadow-xl transition-shadow duration-300 text-gray-700"
              >
                <span className="text-2xl mr-2 text-pink-600">💐</span>
                We believe that flowers have the power to brighten any day and strengthen connections
                between people.
              </motion.div>
            </motion.div>

            {/* Right Column - Vision & Mission */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="p-6 bg-white rounded-xl shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-300"
              >
                <h2 className="text-2xl font-bold mb-4 text-green-600 flex items-center">
                  <span className="mr-2">✨</span> Our Vision
                </h2>
                <p className="text-gray-700">
                  To become the most trusted floral brand that inspires happiness and creates 
                  unforgettable moments through nature's beauty.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="p-6 bg-white rounded-xl shadow-lg border-l-4 border-yellow-500 hover:shadow-xl transition-shadow duration-300"
              >
                <h2 className="text-2xl font-bold mb-4 text-yellow-600 flex items-center">
                  <span className="mr-2">🎯</span> Our Mission
                </h2>
                <ul className="space-y-3 text-gray-700 list-disc pl-5">
                  <li>Deliver exceptional floral arrangements with premium quality</li>
                  <li>Provide outstanding customer service with personal touch</li>
                  <li>Innovate constantly to bring fresh designs to market</li>
                  <li>Support sustainable and ethical flower sourcing</li>
                </ul>
              </motion.div>

              
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;