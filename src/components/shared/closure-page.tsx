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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
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
              <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-red-200 dark:from-orange-900/30 dark:to-red-900/30 rounded-full opacity-20 animate-pulse"></div>
              
              {/* Main Image Container */}
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-gray-200 shadow-2xl dark:shadow-gray-900/50">
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
                className="absolute -top-4 -right-4 w-12 h-12 bg-orange-400 dark:bg-orange-500 rounded-full flex items-center justify-center text-white text-xl shadow-lg dark:shadow-gray-900/50"
              >
                🎉
              </motion.div>
              
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-4 -left-4 w-12 h-12 bg-red-400 dark:bg-red-500 rounded-full flex items-center justify-center text-white text-xl shadow-lg dark:shadow-gray-900/50"
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
            <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-2xl dark:shadow-gray-900/50">
              <CardContent className="p-8 md:p-12">
                <div className="space-y-6">
                  {/* Title */}
                  <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4"
                  >
                    Pemesanan Oleh-oleh Bandung
                    <br />
                    <span className="text-red-600 dark:text-red-400">Telah Ditutup</span>
                  </motion.h1>

                  {/* Countdown (if needed) */}
                  {showCountdown && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.8 }}
                      className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4 mb-6"
                    >
                      <div className="flex items-center justify-center gap-2 text-orange-700 dark:text-orange-300">
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
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 mb-6"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 dark:bg-blue-600 rounded-full p-2 mt-1">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Pengambilan Pesanan</h3>
                        <p className="text-blue-700 dark:text-blue-300">
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
                    className="space-y-4 text-gray-700 dark:text-gray-300"
                  >
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Heart className="w-6 h-6 text-red-500 dark:text-red-400" />
                      <span className="text-lg font-semibold text-red-600 dark:text-red-400">Hatur Nuhun Pisan</span>
                      <Heart className="w-6 h-6 text-red-500 dark:text-red-400" />
                    </div>
                    
                    <p className="text-lg leading-relaxed">
                      <strong>Hatur nuhun pisan</strong> atas pesanan sareng dukunganna.
                    </p>
                    
                    <p className="text-lg leading-relaxed italic text-orange-700 dark:text-orange-300">
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
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Lihat Pesanan Saya
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = '/auth/login'}
                      className="border-2 border-orange-400 dark:border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 px-8 py-3 rounded-lg font-semibold transition-all duration-300"
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
            <div className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm">
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
