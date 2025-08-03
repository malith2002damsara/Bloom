import React from 'react';
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
// import Customizer from '../components/Customizer'
import ProductGrid from '../components/ProductGrid'
import Features from '../components/Features'
import Testimonials from '../components/Testimonials'

import Footer from '../components/Footer'


const Home = () => {
  return (
    <div className="min-h-screen">
      <main className="flex-grow pt-16 sm:pt-16 md:pt-16">
        <Navbar />
        <Hero />
        <ProductGrid />
        {/* <Customizer /> */}
        <Features />
        <Testimonials />
      </main>
      <Footer />
    </div>
  )
}

export default Home