
import React, { useState, useEffect, useRef } from 'react';
import { OldPaperTexture } from './components/OldPaperTexture';
import { Navigation } from './components/Navigation';
import { SectionHeader } from './components/SectionHeader';
import { generateDailyHeadline, chatWithMentor, exploreLocation, generateTimeline, getMissionBriefing, triggerTimeRipple, generateChaosPuzzle } from './services/geminiService';
import { supabase, isAuthConfigured } from './services/supabaseClient';
import { AppSection, NewsArticle, TimePortal, Mentor, ChatMessage, TimelineEvent, MissionBriefing, RippleResult, ChaosPuzzle, TravelerProfile, Artifact } from './types';
import { Send, Mic, Camera, RefreshCw, Map, PlayCircle, ArrowRight, Star, Compass, ArrowLeft, MapPin, History, ShieldAlert, Stamp, AlertTriangle, Zap, Activity, HelpCircle, RotateCcw, LogOut, Key, User, Coffee, Award, Briefcase, Scroll, Gem, Feather, X, ZoomIn, ZoomOut, ZapOff } from 'lucide-react';

// --- Sub-Components for Views (Inline for single-file structure requirement within XML limit) ---

// 0. LOGIN VIEW (Vintage Press Pass)
const LoginView: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async () => {
    setError(null);
    setLoading(true);
    
    // Simulation for demo if no keys are present
    if (!isAuthConfigured()) {
      setTimeout(() => {
        setLoading(false);
        onLogin();
      }, 1500);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        // If Supabase is configured to not require email verification, session will be present immediately
        if (data.session) {
            onLogin();
        } else {
            setError("Application submitted. Check your telegrams (email) for confirmation.");
            setLoading(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin();
      }
    } catch (e: any) {
      let msg = e.message || "Connection failed. Ensure secure link.";
      
      // OFFLINE FALLBACK PROTOCOL
      if (msg === "Failed to fetch" || msg.includes("NetworkError") || msg.includes("network")) {
         setError("Backend unreachable. Engaging Offline Protocol...");
         setTimeout(() => {
             onLogin();
         }, 1500);
      } else {
         setError(msg);
         setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 z-50 relative">
       <div className="bg-[#fdf6e3] max-w-md w-full border-4 border-double border-ink p-8 shadow-2xl relative transform rotate-1">
          
          {/* Stamps and Decor */}
          <div className="absolute top-4 right-4 opacity-20 transform rotate-12 border-4 border-alert-red p-1 rounded-full">
            <div className="border border-alert-red rounded-full w-16 h-16 flex items-center justify-center">
               <Stamp size={40} className="text-alert-red" />
            </div>
          </div>

          <div className="text-center border-b-2 border-ink pb-4 mb-6">
             <h1 className="font-serif text-4xl font-black uppercase tracking-tight mb-1">Timension</h1>
             <p className="font-mono text-sm uppercase tracking-widest border-y border-ink py-1 inline-block">
                Official Press Pass Application
             </p>
          </div>

          {error && (
            <div className="mb-4 p-2 border border-alert-red bg-alert-red/10 text-alert-red font-mono text-xs text-center animate-pulse">
               ⚠ {error}
            </div>
          )}

          <div className="space-y-6">
             <div className="relative">
                <label className="font-mono text-xs uppercase font-bold block mb-1 ml-2">Codename (Email)</label>
                <div className="flex items-center border-b-2 border-ink pb-1">
                   <User size={18} className="mr-2 text-ink-light" />
                   <input 
                     type="email" 
                     value={email}
                     onChange={e => setEmail(e.target.value)}
                     className="bg-transparent w-full font-serif text-xl focus:outline-none placeholder:text-ink/30"
                     placeholder="h.wells@timemail.com"
                   />
                </div>
             </div>

             <div className="relative">
                <label className="font-mono text-xs uppercase font-bold block mb-1 ml-2">Secret Key (Password)</label>
                <div className="flex items-center border-b-2 border-ink pb-1">
                   <Key size={18} className="mr-2 text-ink-light" />
                   <input 
                     type="password" 
                     value={password}
                     onChange={e => setPassword(e.target.value)}
                     className="bg-transparent w-full font-serif text-xl focus:outline-none placeholder:text-ink/30"
                     placeholder="••••••••"
                   />
                </div>
             </div>

             <button 
               onClick={handleAuth}
               disabled={loading}
               className="w-full bg-ink text-paper py-3 font-mono uppercase font-bold tracking-wider hover:bg-sepia-accent transition-all flex items-center justify-center gap-2 mt-4 group"
             >
               {loading ? (
                 <div className="flex items-center gap-2">
                    <RefreshCw className="animate-spin" size={18} />
                    <span>Verifying...</span>
                 </div>
               ) : (
                 <>
                   <Stamp size={18} className="group-hover:rotate-12 transition-transform" />
                   {isSignUp ? 'Submit Application' : 'Stamp & Enter'}
                 </>
               )}
             </button>

             <div className="text-center pt-4">
                <button 
                  onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                  className="font-mono text-xs underline hover:text-sepia-accent"
                >
                  {isSignUp ? "Already have a pass? Sign In" : "New to the Archives? Apply here"}
                </button>
             </div>
          </div>
          
          {!isAuthConfigured() && (
             <p className="mt-4 text-[10px] text-center text-alert-red font-mono opacity-70">
                * Demo Mode: Auth keys missing. Clicking submit will bypass.
             </p>
          )}
       </div>
    </div>
  );
};

// 0.5 TRAVELER'S VAULT (Profile)
const TravelerVault: React.FC<{ isOpen: boolean; onClose: () => void; userEmail: string; onLogout: () => void }> = ({ isOpen, onClose, userEmail, onLogout }) => {
  const [profile, setProfile] = useState<TravelerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!isOpen) return;
      setLoading(true);

      try {
        // 1. Get User ID
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            // 2. Fetch Profile Stats
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            
            // 3. Fetch Inventory
            const { data: inventoryData, error: inventoryError } = await supabase
                .from('inventory')
                .select('*')
                .eq('user_id', user.id);

            if (profileData) {
                setProfile({
                    email: profileData.email || userEmail,
                    stats: {
                        rank: profileData.rank || "Chrono-Cadet",
                        centuriesTraversed: profileData.centuries_traversed || 0,
                        paradoxesCaused: profileData.paradoxes_caused || 0,
                        artifactsFound: profileData.artifacts_found || 0,
                        majorDiscoveries: profileData.major_discoveries || 0,
                        joinDate: profileData.join_date || new Date().toISOString().split('T')[0]
                    },
                    inventory: (inventoryData || []).map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        rarity: item.rarity,
                        iconName: item.icon_name
                    }))
                });
            } else {
                 // Fallback if DB row doesn't exist yet (e.g. trigger delay)
                 throw new Error("Profile not found");
            }
        } else {
             // Fallback / Demo Mode Logic
             throw new Error("No user");
        }
      } catch (e) {
        // Fallback Mock Data for seamless experience if DB isn't set up or user is null
        setProfile({
            email: userEmail,
            stats: {
              rank: "Chrono-Cadet",
              centuriesTraversed: 3,
              paradoxesCaused: 1,
              artifactsFound: 4,
              majorDiscoveries: 7,
              joinDate: "1920-08-01"
            },
            inventory: [
              { id: '1', name: 'Tesla\'s Coil', description: 'A copper fragment humming with energy.', rarity: 'Rare', iconName: 'zap' },
              { id: '2', name: 'Caesar\'s Laurel', description: 'A dried golden leaf.', rarity: 'Relic', iconName: 'feather' },
              { id: '3', name: 'Lunar Dust', description: 'Grey powder in a glass vial.', rarity: 'Common', iconName: 'star' },
              { id: '4', name: 'Press Badge', description: 'Your official credential.', rarity: 'Common', iconName: 'badge' }
            ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [isOpen, userEmail]);

  if (!isOpen) return null;

  const getIcon = (name: string) => {
    switch(name) {
      case 'zap': return <Zap size={16} />;
      case 'feather': return <Feather size={16} />;
      case 'star': return <Star size={16} />;
      default: return <Award size={16} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
       <div className="bg-[#f0e6d2] w-full max-w-lg h-[85vh] border-4 border-double border-ink shadow-2xl relative flex flex-col overflow-hidden transform rotate-0 md:rotate-1">
          
          {/* Header (File Folder Tab Style) */}
          <div className="bg-ink text-paper p-4 flex justify-between items-center relative z-10">
             <div className="flex items-center gap-3">
                <Briefcase className="text-vintage-gold" />
                <div>
                   <h2 className="font-serif text-2xl font-bold leading-none">Traveler's Dossier</h2>
                   <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">Confidential • Top Secret</span>
                </div>
             </div>
             <button onClick={onClose} className="hover:text-alert-red transition-colors"><X size={24} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 relative">
             <OldPaperTexture />
             
             {loading || !profile ? (
                 <div className="flex h-full items-center justify-center">
                     <div className="animate-pulse font-mono flex flex-col items-center gap-2">
                         <RefreshCw className="animate-spin" />
                         <span>RETRIEVING RECORDS...</span>
                     </div>
                 </div>
             ) : (
                <>
                {/* Section 1: Identity */}
                <div className="flex gap-4 mb-8 border-b-2 border-ink pb-6">
                    <div className="w-24 h-32 bg-gray-300 border-2 border-ink shadow-md p-1 relative rotate-[-2deg]">
                    <div className="w-full h-full bg-ink/10 flex flex-col items-center justify-center">
                        <User size={40} className="text-ink/50" />
                        <span className="font-serif text-[10px] text-center mt-2 text-ink/50">NO PHOTO</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2">
                        <Stamp size={32} className="text-alert-red opacity-80" />
                    </div>
                    </div>
                    <div className="flex-1">
                    <label className="font-mono text-[10px] uppercase text-ink-light block">Agent Name</label>
                    <p className="font-serif text-xl font-bold border-b border-dotted border-ink mb-2 truncate">{profile.email.split('@')[0]}</p>
                    
                    <label className="font-mono text-[10px] uppercase text-ink-light block">Current Rank</label>
                    <p className="font-serif text-lg italic text-sepia-accent font-bold mb-2">{profile.stats.rank}</p>

                    <label className="font-mono text-[10px] uppercase text-ink-light block">Service Started</label>
                    <p className="font-mono text-sm">{profile.stats.joinDate}</p>
                    </div>
                </div>

                {/* Section 2: Passport Stamps (Activity) */}
                <div className="mb-8">
                    <h3 className="font-serif text-xl font-bold mb-3 flex items-center gap-2">
                    <Map size={18} /> Chrono-Passport
                    </h3>
                    <div className="grid grid-cols-5 gap-2 bg-white/50 border border-ink p-3">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className={`aspect-square border border-dashed border-ink/30 rounded-full flex items-center justify-center ${i < 3 ? 'opacity-100' : 'opacity-30'}`}>
                            {i < 3 ? (
                                <Stamp size={20} className={`transform rotate-${Math.floor(Math.random() * 45)} ${i === 2 ? 'text-alert-red' : 'text-ink/60'}`} />
                            ) : (
                                <span className="text-[8px] font-mono text-ink/20">{i+1}</span>
                            )}
                        </div>
                    ))}
                    </div>
                    <p className="text-center font-mono text-[10px] mt-1 text-ink-light italic">Log in daily to earn visas.</p>
                </div>

                {/* Section 3: Curio Cabinet (Inventory) */}
                <div className="mb-8">
                    <h3 className="font-serif text-xl font-bold mb-3 flex items-center gap-2">
                    <Gem size={18} /> Curio Cabinet
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                    {profile.inventory.map(item => (
                        <div key={item.id} className="border border-ink bg-paper p-2 flex items-start gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:translate-y-[-1px] transition-transform">
                            <div className={`p-2 border border-ink rounded-sm ${item.rarity === 'Relic' ? 'bg-vintage-gold' : 'bg-gray-200'}`}>
                                {getIcon(item.iconName)}
                            </div>
                            <div>
                                <p className="font-serif font-bold text-sm leading-none">{item.name}</p>
                                <p className="font-mono text-[9px] text-ink-light mt-1 leading-tight">{item.description}</p>
                            </div>
                        </div>
                    ))}
                    {/* Empty Slot */}
                    <div className="border border-dashed border-ink p-2 flex items-center justify-center opacity-40 min-h-[60px]">
                        <span className="font-mono text-[10px]">Empty Slot</span>
                    </div>
                    </div>
                </div>

                {/* Section 4: Stats */}
                <div className="bg-ink text-paper p-4 relative overflow-hidden mb-4">
                    <div className="grid grid-cols-4 gap-2 text-center relative z-10">
                    <div>
                        <p className="font-mono text-2xl font-bold text-vintage-gold">{profile.stats.centuriesTraversed}</p>
                        <p className="font-mono text-[9px] uppercase">Centuries</p>
                    </div>
                    <div>
                        <p className="font-mono text-2xl font-bold text-vintage-gold">{profile.stats.artifactsFound}</p>
                        <p className="font-mono text-[9px] uppercase">Artifacts</p>
                    </div>
                    <div>
                        <p className="font-mono text-2xl font-bold text-vintage-gold">{profile.stats.majorDiscoveries}</p>
                        <p className="font-mono text-[9px] uppercase">Discoveries</p>
                    </div>
                    <div>
                        <p className="font-mono text-2xl font-bold text-alert-red">{profile.stats.paradoxesCaused}</p>
                        <p className="font-mono text-[9px] uppercase">Paradoxes</p>
                    </div>
                    </div>
                </div>
                
                <button 
                onClick={onLogout}
                className="w-full border-2 border-ink py-3 font-mono uppercase text-xs font-bold hover:bg-alert-red hover:text-paper hover:border-alert-red transition-colors flex items-center justify-center gap-2 group"
                >
                    <LogOut size={16} /> Revoke Credentials (Sign Out)
                </button>
                </>
             )}
          </div>
       </div>
    </div>
  );
};

