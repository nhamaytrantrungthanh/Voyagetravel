/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Calendar, 
  Sparkles, 
  Compass, 
  ArrowRight, 
  Search, 
  Loader2, 
  Plane, 
  Info,
  ChevronDown
} from 'lucide-react';
import Map from './components/Map';
import { generateItinerary, DayTripPlan } from './services/geminiService';
import { cn } from './lib/utils';

// --- Types & Data ---

const DISCOVER_PLACES = [
  {
    id: 1,
    name: "Kyoto, Japan",
    description: "Serene temples, traditional tea houses, and the iconic Arashiyama Bamboo Grove.",
    image: "https://picsum.photos/seed/kyoto/800/600",
    tags: ["Culture", "Zen", "History"]
  },
  {
    id: 2,
    name: "Santorini, Greece",
    description: "Breathtaking sunsets over the Aegean Sea with whitewashed buildings and blue domes.",
    image: "https://picsum.photos/seed/santorini/800/600",
    tags: ["Romantic", "Islands", "Views"]
  },
  {
    id: 3,
    name: "Banff, Canada",
    description: "Turquoise glacial lakes and towering peaks in the heart of the Canadian Rockies.",
    image: "https://picsum.photos/seed/banff/800/600",
    tags: ["Nature", "Adventure", "Mountains"]
  },
  {
    id: 4,
    name: "Marrakech, Morocco",
    description: "Vibrant souks, intricate palaces, and the intoxicating aroma of jasmine and spices.",
    image: "https://picsum.photos/seed/marrakech/800/600",
    tags: ["Exotic", "Spices", "Architecture"]
  }
];

// --- Sub-components ---

