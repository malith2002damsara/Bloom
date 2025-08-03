import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Subscribed with:', email);
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 3000);
  };

  const sections = [
    {
      title: "Company Info",
      content: (
        <>
          <h3 className="text-xl font-bold text-gray-900 mb-4">BloomGrad</h3>
          <p className="text-sm mb-6 text-gray-700">
            Making your graduation day special with custom bouquets and gifts since 2018.
          </p>
          <div className="flex space-x-3">
            {['facebook', 'twitter', 'instagram'].map((social) => (
              <motion.a
                key={social}
                href="#"
                className="bg-white hover:bg-pink-100 rounded-full p-2 shadow-sm transition-colors"
                whileHover={{ y: -3, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="sr-only">{social}</span>
                <span className="w-4 h-4 block">📱</span>
              </motion.a>
            ))}
          </div>
        </>
      )
    },
    {
      title: "Quick Links",
      items: ['Home', 'About Us', 'Products', 'Custom Orders', 'Contact Us'],
      color: 'text-pink-500'
    },
    {
      title: "Customer Service",
      items: ['FAQ', 'Shipping & Delivery', 'Returns & Refunds', 'Privacy Policy', 'Terms & Conditions'],
      color: 'text-blue-500'
    },
    {
      title: "Newsletter",
      content: (
        <>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Stay Updated</h3>
          <p className="text-gray-700 text-sm mb-4">Get exclusive offers and graduation tips!</p>
          {subscribed ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-white text-green-600 px-4 py-2 rounded-lg shadow-md text-sm"
            >
              Thank you for subscribing! 🎉
            </motion.div>
          ) : (
            <motion.form 
              onSubmit={handleSubmit}
              className="flex flex-col gap-2"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <motion.input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-300 border border-gray-300 text-sm"
                whileFocus={{ scale: 1.02 }}
              />
              <motion.button 
                type="submit"
                className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-medium shadow-md whitespace-nowrap text-sm transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Subscribe
              </motion.button>
            </motion.form>
          )}
        </>
      )
    }
  ];

  return (
    <motion.footer 
      className="bg-gradient-to-r from-yellow-100 via-pink-100 to-green-100 py-8"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <div className="container mx-auto px-4">
        {/* Main 4-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              className="flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              {section.items ? (
                <>
                  <h4 className={`${section.color || 'text-gray-800'} font-medium text-lg mb-4`}>
                    {section.title}
                  </h4>
                  <ul className="space-y-2">
                    {section.items.map((item, i) => (
                      <motion.li 
                        key={i}
                        whileHover={{ x: 5 }}
                      >
                        <a href="#" className="hover:text-pink-500 transition-colors flex items-center text-sm">
                          <span className="mr-2">•</span> {item}
                        </a>
                      </motion.li>
                    ))}
                  </ul>
                </>
              ) : (
                section.content
              )}
            </motion.div>
          ))}
        </div>

        {/* Copyright */}
        <motion.div 
          className="border-t border-gray-200 pt-6 text-center text-gray-600"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p className="text-xs">© {new Date().getFullYear()} BloomGrad. All rights reserved.</p>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;