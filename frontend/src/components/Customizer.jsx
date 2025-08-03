import { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import React from 'react';

const Customizer = () => {
  const [flowerType, setFlowerType] = useState('fresh');
  const [size, setSize] = useState('medium');
  const [color, setColor] = useState('university');
  const [addons, setAddons] = useState({
    bear: false,
    ribbon: false,
    card: false
  });

  const handleAddonChange = (addon) => {
    setAddons(prev => ({
      ...prev,
      [addon]: !prev[addon]
    }));
  };

  const calculatePrice = () => {
    let basePrice = flowerType === 'fresh' ? 49.99 : 39.99;
    if (size === 'small') basePrice -= 10;
    if (size === 'large') basePrice += 15;
    if (addons.bear) basePrice += 19.99;
    if (addons.ribbon) basePrice += 4.99;
    if (addons.card) basePrice += 2.99;
    return basePrice.toFixed(2);
  };

  return (
    <section className="py-16 bg-gradient-to-b from-blue-50 to-green-50">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 mb-10 tracking-tight drop-shadow-sm"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          Design Your Perfect Graduation Gift
        </motion.h2>


        <div className="flex flex-col lg:flex-row gap-8">
          <motion.div
            className="lg:w-1/2 bg-white p-6 rounded-xl shadow-md"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h3 className="text-xl font-semibold mb-6 text-pink-600">Customization Options</h3>

            <div className="space-y-8">
              {/* Flower Type */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                viewport={{ once: true }}
              >
                <h4 className="font-medium mb-3 text-gray-700">Flower Type</h4>
                <div className="flex space-x-4">
                  {['fresh', 'artificial'].map((type) => (
                    <motion.button
                      key={type}
                      onClick={() => setFlowerType(type)}
                      className={`px-4 py-2 rounded-lg border-2 ${flowerType === type ?
                        'border-pink-500 bg-pink-100 text-pink-700' :
                        'border-gray-300 hover:border-pink-300'}`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {type === 'fresh' ? 'Fresh Flowers' : 'Artificial Flowers'}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Size */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                <h4 className="font-medium mb-3 text-gray-700">Size</h4>
                <div className="flex space-x-4">
                  {['small', 'medium', 'large'].map((sz) => (
                    <motion.button
                      key={sz}
                      onClick={() => setSize(sz)}
                      className={`px-4 py-2 rounded-lg border-2 ${size === sz ?
                        'border-blue-500 bg-blue-100 text-blue-700' :
                        'border-gray-300 hover:border-blue-300'}`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {sz.charAt(0).toUpperCase() + sz.slice(1)}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Color */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
              >
                <h4 className="font-medium mb-3 text-gray-700">Color Scheme</h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: 'University', value: 'university', colors: 'from-blue-600 to-yellow-400' },
                    { name: 'Classic White', value: 'white', colors: 'bg-white' },
                    { name: 'Elegant Pink', value: 'pink', colors: 'bg-pink-300' },
                    { name: 'Royal Blue', value: 'blue', colors: 'bg-blue-500' },
                    { name: 'Vibrant Mix', value: 'mix', colors: 'from-red-400 via-purple-500 to-yellow-400' },
                    { name: 'Custom', value: 'custom', colors: 'bg-gray-300' }
                  ].map((c) => (
                    <motion.div
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      className={`p-2 rounded-lg border-2 text-center cursor-pointer ${color === c.value ?
                        'border-green-500 bg-green-50' :
                        'border-gray-300 hover:border-green-300'}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`h-6 w-6 mx-auto rounded-full mb-1 ${c.colors.includes('bg-') ?
                        c.colors : `bg-gradient-to-r ${c.colors}`}`}></div>
                      <span className="text-xs">{c.name}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Add-ons */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                viewport={{ once: true }}
              >
                <h4 className="font-medium mb-3 text-gray-700">Add-ons</h4>
                <div className="space-y-2">
                  {[
                    { id: 'bear', label: 'Graduation Teddy Bear (+$19.99)', color: 'text-pink-600' },
                    { id: 'ribbon', label: 'Personalized Ribbon (+$4.99)', color: 'text-blue-600' },
                    { id: 'card', label: 'Message Card (+$2.99)', color: 'text-green-600' }
                  ].map((addon) => (
                    <motion.label
                      key={addon.id}
                      className="flex items-center space-x-2 cursor-pointer"
                      whileHover={{ x: 5 }}
                    >
                      <input
                        type="checkbox"
                        checked={addons[addon.id]}
                        onChange={() => handleAddonChange(addon.id)}
                        className={`rounded border-2 border-gray-300 focus:ring-2 focus:ring-${addon.color.split('-')[1]}-300 ${addon.color.replace('text', 'text')}`}
                      />
                      <span className={addon.color}>{addon.label}</span>
                    </motion.label>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="lg:w-1/2"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="bg-white p-6 rounded-xl shadow-md h-full flex flex-col">
              <h3 className="text-xl font-semibold mb-6 text-pink-600">Your Custom Design</h3>

              <motion.div
                className="flex-1 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 mb-6 flex items-center justify-center"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="text-center p-4">
                  <motion.div
                    className={`rounded-lg h-48 w-full flex items-center justify-center mb-4 ${getPreviewStyle(flowerType, color)}`}
                    animate={{
                      rotate: [0, 5, -5, 0],
                      y: [0, -10, 10, 0]
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      repeatType: 'loop'
                    }}
                  >
                    {addons.bear && (
                      <motion.span
                        className="text-4xl"
                        animate={{
                          y: [0, -20, 0],
                          rotate: [0, 10, -10, 0]
                        }}
                        transition={{
                          duration: 6,
                          repeat: Infinity,
                          repeatType: 'reverse',
                          delay: 1
                        }}
                      >
                        🧸
                      </motion.span>
                    )}
                  </motion.div>
                  <p className="text-sm text-gray-500">
                    {`${size.charAt(0).toUpperCase() + size.slice(1)} ${flowerType} bouquet in ${color} colors`}
                  </p>
                  {addons.bear && <p className="text-sm text-pink-500">With graduation teddy bear</p>}
                  {addons.ribbon && <p className="text-sm text-blue-500">With personalized ribbon</p>}
                  {addons.card && <p className="text-sm text-green-500">With message card</p>}
                </div>
              </motion.div>

              <motion.div
                className="bg-gradient-to-r from-pink-100 to-blue-100 p-4 rounded-lg"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium text-gray-700">Total Price:</span>
                  <motion.span
                    className="text-2xl font-bold text-green-600"
                    key={calculatePrice()}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    ${calculatePrice()}
                  </motion.span>
                </div>
                <motion.button
                  className="w-full bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white py-3 rounded-lg font-medium shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Add to Cart
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

function getPreviewStyle(flowerType, color) {
  const baseStyle = flowerType === 'fresh' ? 'bg-gradient-to-br from-green-100 to-green-50' : 'bg-gradient-to-br from-gray-100 to-gray-50';

  const colorStyles = {
    university: 'bg-gradient-to-r from-blue-600 to-yellow-400',
    white: 'bg-white',
    pink: 'bg-pink-300',
    blue: 'bg-blue-500',
    mix: 'bg-gradient-to-r from-red-400 via-purple-500 to-yellow-400',
    custom: 'bg-gray-300'
  };

  return `${baseStyle} ${colorStyles[color] || colorStyles.university}`;
}

export default Customizer;