'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Clock, Gift } from 'lucide-react';
import { motion } from 'framer-motion';

interface ClosurePageProps {
  showCountdown?: boolean;
}

export default function ClosurePage({ showCountdown = false }: ClosurePageProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Header Image */}
          <div className="mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative mx-auto w-72 h-72 mb-6"
            >
              {/* Decorative Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-red-200 rounded-full opacity-20 animate-pulse"></div>
              
              {/* Main Image Container */}
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-2xl">
                <img
                  src="/images/farewell/bandung-farewell.svg"
                  alt="Bandung Farewell"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to a gradient if image not found
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                          <div class="text-white text-center">
                            <div class="text-6xl mb-4">🏔️</div>
                            <div class="text-xl font-bold">Bandung</div>
                            <div class="text-sm">Tercinta</div>
                          </div>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
              
              {/* Floating Elements */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-4 -right-4 w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center text-white text-xl shadow-lg"
              >
                🎉
              </motion.div>
              
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-4 -left-4 w-12 h-12 bg-red-400 rounded-full flex items-center justify-center text-white text-xl shadow-lg"
              >
                ❤️
              </motion.div>
            </motion.div>
          </div>

          {/* Main Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl">
              <CardContent className="p-8 md:p-12">
                <div className="space-y-6">
                  {/* Title */}
                  <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
                  >
                    Pemesanan Oleh-oleh Bandung
                    <br />
                    <span className="text-red-600">Telah Ditutup</span>
                  </motion.h1>

                  {/* Countdown (if needed) */}
                  {showCountdown && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.8 }}
                      className="bg-gradient-to-r from-orange-100 to-red-100 rounded-lg p-4 mb-6"
                    >
                      <div className="flex items-center justify-center gap-2 text-orange-700">
                        <Clock className="w-5 h-5" />
                        <span className="font-semibold">Waktu pemesanan telah berakhir</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Pickup Information */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.0 }}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 rounded-full p-2 mt-1">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-blue-800 mb-2">Pengambilan Pesanan</h3>
                        <p className="text-blue-700">
                          Silakan pengambilan pesanan di<br />
                          <strong>Booth Dharma Wanita PERDAMI Jawa Barat</strong>
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Thank You Message */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    className="space-y-4 text-gray-700"
                  >
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Heart className="w-6 h-6 text-red-500" />
                      <span className="text-lg font-semibold text-red-600">Hatur Nuhun Pisan</span>
                      <Heart className="w-6 h-6 text-red-500" />
                    </div>
                    
                    <p className="text-lg leading-relaxed">
                      <strong>Hatur nuhun pisan</strong> atas pesanan sareng dukunganna.
                    </p>
                    
                    <p className="text-lg leading-relaxed italic text-orange-700">
                      Mugia ku ieu oleh-oleh tiasa janten kenangan manis<br />
                      ti <strong>Bandung tercinta</strong> ❤️
                    </p>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.4 }}
                    className="flex flex-col sm:flex-row gap-4 pt-6"
                  >
                    <Button
                      onClick={() => window.location.href = '/orders'}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Lihat Pesanan Saya
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = '/auth/login'}
                      className="border-2 border-orange-400 text-orange-600 hover:bg-orange-50 px-8 py-3 rounded-lg font-semibold transition-all duration-300"
                    >
                      Masuk ke Akun
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Footer Decoration */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.6 }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center gap-2 text-orange-600 text-sm">
              <span>🏔️</span>
              <span className="font-medium">PERDAMI Jawa Barat 2025</span>
              <span>🏔️</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
