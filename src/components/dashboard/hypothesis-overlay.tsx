"use client";

import { useEffect, useRef } from 'react';
import { X, Filter, Heart, ArrowRight } from 'lucide-react';
import type { DashboardStats } from '@/services/dashboard-data-service';

interface HypothesisOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  researchStats?: DashboardStats['researchStats'];
}

// Mock hypothesis data - in real implementation this would come from an API
const mockHypotheses = [
  {
    id: 1265,
    title: "SIRT6-mediated DNA repair efficiency in centenarians",
    favorites: 123,
    isFavorited: true
  },
  {
    id: 1264,
    title: "Mitochondrial uncoupling via UCP2 in aged neurons",
    favorites: 123,
    isFavorited: false
  },
  {
    id: 1263,
    title: "Rapamycin-induced autophagy in senescent fibroblasts",
    favorites: 123,
    isFavorited: true
  },
  {
    id: 1262,
    title: "Telomerase reactivation in post-mitotic tissues",
    favorites: 123,
    isFavorited: true
  },
  {
    id: 1261,
    title: "FOXO3A polymorphism correlation with extreme longevity",
    favorites: 123,
    isFavorited: false
  },
  {
    id: 1260,
    title: "CRISPRa activation of Klotho expression in vivo",
    favorites: 123,
    isFavorited: true
  },
  {
    id: 1259,
    title: "NAD⁺ salvage pathway efficiency under caloric restriction",
    favorites: 123,
    isFavorited: true
  },
  {
    id: 1258,
    title: "Microbiome-derived butyrate impacts on inflammaging",
    favorites: 123,
    isFavorited: true
  },
  {
    id: 1257,
    title: "Thymic regeneration via IL-7 cytokine modulation",
    favorites: 123,
    isFavorited: false
  },
  {
    id: 1256,
    title: "LIF-1 signaling disruption in age-related stem cell decline",
    favorites: 123,
    isFavorited: true
  },
  {
    id: 1255,
    title: "CD38 inhibition restores NAD⁺ in aged muscle",
    favorites: 123,
    isFavorited: true
  },
  {
    id: 1254,
    title: "Mitochondrial biogenesis enhancement via PGC-1α",
    favorites: 123,
    isFavorited: true
  },
  {
    id: 1253,
    title: "Senolytic clearance of p16⁺ astrocytes in hippocampus",
    favorites: 123,
    isFavorited: true
  },
  {
    id: 1252,
    title: "Epigenetic clock reset via TET enzyme modulation",
    favorites: 123,
    isFavorited: true
  },
  {
    id: 1251,
    title: "2.0 min ATOM-driven autophagy in Lamin A/C stabilization in progeroid syndromes",
    favorites: 123,
    isFavorited: true
  },
  {
    id: 1250,
    title: "SIRT6-mediated DNA repair efficiency in centenarians",
    favorites: 123,
    isFavorited: true
  },
  {
    id: 1249,
    title: "Mitochondrial uncoupling via UCP2 in aged neurons",
    favorites: 123,
    isFavorited: false
  },
  {
    id: 1248,
    title: "Rapamycin-induced autophagy in senescent fibroblasts",
    favorites: 123,
    isFavorited: true
  },
  {
    id: 1247,
    title: "Telomerase reactivation in post-mitotic tissues",
    favorites: 123,
    isFavorited: true
  },
  {
    id: 1246,
    title: "FOXO3A polymorphism correlation with extreme longevity",
    favorites: 123,
    isFavorited: true
  },
  {
    id: 1245,
    title: "CRISPRa activation of Klotho expression in vivo",
    favorites: 123,
    isFavorited: true
  },
  {
    id: 1244,
    title: "NAD⁺ salvage pathway efficiency under caloric restriction",
    favorites: 123,
    isFavorited: true
  }
];

export function HypothesisOverlay({ isOpen, onClose, researchStats }: HypothesisOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle hypothesis click
  const handleHypothesisClick = (hypothesisId: number) => {
    console.log(`Clicked hypothesis #${hypothesisId}`);
    // In a real implementation, this would navigate to the hypothesis detail page
    // or open a detailed view
  };

  // Handle favorite toggle
  const handleFavoriteToggle = (hypothesisId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the hypothesis click
    console.log(`Toggled favorite for hypothesis #${hypothesisId}`);
    // In a real implementation, this would call an API to toggle the favorite status
  };

  if (!isOpen) return null;

  const formatHypothesisNumber = () => {
    if (!researchStats) return "#1,265";
    return `#${researchStats.hypothesisCount.toLocaleString()}`;
  };

  const getHypothesisPreview = () => {
    if (!researchStats?.latestHypothesis) {
      return "2.0 min ATOM-driven autophagy in microglia";
    }
    return researchStats.latestHypothesis.statement;
  };

  return (
    <div className="absolute top-full left-0 right-0 z-50 bg-black border border-white/20 shadow-2xl">
      <div 
        ref={overlayRef}
        className="bg-black flex flex-col"
        style={{ height: '400px' }}
      >
        {/* Header Section */}
        <div className="flex items-center justify-between p-3 border-b border-white/20 flex-shrink-0">
          <div className="flex items-center gap-3 text-sm flex-1 min-w-0">
            <span className="text-[#757575] font-red-hat-mono font-normal leading-[0.9] flex-shrink-0">
              Last hypothesis {formatHypothesisNumber()} generated
            </span>
            <span className="text-[#E9FF98] font-red-hat-mono font-normal leading-[0.9] flex-shrink-0">•</span>
            <span className="text-white font-red-hat-mono font-normal leading-[0.9] truncate min-w-0">
              {getHypothesisPreview()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-end gap-6 p-3 border-b border-white/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[#757575] font-red-hat-mono text-sm">filter</span>
            <Filter className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#757575] font-red-hat-mono text-sm">filter</span>
            <Filter className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Hypotheses List */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-0">
            {mockHypotheses.slice(0, 12).map((hypothesis) => (
              <div
                key={hypothesis.id}
                className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-b-0"
                onClick={() => handleHypothesisClick(hypothesis.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-[#757575] font-red-hat-mono text-sm min-w-[120px] flex-shrink-0">
                    hypothesis #{hypothesis.id.toLocaleString()}
                  </span>
                  <span className="text-[#E9FF98] font-red-hat-mono text-sm flex-shrink-0">•</span>
                  <div 
                    className="flex items-center gap-1 flex-shrink-0"
                    onClick={(e) => handleFavoriteToggle(hypothesis.id, e)}
                  >
                    <Heart 
                      className={`w-4 h-4 ${hypothesis.isFavorited ? 'text-[#D0E38A] fill-[#D0E38A]' : 'text-[#D0E38A]'}`} 
                    />
                    <span className="text-[#D0E38A] font-red-hat-mono text-sm">
                      {hypothesis.favorites}
                    </span>
                  </div>
                  <span className="text-white font-red-hat-mono text-sm flex-1 min-w-0 truncate">
                    {hypothesis.title}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#757575] flex-shrink-0 ml-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
