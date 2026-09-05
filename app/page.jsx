import Navbar from '@/components/Navbar/Navbar';
import Hero from '@/components/Hero/Hero';
import Marquee from '@/components/Marquee/Marquee';
import StatsBar from '@/components/StatsBar/StatsBar';
import Services from '@/components/Services/Services';
import Gallery from '@/components/Gallery/Gallery';
import Booking from '@/components/Booking/Booking';
import Testimonials from '@/components/Testimonials/Testimonials';
import PriceList from '@/components/PriceList/PriceList';
import Footer from '@/components/Footer/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp/FloatingWhatsApp';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <PriceList />
        <Gallery />
        <Booking />
        <StatsBar />
        <Testimonials />
        <Services />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
