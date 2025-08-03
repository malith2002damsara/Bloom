import React from 'react';
import { motion } from 'framer-motion';
import ProductGrid from '../components/ProductGrid';
import Footer from '../components/Footer';

const Collection = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      

      {/* Products Section - Using Enhanced ProductGrid */}
      <ProductGrid isCollectionPage={true} />
      
      <Footer />
    </div>
  );
};

export default Collection;