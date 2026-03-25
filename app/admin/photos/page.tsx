'use client';

import { useEffect, useState } from 'react';
import {
  Camera, Search, X, ChevronLeft, ChevronRight, Download,
  Filter, ZoomIn, Image,
} from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  type: string;
  caption: string | null;
  created_at: string;
  job: {
    id: string;
    address: string;
    customer: { name: string };
  };
}

const PHOTO_TYPES = ['ALL', 'BEFORE', 'DURING', 'AFTER', 'INSPECTION', 'OTHER'];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (typeFilter !== 'ALL') params.set('type', typeFilter);
    fetch(`/api/admin/photos?${params}`)
      .then(r => r.json())
      .then(d => { setPhotos(d.photos || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, typeFilter]);

  const openLightbox = (idx: number) => setLightboxIdx(idx);
  const closeLightbox = () => setLightboxIdx(null);
  const prevPhoto = () => setLightboxIdx(i => i !== null ? (i - 1 + photos.length) % photos.length : null);
  const nextPhoto = () => setLightboxIdx(i => i !== null ? (i + 1) % photos.length : null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightboxIdx === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIdx, photos.length]);

  const currentPhoto = lightboxIdx !== null ? photos[lightboxIdx] : null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-700 rounded-xl">
          <Camera className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Photos</h1>
          <p className="text-gray-400 text-sm mt-0.5">{photos.length} photos</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by address, customer..."
            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {PHOTO_TYPES.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                typeFilter === t ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
              }`}>{t === 'ALL' ? 'All Types' : t}</button>
          ))}
        </div>
      </div>

      {/* Photo Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-800 border border-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
          <Image className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No photos found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, idx) => (
            <div key={photo.id} onClick={() => openLightbox(idx)}
              className="group relative aspect-square bg-gray-800 border border-gray-700 rounded-xl overflow-hidden cursor-pointer hover:border-blue-500 transition-colors">
              <img src={photo.url} alt={photo.caption || 'Photo'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-white text-xs font-semibold truncate">{photo.job.customer.name}</div>
                <div className="text-gray-300 text-xs truncate">{photo.job.address}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-blue-700 text-white">{photo.type}</span>
                  <span className="text-gray-400 text-xs">{fmtDate(photo.created_at)}</span>
                </div>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-1.5 bg-black/50 rounded-lg">
                  <ZoomIn className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && currentPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}>
          <button onClick={e => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors z-10">
            <X className="w-5 h-5" />
          </button>
          <button onClick={e => { e.stopPropagation(); prevPhoto(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors z-10">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={e => { e.stopPropagation(); nextPhoto(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors z-10">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="max-w-5xl max-h-[85vh] relative" onClick={e => e.stopPropagation()}>
            <img src={currentPhoto.url} alt={currentPhoto.caption || 'Photo'}
              className="max-w-full max-h-[85vh] object-contain rounded-lg" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
              <div className="text-white font-semibold">{currentPhoto.job.customer.name}</div>
              <div className="text-gray-300 text-sm">{currentPhoto.job.address}</div>
              <div className="flex items-center gap-3 mt-1">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-700 text-white">{currentPhoto.type}</span>
                <span className="text-gray-400 text-xs">{fmtDate(currentPhoto.created_at)}</span>
                {currentPhoto.caption && <span className="text-gray-300 text-xs">{currentPhoto.caption}</span>}
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-400 text-sm">
            {lightboxIdx + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}
