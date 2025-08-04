'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/components/providers/i18n-provider'
import {
  AcademicCapIcon,
  UserGroupIcon,
  TrophyIcon,
  HeartIcon,
  LightBulbIcon,
  SparklesIcon,
  GlobeAltIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

export default function About() {
  const { t } = useTranslation()
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  
  const missionRef = useRef<HTMLElement>(null)
  const valuesRef = useRef<HTMLElement>(null)
  const teamRef = useRef<HTMLElement>(null)
  const historyRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observers = new Map()
    const sections = [
      { name: 'mission', ref: missionRef },
      { name: 'values', ref: valuesRef },
      { name: 'team', ref: teamRef },
      { name: 'history', ref: historyRef }
    ]

    sections.forEach(({ name, ref }) => {
      if (ref.current) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setVisibleSections(prev => new Set([...prev, name]))
              }
            })
          },
          { threshold: 0.2 }
        )
        observer.observe(ref.current)
        observers.set(name, observer)
      }
    })

    return () => {
      observers.forEach(observer => observer.disconnect())
    }
  }, [])

  const values = [
    {
      icon: AcademicCapIcon,
      title: t('about.values.excellence.title'),
      description: t('about.values.excellence.desc'),
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: HeartIcon,
      title: t('about.values.personalized.title'),
      description: t('about.values.personalized.desc'),
      color: 'from-red-500 to-red-600'
    },
    {
      icon: LightBulbIcon,
      title: t('about.values.innovation.title'),
      description: t('about.values.innovation.desc'),
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: UserGroupIcon,
      title: t('about.values.community.title'),
      description: t('about.values.community.desc'),
      color: 'from-green-500 to-green-600'
    }
  ]

  const team = [
    {
      name: t('about.team.sarah.name'),
      role: t('about.team.sarah.role'),
      bio: t('about.team.sarah.bio'),
      color: 'from-blue-500 to-purple-500'
    },
    {
      name: t('about.team.michael.name'),
      role: t('about.team.michael.role'),
      bio: t('about.team.michael.bio'),
      color: 'from-green-500 to-blue-500'
    },
    {
      name: t('about.team.emily.name'),
      role: t('about.team.emily.role'),
      bio: t('about.team.emily.bio'),
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: t('about.team.david.name'),
      role: t('about.team.david.role'),
      bio: t('about.team.david.bio'),
      color: 'from-orange-500 to-red-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570]">
      {/* Hero Section */}
      <section className="relative text-white py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              {t('about.title')}
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed">
              {t('about.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section 
        ref={missionRef}
        className="relative py-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-2000 ${visibleSections.has('mission') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {t('about.mission.title')}
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              {t('about.mission.description')}
            </p>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-2000 delay-500 ${visibleSections.has('mission') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <GlobeAltIcon className="h-12 w-12 text-blue-400 mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-white mb-4">{t('about.mission.global.title')}</h3>
              <p className="text-gray-300">{t('about.mission.global.desc')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <TrophyIcon className="h-12 w-12 text-yellow-400 mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-white mb-4">{t('about.mission.excellence.title')}</h3>
              <p className="text-gray-300">{t('about.mission.excellence.desc')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <SparklesIcon className="h-12 w-12 text-purple-400 mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-white mb-4">{t('about.mission.innovation.title')}</h3>
              <p className="text-gray-300">{t('about.mission.innovation.desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section 
        ref={valuesRef}
        className="relative py-24 bg-gradient-to-b from-transparent to-black/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-2000 ${visibleSections.has('values') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              {t('about.values.title')}
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('about.values.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div 
                key={index}
                className={`group transition-all duration-2000 ${visibleSections.has('values') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 h-full">
                  <div className={`h-16 w-16 bg-gradient-to-r ${value.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <value.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{value.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section 
        ref={teamRef}
        className="relative py-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-2000 ${visibleSections.has('team') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t('about.team.title')}
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('about.team.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div 
                key={index}
                className={`group transition-all duration-2000 ${visibleSections.has('team') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 text-center h-full">
                  <div className="relative mb-6">
                    <div className={`h-24 w-24 bg-gradient-to-r ${member.color} rounded-full mx-auto flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <span className="text-2xl font-bold text-white">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
                  <p className="text-blue-400 font-semibold mb-4">{member.role}</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* History Section */}
      <section 
        ref={historyRef}
        className="relative py-24 bg-gradient-to-b from-black/20 to-transparent"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-2000 ${visibleSections.has('history') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              {t('about.history.title')}
            </h2>
          </div>

          <div className={`max-w-4xl mx-auto transition-all duration-2000 delay-500 ${visibleSections.has('history') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="space-y-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-start space-x-4">
                  <div className="h-4 w-4 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">2020 - Foundation</h3>
                    <p className="text-gray-300">{t('about.history.foundation')}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-start space-x-4">
                  <div className="h-4 w-4 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">2021 - Expansion</h3>
                    <p className="text-gray-300">{t('about.history.expansion')}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-start space-x-4">
                  <div className="h-4 w-4 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">2022 - Innovation</h3>
                    <p className="text-gray-300">{t('about.history.innovation')}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-start space-x-4">
                  <div className="h-4 w-4 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">2023 - Recognition</h3>
                    <p className="text-gray-300">{t('about.history.recognition')}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-start space-x-4">
                  <div className="h-4 w-4 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">2024 - Future</h3>
                    <p className="text-gray-300">{t('about.history.future')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            {t('about.cta.title')}
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            {t('about.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/contact"
              className="group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-12 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
            >
              {t('about.cta.contact')}
              <ChevronRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/courses"
              className="bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 hover:border-white/50 text-white px-12 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              {t('about.cta.courses')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