// 1. FRONT PAGE VIEW
const FrontPage: React.FC = () => {
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');

  // Reliable Wikimedia thumbnail URL for Gandhi
  const FALLBACK_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Gandhi_spinning.jpg/640px-Gandhi_spinning.jpg";

  useEffect(() => {
    const fetchHeadline = async () => {
      const data = await generateDailyHeadline();
      setArticle(data);
      setLoading(false);
      setImageState('loading');
    };
    fetchHeadline();
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-8 pb-24">
      {/* Header Styled like 'The Bombay Chronicle' Reference */}
      <div className="border-b-4 border-double border-ink mb-6 pb-2 text-center relative">
        <div className="flex justify-between items-center border-b border-ink pb-1 mb-2 px-2">
           <div className="text-left">
              <span className="font-mono text-[10px] uppercase tracking-widest block">Regd. No. B. 1820</span>
              <span className="font-mono text-[10px] uppercase tracking-widest block">VOL. XVIII</span>
           </div>
           <div className="text-center">
               <span className="font-serif italic text-xs">Largest Circulation in History</span>
           </div>
           <div className="text-right">
               <span className="font-mono text-[10px] uppercase tracking-widest block">PRICE: TWO ANNAS</span>
           </div>
        </div>
        <h1 className="font-serif text-5xl md:text-7xl font-black text-ink uppercase tracking-tighter leading-none mb-2 scale-y-125">
          The Timension Chronicle
        </h1>
        <div className="border-t border-b border-ink py-1 mb-2 mt-2 flex justify-between px-4 items-center bg-paper-dark/30">
           <span className="font-serif font-bold uppercase text-sm">AHMEDABAD, {article?.date || "SATURDAY"}</span>
           <span className="font-serif font-bold uppercase text-sm">{article?.weather || "WEATHER: UNCERTAIN"}</span>
        </div>
      </div>
      
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center font-mono animate-pulse text-sepia-accent space-y-2">
           <RefreshCw className="animate-spin" size={32}/>
           <span>FETCHING FROM ARCHIVES...</span>
        </div>
      ) : (
        <>
          {/* Main Story - Styled like 'MAHATMA ARRESTED' Layout */}
          <div className="bg-paper p-2">
             {/* Massive Headline */}
             <div className="text-center mb-6 border-b-2 border-black pb-4">
                <h2 className="font-serif text-4xl md:text-6xl font-black leading-[0.9] mb-2 uppercase tracking-tight">
                    {article?.headline || "MAHATMA ARRESTED"}
                </h2>
                <div className="w-32 h-1 bg-black mx-auto mb-2"></div>
                <h3 className="font-serif text-xl md:text-2xl font-bold uppercase tracking-widest">
                   ON CHARGE OF SEDITION.
                </h3>
             </div>

             <div className="flex flex-col md:flex-row gap-6">
               {/* Image Column with Halftone Effect */}
               <div className="md:w-5/12 order-2 md:order-1">
                  <div className="w-full border-4 border-ink p-1 bg-white mb-2 relative overflow-hidden group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {/* Vintage Loading Indicator */}
                    {imageState === 'loading' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f0e6d2] z-20">
                        <RefreshCw size={32} className="text-ink animate-spin mb-2" />
                        <p className="font-mono text-[10px] text-ink font-bold uppercase tracking-widest">DEVELOPING PLATE...</p>
                      </div>
                    )}
                    
                    {/* Image with Halftone & High Contrast Filter */}
                    <div className="relative w-full h-80 bg-gray-300">
                        <img 
                          src={article?.imageUrl || FALLBACK_IMAGE} 
                          alt="Historical Event" 
                          onLoad={() => setImageState('loaded')}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== FALLBACK_IMAGE) {
                              target.src = FALLBACK_IMAGE;
                            }
                            setImageState('loaded');
                          }}
                          className={`w-full h-full object-cover transition-opacity duration-700 ${imageState === 'loading' ? 'opacity-0' : 'opacity-100'}`}
                          style={{ 
                              filter: 'grayscale(100%) contrast(130%) brightness(110%) sepia(20%)' 
                          }}
                        />
                        {/* Halftone Overlay */}
                        <div 
                            className="absolute inset-0 pointer-events-none opacity-20 z-10 mix-blend-multiply"
                            style={{
                                backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                                backgroundSize: '4px 4px'
                            }}
                        ></div>
                        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] z-10"></div>
                    </div>
                  </div>
                  <p className="font-mono text-[10px] text-center text-ink font-bold uppercase border-t border-ink pt-1 mt-1">
                     FIG. 1: SCENE AT THE ASHRAM
                  </p>
               </div>

               {/* Text Column */}
               <div className="md:w-7/12 order-1 md:order-2 flex flex-col justify-between">
                  <div>
                      <div className="flex items-center gap-2 mb-2">
                         <span className="font-mono text-xs font-bold uppercase border border-ink px-1">SPECIAL TELEGRAM</span>
                         <span className="h-px bg-ink flex-1"></span>
                      </div>
                      <p className="font-body text-xl md:text-2xl leading-tight text-justify drop-cap-parent">
                        <span className="float-left text-5xl font-serif font-bold leading-[0.8] mr-2 mt-1">"</span>
                        {article?.content}
                      </p>
                  </div>
                  
                  <div className="mt-6 border-t-2 border-double border-ink pt-4">
                     <h4 className="font-serif font-bold text-lg uppercase mb-2 text-center">LATEST BULLETIN</h4>
                     <ul className="list-disc pl-5 font-mono text-xs space-y-1">
                        <li>MR. BANKER ALSO ARRESTED.</li>
                        <li>PERFECT PEACE IN THE CITY.</li>
                        <li>CROWDS GATHER AT POLICE STATION.</li>
                     </ul>
                     
                     <button className="mt-6 w-full bg-ink text-paper py-3 font-mono text-sm uppercase hover:bg-sepia-accent transition-colors flex items-center justify-center gap-2 font-bold">
                        READ FULL REPORT <ArrowRight size={16} />
                     </button>
                  </div>
               </div>
             </div>
          </div>

          {/* Secondary Stories Grid */}
          <div className="grid grid-cols-3 gap-4 border-t-4 border-ink pt-4">
             <div className="col-span-1 border-r border-ink pr-4 text-center">
                <h3 className="font-serif text-lg font-bold border-b border-ink mb-2 uppercase">SWADESHI</h3>
                <p className="font-body text-xs mb-2">"Buy only homespun cloth. Reject the foreign import."</p>
                <div className="w-10 h-10 border border-ink rounded-full mx-auto flex items-center justify-center">
                    <Gem size={16} />
                </div>
             </div>
             <div className="col-span-1 border-r border-ink pr-4 text-center">
                <h3 className="font-serif text-lg font-bold border-b border-ink mb-2 uppercase">NOTICE</h3>
                <p className="font-body text-xs italic">Public meeting at Chowpatty Sands this evening at 5 PM.</p>
             </div>
             <div className="col-span-1 text-center">
                <h3 className="font-serif text-lg font-bold border-b border-ink mb-2 uppercase">WEATHER</h3>
                <p className="font-mono text-xs">Temp: 32°C</p>
                <p className="font-mono text-xs">Wind: NW 10mph</p>
             </div>
          </div>
        </>
      )}
    </div>
  );
};