function Hero() {
  return (
    <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-black px-6">
      {/* Background with parallax-like feel */}
      <motion.div 
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 0.6, scale: 1 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 z-0"
      >
        <img 
          src="https://picsum.photos/seed/adventure/1920/1080?blur=10" 
          alt="Adventure Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
      </motion.div>

      <div className="relative z-10 max-w-5xl w-full text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="text-xs uppercase tracking-[0.4em] font-medium text-white/60 mb-4 block">
            The Future of Travel
          </span>
          <h1 className="text-[12vw] md:text-[8rem] font-bold leading-[0.85] text-white uppercase tracking-tighter mix-blend-difference">
            Voyage <span className="text-[#F27D26]">AI</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-2xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed"
        >
          Discover hidden gems and orchestrate your perfect day trips using advanced intelligence. Your next adventure begins with a prompt.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="pt-8"
        >
          <button 
            onClick={() => document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' })}
            className="group relative px-8 py-4 bg-white text-black font-semibold rounded-full overflow-hidden transition-all hover:pr-12"
          >
            <span className="relative z-10 flex items-center gap-2">
              Plan My Trip <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </motion.div>
      </div>

      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/40 cursor-pointer"
        onClick={() => document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <ChevronDown size={32} />
      </motion.div>
    </section>
  );
}

interface DiscoverItemProps {
  place: typeof DISCOVER_PLACES[0];
}

const DiscoverItem: React.FC<DiscoverItemProps> = ({ place }) => {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      className="group relative rounded-3xl overflow-hidden aspect-[4/5] bg-zinc-900 border border-white/5 cursor-pointer"
    >
      <img 
        src={place.image} 
        alt={place.name} 
        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-110"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      
      <div className="absolute bottom-0 p-8 space-y-3 w-full">
        <div className="flex gap-2">
          {place.tags.map(tag => (
            <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold py-1 px-3 bg-white/10 backdrop-blur-md rounded-full text-white/80">
              {tag}
            </span>
          ))}
        </div>
        <h3 className="text-3xl font-bold text-white leading-none">{place.name}</h3>
        <p className="text-white/60 text-sm line-clamp-2 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          {place.description}
        </p>
      </div>
    </motion.div>
  );
}

// --- Main App ---

export default function App() {
  const [destination, setDestination] = useState('');
  const [interests, setInterests] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<DayTripPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePlanTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !interests) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await generateItinerary(destination, "1-day", interests);
      setPlan(result);
      // Wait a bit then scroll
      setTimeout(() => {
        document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const mapLocations = plan?.itinerary
    .filter(item => item.location)
    .map(item => ({
      lat: item.location!.lat,
      lng: item.location!.lng,
      name: item.location!.name
    })) || [];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#F27D26] selection:text-white">
      <Hero />

      {/* Discover Section */}
      <section id="discover" className="py-24 px-6 max-w-7xl mx-auto space-y-16">
        <div className="space-y-4">
          <span className="text-[#F27D26] font-mono text-sm tracking-widest uppercase">01 / Collection</span>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter">Curated Destinations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DISCOVER_PLACES.map(place => (
            <DiscoverItem key={place.id} place={place} />
          ))}
        </div>
      </section>

      {/* Planner Section */}
      <section id="planner" className="py-24 px-6 bg-zinc-950">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <span className="text-[#F27D26] font-mono text-sm tracking-widest uppercase">02 / Engine</span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Trip Architect</h2>
            <p className="text-zinc-500 max-w-xl mx-auto">Tell us where you want to go and what you love. We'll craft a precision day trip just for you.</p>
          </div>

          <form onSubmit={handlePlanTrip} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-zinc-500 flex items-center gap-2">
                  <MapPin size={14} /> Destination
                </label>
                <input 
                  type="text" 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Tokyo, Paris, or Sedona"
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-[#F27D26]/50 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-zinc-500 flex items-center gap-2">
                  <Sparkles size={14} /> Interests
                </label>
                <input 
                  type="text" 
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g. Art galleries, hikes, street food"
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-[#F27D26]/50 transition-all font-medium"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-5 rounded-2xl bg-white text-black font-bold text-lg flex items-center justify-center gap-3 hover:bg-[#F27D26] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" /> Thinking...
                </>
              ) : (
                <>
                  Generate Itinerary <Plane className="group-hover:rotate-45 transition-transform" />
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Result Section */}
      <AnimatePresence>
        {plan && (
          <motion.section 
            id="result"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-24 px-6 max-w-7xl mx-auto border-t border-white/5"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Left Column: Itinerary */}
              <div className="space-y-10">
                <div className="space-y-2">
                  <h3 className="text-5xl font-bold tracking-tighter">{plan.destination}</h3>
                  <p className="text-zinc-400 leading-relaxed italic border-l-4 border-[#F27D26] pl-6 font-serif text-lg">
                    {plan.summary}
                  </p>
                </div>

                <div className="space-y-6">
                  {plan.itinerary.map((item, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-6 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-[#F27D26]/30 transition-all group"
                    >
                      <div className="flex gap-6 items-start">
                        <span className="font-mono text-[#F27D26] text-lg pt-1">{item.time}</span>
                        <div className="space-y-2">
                          <h4 className="text-xl font-bold">{item.activity}</h4>
                          <p className="text-zinc-400 text-sm leading-relaxed">{item.description}</p>
                          {item.location && (
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase font-bold tracking-widest pt-2">
                              <MapPin size={12} className="text-[#F27D26]" /> {item.location.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="p-8 rounded-3xl bg-[#F27D26]/5 border border-[#F27D26]/20 space-y-4">
                  <h4 className="font-bold flex items-center gap-2 text-[#F27D26]">
                    <Info size={18} /> Pro Tips
                  </h4>
                  <ul className="space-y-2">
                    {plan.tips.map((tip, idx) => (
                      <li key={idx} className="text-sm text-zinc-300 flex gap-3">
                        <span className="text-[#F27D26]">•</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column: Sticky Map */}
              <div className="lg:sticky lg:top-12 h-[600px] lg:h-[800px]">
                <Map locations={mapLocations} />
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <footer className="py-24 border-t border-white/5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
          <h2 className="text-5xl md:text-8xl font-black text-white/5 select-none text-center">VOYAGE AI</h2>
          <div className="flex flex-col md:flex-row items-center gap-8 text-xs uppercase tracking-[0.4em] font-semibold text-zinc-600">
            <span>Discover</span>
            <div className="w-2 h-2 rounded-full bg-[#F27D26]" />
            <span>Plan</span>
            <div className="w-2 h-2 rounded-full bg-[#F27D26]" />
            <span>Explore</span>
          </div>
          <p className="text-zinc-500 text-xs mt-12">© 2026 Voyage AI. Powered by Intelligence.</p>
        </div>
      </footer>
    </div>
  );
}
