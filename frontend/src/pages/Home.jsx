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
    <div className="">
      
      <main className="flex-grow mt-[4rem] md:mt-[4rem]">
        <Navbar />
        <Hero />
        <ProductGrid />
        <Features />
        <Testimonials />
       
      </main>
      <Footer />
    </div>
  )
}

export default Home