import { useSpotlight } from './hooks/useSpotlight';
import { Catalog } from './components/Catalog';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Navbar } from './components/Navbar';
import { Process } from './components/Process';
import { Services } from './components/Services';
import { Stats } from './components/Stats';
import { Team } from './components/Team';
import { TransitionStrip } from './components/TransitionStrip';
import { WebSiteSchema, OrganizationSchema, RealEstateAgencySchema } from './components/JsonLd';

export function App() {
  const spotlightRef = useSpotlight<HTMLDivElement>(
    '.service-card, .team-card, .step-card, .stat-card, .contact-info',
  );

  return (
    <div ref={spotlightRef}>
      <WebSiteSchema />
      <OrganizationSchema />
      <RealEstateAgencySchema />
      <a href="#inicio" className="skip-link">
        Saltar al contenido principal
      </a>
      <Navbar />
      <Hero />
      <Catalog />
      <Services />
      <Team />
      <Stats />
      <Process />
      <Contact />
      <TransitionStrip />
      <Footer />
    </div>
  );
}