// 2. TIME PORTALS (Classifieds)
const TimePortals: React.FC = () => {
  const [selectedPortal, setSelectedPortal] = useState<TimePortal | null>(null);
  const [briefing, setBriefing] = useState<MissionBriefing | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [missionAccepted, setMissionAccepted] = useState(false);

  const portals: TimePortal[] = [
    { id: '1', year: '1325', title: 'Expedition: Ibn Battuta', description: 'Caravan departing soon. Seekers of knowledge wanted.', difficulty: 'Beginner' },
    { id: '2', year: '1895', title: 'Tesla\'s Lab Assistant', description: 'Help conduct high-voltage experiments. Rubber soles required.', difficulty: 'Scholar' },
    { id: '3', year: '48 BC', title: 'Royal Court of Cleopatra', description: 'Diplomats needed for urgent negotiations with Rome.', difficulty: 'Time Lord' },
    { id: '4', year: '1969', title: 'Moon Landing Control', description: 'Calculate the trajectory. Failure is not an option.', difficulty: 'Scholar' },
  ];

  const handlePortalClick = async (portal: TimePortal) => {
    setSelectedPortal(portal);
    setLoadingBrief(true);
    setMissionAccepted(false);
    setBriefing(null);
    const data = await getMissionBriefing(portal.year, portal.title);
    setBriefing(data);
    setLoadingBrief(false);
  };

  // Portal Detail View (Mission Briefing)
  if (selectedPortal) {
    return (
      <div className="p-4 max-w-3xl mx-auto pb-24 h-[calc(100vh-80px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 border-b-2 border-ink pb-2">
           <button 
             onClick={() => setSelectedPortal(null)} 
             className="p-2 border border-ink hover:bg-ink hover:text-paper transition-colors"
           >
             <ArrowLeft size={20} />
           </button>
           <h2 className="font-mono text-xl uppercase font-bold tracking-wider flex-1 text-center">
             TIMELINE: {selectedPortal.year}
           </h2>
        </div>

        {/* The Dossier */}
        <div className="flex-1 relative">
           <div className="absolute inset-0 bg-[#f0e6d2] border-4 border-double border-ink p-6 shadow-2xl transform rotate-1 flex flex-col overflow-y-auto">
              {/* Watermark */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                 <Stamp size={300} />
              </div>

              <div className="flex justify-between items-start mb-6">
                 <div className="border-2 border-ink p-2 inline-block">
                    <span className="font-mono text-xs font-bold block">DESTINATION</span>
                    <span className="font-serif text-2xl font-bold block">{selectedPortal.year}</span>
                 </div>
                 <div className="text-right">
                    <span className="text-alert-red font-black font-mono text-xl border-2 border-alert-red px-2 py-1 rotate-[-5deg] inline-block opacity-80">
                       CONFIDENTIAL
                    </span>
                 </div>
              </div>

              <h3 className="font-serif text-3xl font-bold mb-2 text-center border-b border-dashed border-ink pb-2">
                {selectedPortal.title}
              </h3>

              {loadingBrief ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                   <div className="w-16 h-16 border-4 border-ink border-t-transparent rounded-full animate-spin"></div>
                   <p className="font-mono text-sm animate-pulse">DECRYPTING ARCHIVES...</p>
                </div>
              ) : briefing ? (
                <div className="space-y-6 flex-1">
                   <div className="bg-white/50 p-4 border border-ink relative">
                      <span className="absolute -top-3 left-2 bg-ink text-paper text-[10px] font-mono px-1">CODENAME</span>
                      <p className="font-mono text-lg font-bold tracking-widest">{briefing.codename}</p>
                   </div>

                   <div className="space-y-2">
                      <h4 className="font-mono text-xs uppercase font-bold border-b border-ink w-max">Primary Objective</h4>
                      <p className="font-body text-xl leading-snug">STOP. {briefing.objective} STOP.</p>
                   </div>

                   <div className="space-y-2">
                      <h4 className="font-mono text-xs uppercase font-bold border-b border-ink w-max">Required Disguise</h4>
                      <p className="font-body text-lg italic text-ink-light">{briefing.disguise}</p>
                   </div>

                   <div className="space-y-2">
                      <h4 className="font-mono text-xs uppercase font-bold border-b border-ink w-max">Secret Passphrase</h4>
                      <p className="font-mono text-sm bg-ink text-paper p-2 inline-block">"{briefing.passphrase}"</p>
                   </div>
                </div>
              ) : (
                 <div className="text-center text-alert-red font-mono">TRANSMISSION FAILED</div>
              )}

              {/* Action Footer */}
              {!loadingBrief && (
                 <div className="mt-8 pt-4 border-t-2 border-ink flex flex-col gap-3">
                    {missionAccepted ? (
                       <div className="bg-vintage-gold text-ink p-4 text-center font-bold font-mono border-2 border-ink animate-bounce">
                          VISA GRANTED. PREPARING JUMP...
                       </div>
                    ) : (
                       <button 
                         onClick={() => setMissionAccepted(true)}
                         className="w-full bg-ink text-paper py-4 font-mono text-lg font-bold hover:bg-sepia-accent transition-colors flex items-center justify-center gap-2"
                       >
                          <Stamp size={24} /> STAMP & ACCEPT MISSION
                       </button>
                    )}
                    <p className="text-[10px] font-mono text-center text-ink-light">
                       WARNING: TIMELINE DISRUPTION IS A CLASS I OFFENSE.
                    </p>
                 </div>
              )}
           </div>
        </div>
      </div>
    );
  }

  // Main List View
  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <SectionHeader title="Classified Portals" subtitle="Opportunities Across Time" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {portals.map((portal) => (
          <div 
            key={portal.id} 
            onClick={() => handlePortalClick(portal)}
            className="border-2 border-black p-4 hover:bg-vintage-gold/10 transition-colors cursor-pointer relative group shadow-[4px_4px_0px_0px_rgba(44,44,44,1)] hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <div className="absolute -top-3 left-4 bg-paper px-2 border border-black text-xs font-mono font-bold group-hover:text-alert-red transition-colors">
              YEAR {portal.year}
            </div>
            <h3 className="font-serif text-2xl font-bold mt-2 mb-2 group-hover:underline">{portal.title}</h3>
            <p className="font-body text-base mb-4 line-clamp-2">{portal.description}</p>
            <div className="flex justify-between items-center border-t border-dashed border-black pt-2">
              <span className="font-mono text-xs uppercase flex items-center gap-1">
                <ShieldAlert size={12} /> {portal.difficulty}
              </span>
              <span className="text-ink font-mono text-xs uppercase group-hover:bg-ink group-hover:text-paper px-1 transition-colors">
                Apply Now →
              </span>
            </div>
          </div>
        ))}
        
        {/* Interactive "Wanted" Ad */}
        <div className="border-2 border-black p-4 border-dashed flex flex-col items-center justify-center text-center opacity-70 hover:opacity-100 transition-opacity cursor-pointer">
          <div className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center mb-2">
            <span className="text-2xl font-serif font-bold">?</span>
          </div>
          <h3 className="font-serif text-xl font-bold">Custom Coordinates</h3>
          <p className="font-mono text-xs mt-1">Input specific year vector</p>
        </div>
      </div>
    </div>
  );
};

