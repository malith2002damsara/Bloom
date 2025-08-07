import React from 'react';
// eslint-disable-next-line
import { motion } from 'framer-motion';

const features = [
  {
    title: 'Same-Day Delivery',
    description: 'Get your graduation gifts delivered on the same day for those last-minute celebrations.',
    color: 'from-pink-100 to-pink-200'
  },
  {
    title: 'University Collections',
    description: 'Bouquets and bears designed specifically for your university colors and mascots.',
    color: 'from-blue-100 to-blue-200'
  },
  {
    title: 'Bulk Orders',
    description: 'Special discounts for group orders. Perfect for graduation classes and ceremonies.',
    color: 'from-green-100 to-green-200'
  },
  {
    title: 'Gift Wrapping',
    description: 'Professional gift wrapping services to make your graduation gifts extra special.',
    color: 'from-purple-100 to-purple-200'
  }
]

const Features = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
         <motion.h2 
                 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold text-center bg-clip-text text-pink-500 mb-6 drop-shadow-sm"
                 initial={{ opacity: 0, y: -20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.5 }}
                 viewport={{ once: true }}
               >
                 Our Special Services
               </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className={`p-6 rounded-xl hover:shadow-md transition-shadow bg-gradient-to-r ${feature.color}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <h3 className="text-xl font-semibold mb-3 text-gray-800">{feature.title}</h3>
              <p className="text-gray-700">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features;