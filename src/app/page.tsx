'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/components/providers/i18n-provider'
import { 
  PhoneIcon, 
  MapPinIcon, 
  StarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  TrophyIcon,
  HeartIcon,
  LightBulbIcon,
  ChevronDownIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

interface HomeStats {
  studentsServed: string
  successRate: string
  pointImprovement: string
  yearsExperience: string
  totalCourses: number
  totalEnrollments: number
  averageAttendance: string
}

export default function Home() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<HomeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [scrollY, setScrollY] = useState(0)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  
  const heroRef = useRef<HTMLElement>(null)
  const statsRef = useRef<HTMLElement>(null)
  const missionRef = useRef<HTMLElement>(null)
  const valuesRef = useRef<HTMLElement>(null)
  const teamRef = useRef<HTMLElement>(null)
  const storyRef = useRef<HTMLElement>(null)
  const contactRef = useRef<HTMLElement>(null)

  useEffect(() => {
    fetchHomeStats()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observers = new Map()
    const sections = [
      { name: 'hero', ref: heroRef },
      { name: 'stats', ref: statsRef },
      { name: 'mission', ref: missionRef },
      { name: 'values', ref: valuesRef },
      { name: 'team', ref: teamRef },
      { name: 'story', ref: storyRef },
      { name: 'contact', ref: contactRef }
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

  const fetchHomeStats = async () => {
    try {
      const response = await fetch('/api/stats/home')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.error('Failed to fetch home stats')
      }
    } catch (error) {
      console.error('Error fetching home stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToSection = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
  }

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
      color: 'from-pink-500 to-red-500'
    },
    {
      name: t('about.team.james.name'),
      role: t('about.team.james.role'),
      bio: t('about.team.james.bio'),
      color: 'from-yellow-500 to-orange-500'
    },
  ]

  const values = [
    {
      icon: AcademicCapIcon,
      title: t('about.excellence'),
      description: t('about.excellenceDesc'),
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: HeartIcon,
      title: t('about.personalization'),
      description: t('about.personalizationDesc'),
      color: 'from-red-500 to-red-600'
    },
    {
      icon: TrophyIcon,
      title: t('about.integrity'),
      description: t('about.integrityDesc'),
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: LightBulbIcon,
      title: t('about.innovation'),
      description: t('about.innovationDesc'),
      color: 'from-purple-500 to-purple-600'
    },
  ]

  const universities = [
    { name: 'COLUMBIA', fullName: 'Columbia University', color: 'bg-blue-600' },
    { name: 'BROWN', fullName: 'Brown University', color: 'bg-red-600' },
    { name: 'YALE', fullName: 'Yale University', color: 'bg-blue-800' },
    { name: 'NYU', fullName: 'New York University', color: 'bg-purple-600' }
  ]

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center"
        style={{
          transform: `translateY(${scrollY * 0.5}px)`,
        }}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative text-center max-w-6xl mx-auto px-4">
          <div className={`transition-all duration-2000 ${visibleSections.has('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <h1 className="text-6xl md:text-8xl font-light tracking-[0.3em] mb-6 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-2xl">
              PRIMIS
            </h1>
            <h2 className="text-3xl md:text-4xl font-light tracking-[0.2em] text-white/90 mb-8">
              EDUCARE
            </h2>
          </div>
          
          <div className={`transition-all duration-2000 delay-500 ${visibleSections.has('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto mb-12 leading-relaxed">
              {t('home.heroSubtitle')}
            </p>
            
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-2">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-8 w-8 text-yellow-400 fill-current animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                ))}
              </div>
            </div>
            <p className="text-white/60 mb-12">{t('home.trustedBy')}</p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link 
                href="/auth/signup"
                className="group bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-12 py-6 rounded-3xl text-xl font-bold transition-all duration-500 transform hover:scale-110 hover:shadow-2xl shadow-lg text-center"
              >
                <span className="flex items-center justify-center">
                  {t('home.getStarted')}
                  <ArrowRightIcon className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </Link>
              <button 
                onClick={() => scrollToSection(missionRef)}
                className="bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 hover:border-white/50 text-white px-12 py-6 rounded-3xl text-xl font-semibold transition-all duration-500 transform hover:scale-105"
              >
                {t('home.learnMore')}
              </button>
            </div>
          </div>

          <div className={`transition-all duration-2000 delay-1000 ${visibleSections.has('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <button 
              onClick={() => scrollToSection(statsRef)}
              className="animate-bounce text-white/60 hover:text-white transition-colors duration-300"
            >
              <ChevronDownIcon className="h-8 w-8 mx-auto" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section 
        ref={statsRef}
        className="relative py-24 bg-gradient-to-b from-transparent to-black/20"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className={`transition-all duration-1500 ${visibleSections.has('stats') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
              {t('home.ourImpact')}
            </h2>
            <p className="text-xl text-white/70 text-center mb-16 max-w-3xl mx-auto">
              {t('home.impactSubtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: stats?.yearsExperience || '15+', label: t('home.yearsExperience'), color: 'text-blue-400', delay: 'delay-200' },
              { value: stats?.studentsServed || '5,000+', label: t('home.studentsServed'), color: 'text-green-400', delay: 'delay-400' },
              { value: stats?.successRate || '95%', label: t('home.successRate'), color: 'text-yellow-400', delay: 'delay-600' },
              { value: '50+', label: t('home.expertInstructors'), color: 'text-purple-400', delay: 'delay-800' }
            ].map((stat, index) => (
              <div 
                key={index} 
                className={`group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-3xl p-8 text-center border border-white/10 hover:border-white/30 transition-all duration-700 transform hover:-translate-y-6 hover:scale-110 ${stat.delay} ${visibleSections.has('stats') ? 'animate-fade-in' : 'opacity-0'}`}
                style={{ 
                  transform: `translateY(${Math.sin((scrollY + index * 100) * 0.001) * 10}px)`,
                  animationDelay: `${200 + index * 200}ms`
                }}
              >
                <div className={`text-4xl md:text-6xl font-bold ${stat.color} mb-4 group-hover:scale-125 transition-transform duration-500`}>
                  {loading ? '...' : stat.value}
                </div>
                <div className="text-white/70 text-sm uppercase tracking-wide font-medium group-hover:text-white transition-colors duration-300">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section 
        ref={missionRef}
        className="relative py-32 bg-gradient-to-br from-black/20 to-transparent"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className={`transition-all duration-2000 ${visibleSections.has('mission') ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {t('about.missionTitle')}
              </h2>
              <p className="text-xl text-gray-300 mb-12 leading-relaxed">
                {t('about.missionDesc')}
              </p>
              
              <h3 className="text-4xl font-bold text-white mb-8 bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                {t('about.visionTitle')}
              </h3>
              <p className="text-xl text-gray-300 mb-12 leading-relaxed">
                {t('about.visionDesc')}
              </p>

              <button 
                onClick={() => scrollToSection(valuesRef)}
                className="group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-10 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center">
                  {t('home.discoverValues')}
                  <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </button>
            </div>
            
            <div className={`transition-all duration-2000 delay-500 ${visibleSections.has('mission') ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-3xl p-12 border border-white/20 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-red-500/10 animate-pulse"></div>
                <div className="relative z-10">
                  <AcademicCapIcon className="h-32 w-32 mx-auto mb-8 text-blue-400 animate-pulse" />
                  <p className="text-2xl font-medium text-white text-center mb-8">{t('about.missionImagePlaceholder')}</p>
                  
                  {/* University Logos Preview */}
                  <div className="grid grid-cols-2 gap-4">
                    {universities.slice(0, 4).map((university, index) => (
                      <div 
                        key={index} 
                        className="bg-white rounded-2xl p-4 transform hover:scale-105 hover:rotate-2 transition-all duration-300"
                        style={{ animationDelay: `${index * 200}ms` }}
                      >
                        <div className={`w-12 h-12 ${university.color} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                          <span className="text-white font-bold text-xs">{university.name}</span>
                        </div>
                        <p className="text-gray-700 text-xs font-semibold text-center">{university.fullName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section 
        ref={valuesRef}
        className="relative py-32 bg-gradient-to-r from-black/10 to-transparent"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className={`text-center mb-20 transition-all duration-2000 ${visibleSections.has('values') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent">
              {t('about.valuesTitle')}
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              {t('about.valuesSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {values.map((value, index) => (
              <div 
                key={index}
                className={`group bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-3xl p-12 border border-white/20 hover:border-white/40 transition-all duration-700 transform hover:-translate-y-8 hover:scale-105 ${visibleSections.has('values') ? 'animate-fade-in' : 'opacity-0'}`}
                style={{ 
                  animationDelay: `${index * 300}ms`,
                  transform: `translateY(${Math.sin((scrollY + index * 200) * 0.002) * 5}px) ${visibleSections.has('values') ? 'translateY(-8px) scale(1.05)' : ''}` 
                }}
              >
                <div className={`w-20 h-20 bg-gradient-to-r ${value.color} rounded-3xl flex items-center justify-center mb-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-2xl`}>
                  <value.icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-8 group-hover:text-blue-200 transition-colors duration-500">
                  {value.title}
                </h3>
                <p className="text-gray-300 text-lg leading-relaxed group-hover:text-gray-200 transition-colors duration-500">
                  {value.description}
                </p>
                
                <div className="mt-8 h-2 w-0 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-700 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section 
        ref={teamRef}
        className="relative py-32"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className={`text-center mb-20 transition-all duration-2000 ${visibleSections.has('team') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              {t('about.teamTitle')}
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              {t('about.teamSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {team.map((member, index) => (
              <div 
                key={index}
                className={`group text-center bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-3xl p-10 border border-white/10 hover:border-white/30 transition-all duration-700 transform hover:-translate-y-10 hover:scale-110 ${visibleSections.has('team') ? 'animate-fade-in' : 'opacity-0'}`}
                style={{ 
                  animationDelay: `${index * 200}ms`,
                  transform: `translateY(${Math.sin((scrollY + index * 150) * 0.003) * 8}px)`
                }}
              >
                <div className="relative mb-8">
                  <div className={`w-48 h-48 bg-gradient-to-br ${member.color} rounded-full mx-auto flex items-center justify-center border-4 border-white/20 group-hover:border-white/40 transition-all duration-500 group-hover:scale-110 shadow-2xl`}>
                    <UserGroupIcon className="h-24 w-24 text-white group-hover:scale-125 transition-transform duration-500" />
                  </div>
                  <div className="absolute -top-4 -right-4 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                  <div className="absolute -bottom-4 -left-4 w-4 h-4 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-200 transition-colors duration-500">
                  {member.name}
                </h3>
                <p className="text-blue-400 font-semibold mb-6 text-lg group-hover:text-blue-300 transition-colors duration-500">
                  {member.role}
                </p>
                <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-500">
                  {member.bio}
                </p>
                
                <div className="flex justify-center mt-8 space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-60 group-hover:opacity-100 transition-all duration-300"
                      style={{ transitionDelay: `${i * 100}ms` }}
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section 
        ref={storyRef}
        className="relative py-32 bg-gradient-to-br from-[#0a1554] via-[#1a2570] to-[#0a1554]"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className={`transition-all duration-2000 ${visibleSections.has('story') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <h2 className="text-5xl md:text-6xl font-bold mb-16 text-white bg-gradient-to-r from-yellow-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
              {t('about.storyTitle')}
            </h2>
            
            <div className="space-y-12 max-w-5xl mx-auto">
              {[
                t('about.storyParagraph1'),
                t('about.storyParagraph2'),
                t('about.storyParagraph3')
              ].map((paragraph, index) => (
                <div 
                  key={index} 
                  className={`transition-all duration-1500 ${visibleSections.has('story') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} 
                  style={{ transitionDelay: `${500 + index * 400}ms` }}
                >
                  <p className="text-xl text-gray-300 leading-relaxed hover:text-gray-200 transition-colors duration-500 p-10 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 hover:border-white/40 hover:bg-white/15 transform hover:-translate-y-2">
                    {paragraph}
                  </p>
                </div>
              ))}
            </div>
            
            <div className={`mt-16 transition-all duration-2000 delay-1500 ${visibleSections.has('story') ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <button 
                onClick={() => scrollToSection(contactRef)}
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 hover:from-blue-600 hover:via-purple-600 hover:to-red-600 text-white px-16 py-6 rounded-full text-xl font-bold transition-all duration-500 transform hover:scale-110 hover:shadow-2xl shadow-lg animate-pulse"
              >
                {t('home.joinSuccessStory')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section 
        ref={contactRef}
        className="relative py-32"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-2000 ${visibleSections.has('contact') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
              {t('home.getInTouch')}
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('home.getInTouchSubtitle')}
            </p>
          </div>

          <div className={`bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-3xl p-12 border border-white/20 shadow-2xl transition-all duration-2000 ${visibleSections.has('contact') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              
              <div className="space-y-10">
                <div className="group flex items-center space-x-8">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-full p-6 group-hover:scale-125 transition-transform duration-500 shadow-2xl">
                    <PhoneIcon className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <div className="text-white text-3xl font-bold">7200-2220</div>
                    <div className="text-white text-3xl font-bold">9032-2200</div>
                    <div className="text-white/60 text-lg mt-2">{t('home.callAnytime')}</div>
                  </div>
                </div>

                <div className="group flex items-center space-x-8">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full p-6 group-hover:scale-125 transition-transform duration-500 shadow-2xl">
                    <MapPinIcon className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <div className="text-white text-xl font-medium">
                      СБД, 1-р хороо, Соёмбо Тауэр 202 тоот
                    </div>
                    <div className="text-white/60 text-lg mt-2">{t('home.visitCampus')}</div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h4 className="text-white text-3xl font-bold mb-8">{t('home.readyQuestion')}</h4>
                <button className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white px-16 py-6 rounded-3xl text-2xl font-bold transition-all duration-500 transform hover:scale-110 hover:shadow-2xl shadow-lg animate-pulse mb-6">
                  {t('home.contactButton')}
                </button>
                <p className="text-white/60 text-lg">{t('home.freeConsultation')}</p>
                
                <div className="mt-8 flex justify-center">
                  <div className="flex items-center space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="h-8 w-8 text-yellow-400 fill-current animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                    ))}
                  </div>
                </div>
                <p className="text-white/60 mt-2">{t('home.joinThousands')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