// 3. MENTOR CHAT (Persona Library)
const MentorChat: React.FC = () => {
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const mentors: Mentor[] = [
    { id: 'einstein', name: 'Albert Einstein', role: 'Physics', era: '1921', avatar: 'E', systemPrompt: 'You are Einstein.' },
    { id: 'cleo', name: 'Cleopatra', role: 'Leadership', era: '40 BC', avatar: 'C', systemPrompt: 'You are Cleopatra.' },
    { id: 'gandhi', name: 'Mahatma Gandhi', role: 'Ethics', era: '1930', avatar: 'G', systemPrompt: 'You are Gandhi.' },
    { id: 'davinci', name: 'Leonardo da Vinci', role: 'Renaissance Man', era: '1490', avatar: 'L', systemPrompt: 'You are Leonardo da Vinci, a polymath from the Renaissance.' },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedMentor) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const reply = await chatWithMentor(selectedMentor.name, selectedMentor.era, messages, userMsg.text);
    
    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'ai', text: reply, timestamp: Date.now() };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  if (!selectedMentor) {
    return (
      <div className="p-4 max-w-3xl mx-auto pb-24">
        <SectionHeader title="The Persona Library" subtitle="Consult the Great Minds" />
        <div className="grid grid-cols-1 gap-4">
          {mentors.map(mentor => (
            <div key={mentor.id} onClick={() => { setSelectedMentor(mentor); setMessages([]); }} 
              className="flex items-center gap-4 border-b-2 border-ink pb-4 cursor-pointer hover:bg-vintage-gold/10 p-2 transition-colors">
              <div className="w-16 h-16 bg-ink text-paper font-serif text-3xl flex items-center justify-center rounded-full border-2 border-vintage-gold">
                {mentor.avatar}
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold">{mentor.name}</h3>
                <p className="font-mono text-xs uppercase tracking-wider">{mentor.role} • {mentor.era}</p>
              </div>
              <div className="ml-auto">
                <ArrowRight />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24 h-screen flex flex-col pt-4">
      <div className="flex items-center justify-between border-b-2 border-ink pb-2 mb-2">
        <button onClick={() => setSelectedMentor(null)} className="font-mono text-xs underline hover:text-sepia-accent">← Back to Directory</button>
        <span className="font-serif font-bold text-xl">{selectedMentor.name}</span>
        <div className="w-8 h-8 bg-ink text-paper rounded-full flex items-center justify-center font-serif">{selectedMentor.avatar}</div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-2 newspaper-border bg-paper-dark/30" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center py-10 opacity-50 italic font-serif">
            "Greetings. How may I assist your curiosity today?"
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 ${msg.sender === 'user' ? 'bg-ink text-paper' : 'bg-paper border border-ink'} shadow-md`}>
              <p className={`font-body text-lg leading-snug`}>{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && <div className="text-center font-mono text-xs animate-pulse">The quill is moving...</div>}
      </div>

      <div className="mt-4 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask your question..."
          className="flex-1 bg-paper border-2 border-ink p-3 font-body text-lg placeholder:font-mono placeholder:text-sm focus:outline-none focus:border-sepia-accent"
        />
        <button onClick={handleSend} disabled={loading} className="bg-ink text-paper px-6 hover:bg-sepia-accent transition-colors">
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

// 4. THE BUTTERFLY EFFECT (Formerly Comic Chronicles)
const Chronicle: React.FC = () => {
  const [panels, setPanels] = useState([
    { id: 1, text: "Where is the library of Alexandria?", img: "https://picsum.photos/300/300?random=1&grayscale", redraw: false },
    { id: 2, text: "I believe it lies to the east.", img: "https://picsum.photos/300/300?random=2&grayscale", redraw: false },
    { id: 3, text: "We must hurry before sunset.", img: "https://picsum.photos/300/300?random=3&grayscale", redraw: false },
    { id: 4, text: "Wait, I hear soldiers approaching!", img: "https://picsum.photos/300/300?random=4&grayscale", redraw: false },
  ]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [isRippleCalculating, setIsRippleCalculating] = useState(false);
  const [rippleStability, setRippleStability] = useState(100);
  const [rippleResult, setRippleResult] = useState<RippleResult | null>(null);
  const [showTipJar, setShowTipJar] = useState(false);

  const handlePanelClick = (id: number, currentText: string) => {
    setEditingId(id);
    setEditText(currentText);
  };

  const handleSaveCorrection = async () => {
    if (editingId === null) return;
    const originalPanel = panels.find(p => p.id === editingId);
    if (!originalPanel) return;
    const originalText = originalPanel.text;

    // 1. Close Modal & Start "Redraw" animation
    setEditingId(null);
    setPanels(prev => prev.map(p => p.id === editingId ? { ...p, redraw: true } : p));
    setIsRippleCalculating(true);
    setRippleResult(null);

    // 2. Update text visually after delay
    setTimeout(async () => {
        setPanels(prev => prev.map(p => p.id === editingId ? { ...p, text: editText, redraw: false } : p));
        
        // 3. Trigger Time Ripple Engine
        const ripple = await triggerTimeRipple(originalText, editText);
        setRippleResult(ripple);
        setRippleStability(prev => Math.max(0, prev + ripple.stabilityChange));
        setIsRippleCalculating(false);
    }, 1500);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
       <SectionHeader title="The Butterfly Effect" subtitle="Where Small Changes Rewrite History" />
       
       {/* Time Ripple Stability Gauge */}
       <div className="mb-6 border-4 border-double border-ink p-2 bg-paper-dark relative overflow-hidden">
          <div className="flex justify-between items-end mb-1 relative z-10">
            <span className="font-mono text-xs font-bold uppercase flex items-center gap-1">
               <Activity size={14} /> Chronometric Stability
            </span>
            <span className={`font-mono text-xl font-black ${rippleStability < 50 ? 'text-alert-red' : 'text-ink'}`}>
               {rippleStability}%
            </span>
          </div>
          <div className="h-4 w-full bg-ink/10 border border-ink relative z-10">
             <div 
               className={`h-full transition-all duration-1000 ease-out ${rippleStability < 40 ? 'bg-alert-red animate-pulse' : 'bg-ink'}`} 
               style={{ width: `${rippleStability}%` }}
             />
          </div>
          {/* Background Texture for Gauge */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 10px)'}}></div>
       </div>

       {/* Ripple Alert Card */}
       {rippleResult && (
          <div className="mb-6 bg-paper border-2 border-alert-red p-4 relative animate-in slide-in-from-top-4 fade-in duration-500 shadow-[4px_4px_0px_0px_#8a2be2]">
             <div className="absolute -top-3 left-4 bg-alert-red text-paper px-2 text-[10px] font-mono uppercase font-bold flex items-center gap-1">
                <Zap size={10} fill="currentColor" /> Temporal Shift Detected
             </div>
             <h4 className="font-serif text-xl font-bold mb-1 text-alert-red">Paradox Alert!</h4>
             <p className="font-body text-lg mb-2 leading-tight">
                "{rippleResult.consequence}"
             </p>
             <div className="border-t border-alert-red/30 pt-2 mt-2">
                <span className="font-mono text-[10px] text-ink-light uppercase">New Future Headline:</span>
                <p className="font-serif font-bold italic text-ink">{rippleResult.futureHeadline}</p>
             </div>
          </div>
       )}

       <div className="space-y-8">
          {/* Strip 1 */}
          <div className="newspaper-border bg-white p-2">
             <div className="flex justify-between border-b border-gray-300 mb-2 pb-1">
               <span className="font-mono text-[10px] uppercase">Episode 1: The Lost Scroll</span>
               <span className="font-mono text-[10px] uppercase">Difficulty: Novice</span>
             </div>
             <div className="grid grid-cols-2 gap-2">
               {panels.map(panel => (
                 <div 
                    key={panel.id} 
                    onClick={() => handlePanelClick(panel.id, panel.text)}
                    className="aspect-square border border-black relative overflow-hidden bg-gray-100 group cursor-pointer"
                 >
                    <img 
                       src={panel.img} 
                       className={`w-full h-full object-cover opacity-80 transition-all duration-1000 ${panel.redraw ? 'blur-sm scale-105' : ''}`} 
                       alt="Comic Panel" 
                    />
                    
                    {/* Redraw Loading Overlay */}
                    {panel.redraw && (
                       <div className="absolute inset-0 flex items-center justify-center z-20 bg-paper/60">
                          <RefreshCw className="animate-spin text-ink" size={32} />
                       </div>
                    )}

                    {/* Speech Bubble */}
                    <div className={`absolute top-2 left-2 right-2 bg-white border border-black rounded-xl p-2 shadow-sm transition-opacity ${panel.redraw ? 'opacity-0' : 'opacity-100'}`}>
                       <p className="font-body text-sm leading-tight text-center">{panel.text}</p>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-vintage-gold/90 p-1 translate-y-full group-hover:translate-y-0 transition-transform z-10">
                      <p className="text-[10px] font-mono text-center font-bold text-ink">Tap to Rewrite History</p>
                    </div>
                 </div>
               ))}
             </div>
             
             {/* Status Footer */}
             {isRippleCalculating && (
               <div className="mt-2 flex items-center justify-center gap-2 text-xs font-mono animate-pulse text-sepia-accent">
                  <Compass size={14} className="animate-spin" /> Calculating Butterfly Effect...
               </div>
             )}
          </div>
       </div>

       {/* Discreet Tip Jar */}
       <div className="mt-8 flex flex-col items-center">
          <button 
            onClick={() => setShowTipJar(!showTipJar)}
            className="text-ink-light hover:text-sepia-accent flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
          >
             <Coffee size={16} />
             <span className="font-mono text-[10px] uppercase tracking-widest">Support the Press</span>
          </button>

          {showTipJar && (
             <div className="mt-4 p-4 bg-paper border border-ink shadow-md max-w-xs text-center animate-in fade-in slide-in-from-bottom-2">
                <p className="font-serif italic mb-2">"Ink costs money, but time is priceless."</p>
                <p className="font-body text-sm mb-2">Thank you for keeping the chronometer running.</p>
                <div className="bg-vintage-gold/20 border border-dashed border-ink p-2 font-mono text-xs text-ink-light cursor-not-allowed">
                   [Donation Link Placeholder]
                </div>
             </div>
          )}
       </div>

       {/* Editor Modal */}
       {editingId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <div className="bg-paper border-4 border-double border-ink w-full max-w-md p-6 relative shadow-2xl">
                <h3 className="font-serif text-2xl font-bold mb-4 border-b border-ink pb-2">Editor's Correction</h3>
                <p className="font-mono text-xs text-ink-light mb-2 uppercase">Original Text:</p>
                <p className="font-body italic text-gray-500 mb-4">"{panels.find(p => p.id === editingId)?.text}"</p>
                
                <p className="font-mono text-xs text-ink mb-1 uppercase font-bold">New Dialogue:</p>
                <textarea 
                   value={editText}
                   onChange={(e) => setEditText(e.target.value)}
                   className="w-full h-24 bg-white border-2 border-ink p-2 font-body text-lg focus:outline-none focus:border-sepia-accent mb-6"
                   autoFocus
                />
                
                <div className="flex gap-4">
                   <button onClick={() => setEditingId(null)} className="flex-1 border border-ink py-2 font-mono text-xs uppercase hover:bg-gray-200">Cancel</button>
                   <button onClick={handleSaveCorrection} className="flex-1 bg-ink text-paper py-2 font-mono text-xs uppercase font-bold hover:bg-sepia-accent flex items-center justify-center gap-2">
                      <Zap size={14} /> Commit Change
                   </button>
                </div>
                <div className="absolute -top-2 -right-2 bg-vintage-gold text-ink font-mono text-[10px] px-2 py-1 border border-ink transform rotate-3">
                   RIFT RISK: HIGH
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

// 5. DISCOVERY EDITOR (Tools)
const DiscoveryEditor: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [mode, setMode] = useState<'MENU' | 'MAP' | 'TIMELINE' | 'CHAOS' | 'CAMERA'>('MENU');
  // Map State
  const [mapQuery, setMapQuery] = useState('');
  const [mapResult, setMapResult] = useState<{text: string, location?: {title: string, uri: string}} | null>(null);
  const [loadingMap, setLoadingMap] = useState(false);
  // Timeline State
  const [timelineTopic, setTimelineTopic] = useState('');
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  // Chaos State
  const [chaosPuzzle, setChaosPuzzle] = useState<ChaosPuzzle | null>(null);
  const [loadingChaos, setLoadingChaos] = useState(false);
  const [chaosResolved, setChaosResolved] = useState(false);
  const [wrongAnswer, setWrongAnswer] = useState(false);
  // Camera State
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [flashMode, setFlashMode] = useState<'AUTO' | 'ON' | 'OFF'>('AUTO');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleSearch = async () => {
    if (!mapQuery) return;
    setLoadingMap(true);
    const res = await exploreLocation(mapQuery);
    setMapResult(res);
    setLoadingMap(false);
  };

  const handleTimelineGen = async () => {
    if (!timelineTopic) return;
    setLoadingTimeline(true);
    const events = await generateTimeline(timelineTopic);
    setTimelineEvents(events);
    setLoadingTimeline(false);
  }

  const initChaos = async () => {
    setLoadingChaos(true);
    setChaosPuzzle(null);
    setChaosResolved(false);
    setWrongAnswer(false);
    const puzzle = await generateChaosPuzzle();
    setChaosPuzzle(puzzle);
    setLoadingChaos(false);
  }

  const handleChaosAnswer = (index: number) => {
    if (!chaosPuzzle) return;
    if (index === chaosPuzzle.correctAnswerIndex) {
      setChaosResolved(true);
      setWrongAnswer(false);
    } else {
      setWrongAnswer(true);
      setTimeout(() => setWrongAnswer(false), 1000);
    }
  }

  const startCamera = async () => {
    try {
      let stream;
      try {
        // Attempt to use the rear camera (environment) first for the best "scanner" experience
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      } catch (envError) {
        // Fallback for laptops or devices without a specific rear camera
        console.warn("Environment camera unavailable, falling back to default.", envError);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      
      setCameraStream(stream);
      setMode('CAMERA');
      setCapturedPhoto(null);
      setZoomLevel(1);
    } catch (err) {
      console.error("Camera error", err);
      alert("Camera access failed. Please ensure you have a camera connected and permissions granted.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const toggleFlash = () => {
      if (flashMode === 'AUTO') setFlashMode('ON');
      else if (flashMode === 'ON') setFlashMode('OFF');
      else setFlashMode('AUTO');
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      const video = videoRef.current;
      
      if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
        
        // Handle Flash Logic
        if (flashMode === 'ON' || (flashMode === 'AUTO' && Math.random() > 0.5)) {
            setIsFlashing(true);
            setTimeout(() => setIsFlashing(false), 200);
        }

        // Handle Digital Zoom Crop
        // We need to draw only the center portion of the video based on zoomLevel
        const sWidth = video.videoWidth;
        const sHeight = video.videoHeight;
        const sX = (sWidth - (sWidth / zoomLevel)) / 2;
        const sY = (sHeight - (sHeight / zoomLevel)) / 2;
        
        context.drawImage(
            video, 
            sX, sY, sWidth / zoomLevel, sHeight / zoomLevel, // Source Crop
            0, 0, canvasRef.current.width, canvasRef.current.height // Destination
        );
        
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(dataUrl);
        // Stop stream
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  useEffect(() => {
    if (mode === 'CAMERA' && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [mode, cameraStream]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    }
  }, []);

  // --- MAP VIEW ---
  if (mode === 'MAP') {
    return (
      <div className="p-4 max-w-3xl mx-auto h-[calc(100vh-120px)] flex flex-col relative">
         <div className="absolute inset-0 border-4 border-double border-ink bg-[#e6dccf] overflow-hidden rounded-sm shadow-inner">
            {/* Fake Map Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{
                    backgroundImage: 'linear-gradient(#2c2c2c 1px, transparent 1px), linear-gradient(90deg, #2c2c2c 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                 }} 
            />
            {/* SVG Coastline Decoration (Abstract) */}
            <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none text-sepia-accent" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 20 Q 30 40, 50 20 T 100 50 V 100 H 0 Z" fill="currentColor" />
                <path d="M0 0 H 100 V 10 H 0 Z" fill="currentColor" />
            </svg>

            {/* UI Overlay */}
            <div className="relative z-10 p-4 h-full flex flex-col">
                {/* Top Bar */}
                <div className="flex items-center gap-2 mb-4 bg-paper/90 border border-ink p-2 shadow-md">
                   <button onClick={() => setMode('MENU')} className="p-2 hover:bg-ink hover:text-paper transition-colors">
                      <ArrowLeft size={20} />
                   </button>
                   <input 
                      value={mapQuery}
                      onChange={(e) => setMapQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Coordinates or Place Name..."
                      className="flex-1 bg-transparent border-none outline-none font-mono text-sm placeholder:italic"
                   />
                   <button onClick={handleSearch} className="p-2 text-ink hover:text-sepia-accent" disabled={loadingMap}>
                      <Compass size={20} className={loadingMap ? "animate-spin" : ""} />
                   </button>
                </div>

                {/* Result Card */}
                {mapResult && (
                   <div className="mt-auto mb-4 bg-paper border-2 border-ink p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-[60%] overflow-y-auto relative rotate-1">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ink text-paper px-3 py-1 text-[10px] font-mono uppercase tracking-widest">
                         Field Notes
                      </div>
                      <h3 className="font-serif text-2xl font-bold mb-2 flex items-center gap-2">
                         <MapPin className="text-sepia-accent" size={24} fill="currentColor" />
                         {mapResult.location?.uri ? (
                            <a 
                               href={mapResult.location.uri} 
                               target="_blank" 
                               rel="noreferrer"
                               className="underline decoration-dashed underline-offset-4 decoration-ink/40 hover:text-sepia-accent hover:decoration-sepia-accent transition-all"
                               title="Open in Google Maps"
                            >
                                {mapResult.location.title || mapQuery}
                            </a>
                         ) : (
                            <span>{mapResult.location?.title || mapQuery}</span>
                         )}
                      </h3>
                      <p className="font-body text-lg leading-snug text-justify mb-3">
                         {mapResult.text}
                      </p>
                      {mapResult.location?.uri && (
                         <div className="text-right">
                             <a href={mapResult.location.uri} target="_blank" rel="noreferrer" className="text-xs font-mono underline hover:text-sepia-accent">
                                View Survey Data ↗
                             </a>
                         </div>
                      )}
                   </div>
                )}
            </div>
         </div>
      </div>
    );
  }

  // --- TIMELINE VIEW ---
  if (mode === 'TIMELINE') {
    return (
      <div className="p-4 max-w-3xl mx-auto min-h-[calc(100vh-120px)] flex flex-col">
        <SectionHeader title="Timeline Generator" subtitle="Chronicles of the Ages" />
        
        <div className="flex items-center gap-2 mb-6">
           <button onClick={() => setMode('MENU')} className="p-2 border border-ink hover:bg-ink hover:text-paper">
              <ArrowLeft size={20} />
           </button>
           <input 
              value={timelineTopic}
              onChange={(e) => setTimelineTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTimelineGen()}
              placeholder="Enter Topic (e.g. Life of Tesla)..."
              className="flex-1 bg-paper border border-ink p-2 font-mono text-sm focus:outline-none focus:border-sepia-accent shadow-inner"
           />
           <button onClick={handleTimelineGen} disabled={loadingTimeline} className="bg-ink text-paper px-4 py-2 font-mono uppercase text-xs hover:bg-sepia-accent">
              {loadingTimeline ? "Inking..." : "Generate"}
           </button>
        </div>

        <div className="flex-1 relative pl-4 border-l-2 border-dashed border-ink/30 space-y-8 pb-10">
           {timelineEvents.length === 0 && !loadingTimeline && (
              <div className="text-ink-light italic font-serif opacity-60 pt-10 pl-4">
                "History is waiting to be written..."
              </div>
           )}

           {timelineEvents.map((event, index) => (
              <div key={index} className="relative pl-6 animate-in slide-in-from-bottom-2 duration-500" style={{animationDelay: `${index * 100}ms`}}>
                 {/* Node on the line */}
                 <div className="absolute -left-[21px] top-3 w-4 h-4 rounded-full bg-paper border-4 border-ink z-10"></div>
                 
                 {/* Card */}
                 <div className="bg-paper border border-ink p-4 shadow-[3px_3px_0px_0px_rgba(44,44,44,0.2)] hover:shadow-[5px_5px_0px_0px_rgba(44,44,44,0.4)] transition-shadow relative group">
                    <div className="absolute top-0 right-0 bg-ink text-paper px-2 py-1 text-xs font-mono font-bold">
                       {event.year}
                    </div>
                    <h4 className="font-serif text-xl font-bold mt-4 mb-1 group-hover:text-sepia-accent transition-colors">{event.title}</h4>
                    <p className="font-body text-md leading-tight text-ink-light">{event.description}</p>
                 </div>
              </div>
           ))}
        </div>
      </div>
    );
  }

  // --- CHAOS GAME VIEW ---
  if (mode === 'CHAOS') {
    return (
      <div className="p-4 max-w-3xl mx-auto min-h-[calc(100vh-120px)] flex flex-col relative overflow-hidden">
         {/* Glitchy Background */}
         <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
             <div className="absolute top-10 left-10 w-full h-2 bg-alert-red transform -rotate-3"></div>
             <div className="absolute top-40 right-0 w-full h-1 bg-ink transform rotate-6"></div>
             <div className="absolute bottom-20 left-20 w-32 h-32 border-4 border-alert-red rounded-full opacity-30"></div>
         </div>

         <div className="relative z-10">
           <div className="flex items-center gap-2 mb-6">
             <button onClick={() => setMode('MENU')} className="p-2 border border-ink hover:bg-ink hover:text-paper bg-paper">
                <ArrowLeft size={20} />
             </button>
             <h2 className="font-mono text-xl uppercase font-black text-alert-red tracking-widest animate-pulse flex-1 text-center bg-paper border-y-2 border-alert-red">
               ⚠ TIMELINE FRACTURE ⚠
             </h2>
           </div>

           {loadingChaos || !chaosPuzzle ? (
             <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <RotateCcw className="animate-spin text-alert-red" size={48} />
                <p className="font-mono text-sm text-alert-red">SCANNING CHRONOMETRIC FAULTS...</p>
             </div>
           ) : chaosResolved ? (
             <div className="animate-in zoom-in duration-500 text-center p-8 bg-paper border-4 border-ink shadow-2xl mt-10">
                <div className="inline-block p-4 bg-vintage-gold rounded-full mb-4 border-2 border-ink">
                  <Star size={48} className="text-paper fill-current" />
                </div>
                <h3 className="font-serif text-3xl font-bold mb-2">ORDER RESTORED!</h3>
                <p className="font-body text-xl mb-6">{chaosPuzzle.restorationMessage}</p>
                <button onClick={initChaos} className="bg-ink text-paper px-8 py-3 font-mono font-bold uppercase hover:bg-sepia-accent transition-colors">
                   FIX ANOTHER GLITCH
                </button>
             </div>
           ) : (
             <div className={`space-y-6 transition-all duration-300 ${wrongAnswer ? 'translate-x-2 text-alert-red' : ''}`}>
                <div className="newspaper-border bg-paper p-6 shadow-[8px_8px_0px_0px_#8a2be2] transform rotate-[-1deg]">
                   <div className="border-b-2 border-dashed border-ink mb-4 pb-2 flex justify-between items-center">
                      <span className="font-mono text-xs font-bold bg-alert-red text-paper px-2">ANOMALY DETECTED</span>
                      <span className="font-serif italic">Current Year: {chaosPuzzle.currentEra}</span>
                   </div>
                   <h1 className="font-serif text-4xl font-black leading-none mb-4 uppercase">{chaosPuzzle.headline}</h1>
                   <p className="font-body text-xl leading-snug text-justify mb-4 border-l-4 border-ink pl-4">
                      {chaosPuzzle.scenario}
                   </p>
                   
                   <div className="bg-black/5 p-4 border border-ink mt-6">
                      <div className="flex items-center gap-2 mb-2 font-mono text-xs font-bold uppercase text-sepia-accent">
                         <HelpCircle size={14} /> Challenge
                      </div>
                      <p className="font-serif text-lg font-bold mb-4">{chaosPuzzle.challengeQuestion}</p>
                      <div className="grid grid-cols-1 gap-3">
                         {chaosPuzzle.options.map((opt, idx) => (
                           <button 
                             key={idx} 
                             onClick={() => handleChaosAnswer(idx)}
                             className="text-left p-3 border-2 border-ink hover:bg-ink hover:text-paper transition-colors font-mono text-sm"
                           >
                             {String.fromCharCode(65 + idx)}. {opt}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
           )}
         </div>
      </div>
    );
  }

  // --- CAMERA VIEW ---
  if (mode === 'CAMERA') {
      return (
        <div className="p-4 max-w-3xl mx-auto min-h-[calc(100vh-120px)] flex flex-col relative bg-black">
            {/* Vintage Bezel */}
            <div className="flex items-center justify-between p-2 bg-[#2c2c2c] text-paper border-b border-gray-600 z-20">
                 <button onClick={() => { stopCamera(); setMode('MENU'); }} className="p-2 hover:text-alert-red">
                    <ArrowLeft />
                 </button>
                 <div className="flex items-center gap-4">
                    <span className="font-mono text-xs uppercase tracking-[0.2em] hidden md:block">Timension Optical</span>
                    <button onClick={toggleFlash} className="flex items-center gap-1 text-[10px] font-mono border border-white/20 px-2 py-1 rounded hover:bg-white/10 transition-colors">
                        {flashMode === 'AUTO' && <Zap size={12} className="text-yellow-400" />}
                        {flashMode === 'ON' && <Zap size={12} className="text-white fill-current" />}
                        {flashMode === 'OFF' && <ZapOff size={12} className="text-gray-400" />}
                        <span>{flashMode}</span>
                    </button>
                 </div>
            </div>

            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#1a1a1a]">
                
                {/* Flash Overlay */}
                <div className={`absolute inset-0 bg-white z-50 transition-opacity duration-500 pointer-events-none ${isFlashing ? 'opacity-100' : 'opacity-0'}`}></div>

                {/* Viewfinder or Result */}
                {capturedPhoto ? (
                    <div className="relative p-4 bg-paper border-8 border-white shadow-2xl transform rotate-1 max-w-full">
                        <div className="relative overflow-hidden filter sepia contrast-125 brightness-90 grayscale-[0.5]">
                           <img src={capturedPhoto} alt="Vintage Capture" className="w-full h-auto" />
                           {/* Scratches Overlay */}
                           <div className="absolute inset-0 pointer-events-none opacity-30 bg-[url('https://www.transparenttextures.com/patterns/scratched-paper.png')]"></div>
                        </div>
                        <div className="mt-4 text-center">
                            <p className="font-serif font-bold text-2xl text-ink">The Daily Chronicle</p>
                            <p className="font-mono text-[10px] uppercase tracking-widest mt-1 border-t border-ink pt-1 inline-block">
                                {new Date().toLocaleDateString()} • VOL. I
                            </p>
                            <p className="font-body italic mt-2 text-ink-light">"A moment frozen in the river of time."</p>
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                         <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="absolute inset-0 w-full h-full object-cover filter sepia-[0.3] contrast-125 grayscale-[0.3] transition-transform duration-200"
                            style={{ transform: `scale(${zoomLevel})` }}
                         />
                         {/* Viewfinder overlay */}
                         <div className="absolute inset-0 border-[20px] border-black/50 pointer-events-none z-10"></div>
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-50">
                             <div className="w-64 h-64 border-2 border-white/50 rounded-sm relative">
                                {/* Crosshair */}
                                <div className="absolute top-1/2 left-1/2 w-4 h-0.5 bg-white/50 -translate-x-1/2 -translate-y-1/2"></div>
                                <div className="absolute top-1/2 left-1/2 h-4 w-0.5 bg-white/50 -translate-x-1/2 -translate-y-1/2"></div>
                             </div>
                         </div>
                         
                         {/* Zoom Controls Overlay */}
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 bg-black/50 p-2 rounded-full backdrop-blur-sm">
                            <button 
                                onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.5))}
                                className="p-2 text-white hover:text-vintage-gold transition-colors"
                            >
                                <ZoomIn size={20} />
                            </button>
                            <div className="w-1 h-16 bg-white/20 mx-auto rounded-full relative">
                                <div 
                                    className="absolute bottom-0 left-0 w-full bg-vintage-gold rounded-full transition-all duration-200"
                                    style={{ height: `${((zoomLevel - 1) / 2) * 100}%` }}
                                ></div>
                            </div>
                            <button 
                                onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))}
                                className="p-2 text-white hover:text-vintage-gold transition-colors"
                            >
                                <ZoomOut size={20} />
                            </button>
                         </div>
                         
                         <canvas ref={canvasRef} className="hidden" />
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-[#2c2c2c] p-6 flex justify-center items-center gap-8 z-20 border-t border-gray-600 relative">
                {capturedPhoto ? (
                    <>
                      <button onClick={retakePhoto} className="text-paper font-mono text-xs uppercase flex flex-col items-center gap-2 hover:text-sepia-accent">
                         <RotateCcw size={24} /> Discard
                      </button>
                      <button onClick={() => { stopCamera(); setMode('MENU'); }} className="text-paper font-mono text-xs uppercase flex flex-col items-center gap-2 hover:text-vintage-gold">
                         <Stamp size={24} /> Publish
                      </button>
                    </>
                ) : (
                    <button 
                        onClick={takePhoto}
                        className="w-20 h-20 rounded-full bg-gray-200 border-4 border-gray-400 shadow-inner flex items-center justify-center active:scale-95 transition-transform relative"
                    >
                        <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border-2 border-gray-600"></div>
                    </button>
                )}
            </div>
        </div>
      );
  }

  // --- MENU VIEW ---
  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <SectionHeader title="Editor's Desk" subtitle="Create Your Own History" />
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button onClick={startCamera} className="p-6 border-2 border-black hover:bg-ink hover:text-paper transition-all flex flex-col items-center gap-3 group">
           <Camera size={32} />
           <span className="font-serif font-bold text-center">Magic Camera</span>
           <span className="text-[10px] font-mono opacity-0 group-hover:opacity-100">Photo → Vintage Print</span>
        </button>
        <button onClick={() => setMode('MAP')} className="p-6 border-2 border-black hover:bg-ink hover:text-paper transition-all flex flex-col items-center gap-3 group">
           <Map size={32} />
           <span className="font-serif font-bold text-center">Map Explorer</span>
           <span className="text-[10px] font-mono opacity-0 group-hover:opacity-100">Chart the Unknown</span>
        </button>
        <button onClick={() => setMode('TIMELINE')} className="p-6 border-2 border-black hover:bg-ink hover:text-paper transition-all flex flex-col items-center gap-3 group">
           <History size={32} />
           <span className="font-serif font-bold text-center">Timeline Gen</span>
           <span className="text-[10px] font-mono opacity-0 group-hover:opacity-100">Visualize Epochs</span>
        </button>
        <button onClick={() => { setMode('CHAOS'); if(!chaosPuzzle) initChaos(); }} className="p-6 border-2 border-alert-red hover:bg-alert-red hover:text-paper transition-all flex flex-col items-center gap-3 group relative overflow-hidden">
           <AlertTriangle size={32} className="text-alert-red group-hover:text-paper" />
           <span className="font-serif font-bold text-center text-alert-red group-hover:text-paper">Eras in Chaos</span>
           <span className="text-[10px] font-mono opacity-0 group-hover:opacity-100">Fix the Timeline!</span>
        </button>
      </div>

      <div className="newspaper-border p-4 bg-paper-dark/20 mb-8">
         <h3 className="font-serif text-xl font-bold mb-2">Unwritten Pages</h3>
         <p className="font-body mb-4">The ink bottle is full, but the page is empty. Describe a historical "What If" scenario...</p>
         <textarea 
            className="w-full h-32 bg-transparent border border-black p-2 font-mono text-sm resize-none focus:outline-none focus:bg-white/50"
            placeholder="e.g., What if Da Vinci invented the airplane in 1500?"
         ></textarea>
         <button className="w-full mt-2 bg-ink text-paper py-2 font-mono uppercase text-xs hover:bg-sepia-accent">
            Generate Story
         </button>
      </div>

      <div className="border-t-2 border-ink pt-4 flex justify-center">
        <button onClick={onLogout} className="flex items-center gap-2 font-mono text-xs uppercase hover:text-alert-red transition-colors opacity-70">
           <LogOut size={14} /> Revoke Press Pass (Sign Out)
        </button>
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<AppSection>(AppSection.HOME);
  const [session, setSession] = useState<any>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    // Guard: If auth is not configured, skip Supabase calls
    if (!isAuthConfigured()) {
      setIsAuthChecked(true);
      return;
    }

    // Check active session
    // Added error handling to prevent crash on network failure
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthChecked(true);
    }).catch((err) => {
      console.warn("Auth session check failed (likely network or config issue):", err);
      // Fallback to ensure app loads even if auth server is unreachable
      setIsAuthChecked(true); 
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (isAuthConfigured()) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setCurrentSection(AppSection.HOME);
    setIsProfileOpen(false);
  };

  if (!session && isAuthChecked) {
     return (
       <div className="min-h-screen w-full bg-paper text-ink font-serif relative overflow-hidden">
          <OldPaperTexture />
          <div className="relative z-10">
             <LoginView onLogin={() => setSession({ user: { email: 'demo@timension.com' } })} />
          </div>
       </div>
     );
  }

  // Show loading or login screen until check is done
  if (!isAuthChecked) {
     return (
       <div className="min-h-screen w-full bg-paper text-ink font-serif relative flex items-center justify-center">
         <OldPaperTexture />
         <div className="relative z-10 text-center animate-pulse">
           <h1 className="font-serif text-4xl mb-2">Timension</h1>
           <p className="font-mono text-sm">Verifying Credentials...</p>
         </div>
       </div>
     )
  }

  return (
    <div className="min-h-screen w-full bg-paper text-ink font-serif relative overflow-x-hidden">
      <OldPaperTexture />
      
      <div className="relative z-10">
        {/* Top Sticky Brand (Mobile Optimized) */}
        <div className="sticky top-0 bg-paper/95 backdrop-blur-sm z-30 border-b border-ink shadow-sm p-2 flex justify-between items-center px-4">
           <div className="w-8"></div> {/* Spacer for balance */}
           <span className="font-serif font-black text-2xl tracking-tighter">TIMENSION</span>
           <button 
             onClick={() => setIsProfileOpen(true)}
             className="w-8 h-8 rounded-full border border-ink flex items-center justify-center hover:bg-vintage-gold/20 transition-colors"
           >
             <User size={18} />
           </button>
        </div>

        <main className="pt-4">
          {currentSection === AppSection.HOME && <FrontPage />}
          {currentSection === AppSection.PORTALS && <TimePortals />}
          {currentSection === AppSection.MENTORS && <MentorChat />}
          {currentSection === AppSection.CHRONICLE && <Chronicle />}
          {currentSection === AppSection.EDITOR && <DiscoveryEditor onLogout={handleLogout} />}
        </main>

        {/* User Profile Overlay */}
        <TravelerVault 
           isOpen={isProfileOpen} 
           onClose={() => setIsProfileOpen(false)} 
           userEmail={session?.user?.email || 'traveler@timension.com'}
           onLogout={handleLogout}
        />

        <Navigation currentSection={currentSection} onNavigate={setCurrentSection} />
      </div>
    </div>
  );
};

export default App;
