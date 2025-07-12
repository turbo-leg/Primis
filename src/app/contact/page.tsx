'use client'

import { useState } from 'react'
import { useTranslation } from '@/components/providers/i18n-provider'
import { 
  CheckCircleIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline'

export default function Contact() {
  const { t } = useTranslation()
  const [showThankYou, setShowThankYou] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      setShowThankYou(true)
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setShowThankYou(false)
      }, 3000)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570]">
      {/* Hero Section */}
      <section className="relative text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              {t('contact.title')}
            </h1>
            <p className="text-xl max-w-3xl mx-auto text-gray-300">
              {t('contact.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">{t('contact.getInTouch')}</h2>
                <p className="text-gray-300 text-lg mb-8">
                  We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                </p>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-4">{t('contact.contactInfo')}</h3>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-red-500 rounded-full p-3">
                      <MapPinIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{t('contact.address')}</h4>
                      <p className="text-gray-300">СБД, 1-р хороо, Соёмбо Тауэр 202 тоот</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-red-500 rounded-full p-3">
                      <PhoneIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{t('contact.phone')}</h4>
                      <p className="text-gray-300">7200-2220</p>
                      <p className="text-gray-300">9032-2200</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-red-500 rounded-full p-3">
                      <EnvelopeIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{t('contact.email')}</h4>
                      <p className="text-gray-300">info@primiseducare.com</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-red-500 rounded-full p-3">
                      <ClockIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{t('contact.hours')}</h4>
                      <p className="text-gray-300">Monday - Friday: 9:00 AM - 6:00 PM<br />Saturday: 9:00 AM - 4:00 PM<br />Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-6">{t('contact.sendMessage')}</h3>
              
              {showThankYou ? (
                <div className="text-center py-12">
                  <CheckCircleIcon className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-white mb-2">{t('contact.thankYou')}</h4>
                  <p className="text-gray-300">{t('contact.thankYouMessage')}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-white mb-2">
                        {t('contact.firstName')}
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        required
                        className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-white mb-2">
                        {t('contact.lastName')}
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        required
                        className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-white mb-2">
                      {t('contact.subject')}
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter the subject"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
                      {t('contact.message')}
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      placeholder="Enter your message"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:transform-none shadow-lg"
                  >
                    {isSubmitting ? 'Sending...' : t('contact.sendButton')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
