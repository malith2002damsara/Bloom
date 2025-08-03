import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const testimonials = [
  {
    quote: "The customized bouquet was perfect for my graduation! Everyone asked where I got such a beautiful arrangement.",
    author: "Emma Thompson",
    university: "Oxford University Graduate",
    color: "bg-pink-100"
  },
  {
    quote: "I ordered matching bears for our entire friend group. The quality was amazing and they arrived right on time.",
    author: "Michael Chen",
    university: "Stanford University Graduate",
    color: "bg-blue-100"
  },
  {
    quote: "The artificial bouquet I ordered still looks fresh a year after my graduation. Such great quality and memories.",
    author: "Sarah Johnson",
    university: "Cambridge University Graduate",
    color: "bg-green-100"
  },
  {
    quote: "The service was exceptional and the flowers lasted for weeks. Highly recommend!",
    author: "David Wilson",
    university: "Harvard University Graduate",
    color: "bg-purple-100"
  }
];

const Testimonials = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
       <motion.h2 
               className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 mb-10 tracking-tight drop-shadow-sm"
               initial={{ opacity: 0, y: -20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5 }}
               viewport={{ once: true }}
             >
              What Our Customers Say
             </motion.h2>
        
        {/* 2 columns on mobile, 3 on tablet, 4 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div 
              key={index}
              className={`p-4 sm:p-6 rounded-xl shadow-md ${testimonial.color}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, margin: "0px 0px -50px 0px" }}
              whileHover={{ y: -5 }}
            >
              <motion.div 
                className="text-3xl sm:text-4xl mb-3 sm:mb-4"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                {testimonial.color.includes('pink') ? '🌸' : 
                 testimonial.color.includes('blue') ? '🌊' : 
                 testimonial.color.includes('green') ? '🌿' : '✨'}
              </motion.div>
              <p className="text-gray-700 mb-4 sm:mb-6 italic text-sm sm:text-base">"{testimonial.quote}"</p>
              <div>
                <p className="font-semibold text-gray-800 text-sm sm:text-base">{testimonial.author}</p>
                <p className="text-gray-600 text-xs sm:text-sm">{testimonial.university}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials;