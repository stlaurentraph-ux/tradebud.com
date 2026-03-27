'use client'

import { useState } from 'react'
import {
  Home,
  Map,
  Settings,
  MapPin,
  Camera,
  Check,
  ChevronRight,
  User,
  FileCheck,
  Package,
  Leaf,
  Globe,
  Play,
  Square,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  Battery,
  Signal,
} from 'lucide-react'

// Mock data for demonstration
const mockPlots = [
  {
    id: 'PLT-001',
    name: 'Akosombo Farm - Block A',
    area: '2.4 ha',
    status: 'complete',
    lastUpdated: '2 days ago',
    coordinates: 47,
  },
  {
    id: 'PLT-002',
    name: 'Riverside Plot',
    area: '1.8 ha',
    status: 'pending',
    lastUpdated: '1 week ago',
    coordinates: 32,
  },
  {
    id: 'PLT-003',
    name: 'Highland Section',
    area: '3.1 ha',
    status: 'incomplete',
    lastUpdated: 'Never',
    coordinates: 0,
  },
]

// Phone Frame Component
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[375px] h-[812px] bg-stone-900 rounded-[3rem] p-3 shadow-2xl">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-stone-900 rounded-b-3xl z-20" />
      {/* Screen */}
      <div className="relative w-full h-full bg-white rounded-[2.25rem] overflow-hidden">
        {children}
      </div>
    </div>
  )
}

// Status Bar Component
function StatusBar({ offline = false }: { offline?: boolean }) {
  return (
    <div className="flex items-center justify-between px-6 py-2 bg-emerald-800 text-white text-xs">
      <span className="font-medium">9:41</span>
      <div className="flex items-center gap-1.5">
        {offline ? (
          <span className="flex items-center gap-1 text-amber-300">
            <WifiOff size={12} />
            Offline
          </span>
        ) : (
          <Wifi size={12} />
        )}
        <Signal size={12} />
        <Battery size={12} />
      </div>
    </div>
  )
}

// Tab Bar Component
function TabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: string
  onTabChange: (tab: string) => void
}) {
  const tabs = [
    { id: 'home', label: 'Record', icon: Home },
    { id: 'plots', label: 'Plots', icon: Map },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-4 py-2 pb-6">
      <div className="flex justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              activeTab === tab.id
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-stone-400'
            }`}
          >
            <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Home Screen Component
function HomeScreen({
  isRecording,
  onStartRecording,
  onStopRecording,
}: {
  isRecording: boolean
  onStartRecording: () => void
  onStopRecording: () => void
}) {
  const [fpicChecked, setFpicChecked] = useState(false)
  const [laborChecked, setLaborChecked] = useState(false)

  return (
    <div className="h-full bg-stone-50 flex flex-col">
      <StatusBar offline />
      
      {/* Header */}
      <div className="bg-emerald-800 px-5 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-xl font-bold">Tracebud</h1>
            <p className="text-emerald-200 text-sm">Field Companion</p>
          </div>
          <div className="w-12 h-12 bg-emerald-700 rounded-full flex items-center justify-center">
            <User size={24} className="text-emerald-200" />
          </div>
        </div>
        
        {/* Farmer Badge */}
        <div className="bg-emerald-700/50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center">
            <Leaf size={20} className="text-amber-800" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold">Kwame Asante</p>
            <p className="text-emerald-200 text-sm">Farmer ID: FRM-2024-0847</p>
          </div>
          <CheckCircle2 size={20} className="text-emerald-300" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-5 py-4 pb-24">
        {/* Compliance Declarations */}
        <div className="mb-6">
          <h2 className="text-stone-700 font-semibold mb-3 flex items-center gap-2">
            <FileCheck size={18} className="text-emerald-600" />
            Compliance Declarations
          </h2>
          
          <div className="space-y-3">
            <button
              onClick={() => setFpicChecked(!fpicChecked)}
              className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
                fpicChecked
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-stone-200 bg-white'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                  fpicChecked ? 'bg-emerald-500' : 'border-2 border-stone-300'
                }`}
              >
                {fpicChecked && <Check size={16} className="text-white" />}
              </div>
              <div className="text-left">
                <p className="font-medium text-stone-800">FPIC Consent</p>
                <p className="text-sm text-stone-500">
                  Farmer has given free, prior, and informed consent
                </p>
              </div>
            </button>

            <button
              onClick={() => setLaborChecked(!laborChecked)}
              className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
                laborChecked
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-stone-200 bg-white'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                  laborChecked ? 'bg-emerald-500' : 'border-2 border-stone-300'
                }`}
              >
                {laborChecked && <Check size={16} className="text-white" />}
              </div>
              <div className="text-left">
                <p className="font-medium text-stone-800">No Child Labor</p>
                <p className="text-sm text-stone-500">
                  Farm complies with labor standards
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* GPS Recording Section */}
        <div className="mb-6">
          <h2 className="text-stone-700 font-semibold mb-3 flex items-center gap-2">
            <MapPin size={18} className="text-emerald-600" />
            Plot Mapping
          </h2>

          {/* Map Preview */}
          <div className="relative h-48 bg-emerald-100 rounded-xl overflow-hidden mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 to-emerald-300 opacity-50" />
            {/* Simulated map with plot outline */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              <path
                d="M 20 30 L 35 20 L 70 25 L 80 50 L 75 75 L 40 80 L 25 60 Z"
                fill="rgba(16, 185, 129, 0.3)"
                stroke="#059669"
                strokeWidth="2"
                strokeDasharray={isRecording ? '5,5' : '0'}
              />
              {/* GPS points */}
              {[
                { x: 20, y: 30 },
                { x: 35, y: 20 },
                { x: 70, y: 25 },
                { x: 80, y: 50 },
                { x: 75, y: 75 },
                { x: 40, y: 80 },
                { x: 25, y: 60 },
              ].map((point, i) => (
                <circle
                  key={i}
                  cx={point.x}
                  cy={point.y}
                  r="3"
                  fill="#059669"
                />
              ))}
              {/* Current position indicator */}
              {isRecording && (
                <circle cx="50" cy="50" r="5" fill="#f59e0b" className="animate-pulse">
                  <animate
                    attributeName="r"
                    values="4;6;4"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </svg>
            
            {/* Recording Stats Overlay */}
            {isRecording && (
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-medium text-stone-700">Recording...</span>
                </div>
                <div className="text-xs text-stone-500 mt-1">
                  Points: 47 | Area: ~2.4 ha
                </div>
              </div>
            )}
          </div>

          {/* Recording Button */}
          <button
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={!fpicChecked || !laborChecked}
            className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all ${
              !fpicChecked || !laborChecked
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : isRecording
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                : 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
            }`}
          >
            {isRecording ? (
              <>
                <Square size={20} fill="currentColor" />
                Stop Recording
              </>
            ) : (
              <>
                <Play size={20} fill="currentColor" />
                Walk Plot Boundary
              </>
            )}
          </button>
          
          {(!fpicChecked || !laborChecked) && (
            <p className="text-center text-sm text-stone-400 mt-2">
              Complete all declarations to start recording
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-stone-700 font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-stone-200 hover:border-emerald-300 transition-colors">
              <Camera size={24} className="text-emerald-600" />
              <span className="text-sm font-medium text-stone-700">Take Photo</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-stone-200 hover:border-emerald-300 transition-colors">
              <Package size={24} className="text-emerald-600" />
              <span className="text-sm font-medium text-stone-700">Log Harvest</span>
            </button>
          </div>
        </div>
      </div>

      <TabBar activeTab="home" onTabChange={() => {}} />
    </div>
  )
}

// Plots Screen Component
function PlotsScreen() {
  return (
    <div className="h-full bg-stone-50 flex flex-col">
      <StatusBar offline />
      
      {/* Header */}
      <div className="bg-emerald-800 px-5 pt-4 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-white text-xl font-bold">My Plots</h1>
          <button className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
            <Plus size={20} className="text-white" />
          </button>
        </div>
        <p className="text-emerald-200 text-sm">3 plots registered</p>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-stone-200 px-5 py-3 flex justify-between">
        <div className="text-center">
          <p className="text-xl font-bold text-emerald-700">7.3</p>
          <p className="text-xs text-stone-500">Total Hectares</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-emerald-700">79</p>
          <p className="text-xs text-stone-500">GPS Points</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-amber-600">1</p>
          <p className="text-xs text-stone-500">Pending Sync</p>
        </div>
      </div>

      {/* Plot List */}
      <div className="flex-1 overflow-auto px-5 py-4 pb-24">
        <div className="space-y-3">
          {mockPlots.map((plot) => (
            <button
              key={plot.id}
              className="w-full bg-white rounded-xl p-4 border border-stone-200 text-left hover:border-emerald-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-stone-800">{plot.name}</h3>
                  <p className="text-sm text-stone-500">{plot.id}</p>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    plot.status === 'complete'
                      ? 'bg-emerald-100 text-emerald-700'
                      : plot.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {plot.status === 'complete'
                    ? 'Complete'
                    : plot.status === 'pending'
                    ? 'Pending Sync'
                    : 'Incomplete'}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-stone-500">
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {plot.area}
                </span>
                <span className="flex items-center gap-1">
                  <Map size={14} />
                  {plot.coordinates} points
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {plot.lastUpdated}
                </span>
              </div>

              {/* Compliance indicators */}
              <div className="flex items-center gap-2 mt-3">
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs">
                  <CheckCircle2 size={12} />
                  FPIC
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs">
                  <CheckCircle2 size={12} />
                  Labor
                </span>
                {plot.status === 'complete' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs">
                    <CheckCircle2 size={12} />
                    Photos
                  </span>
                )}
              </div>

              <ChevronRight
                size={20}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300"
              />
            </button>
          ))}
        </div>
      </div>

      <TabBar activeTab="plots" onTabChange={() => {}} />
    </div>
  )
}

// Settings Screen Component
function SettingsScreen() {
  return (
    <div className="h-full bg-stone-50 flex flex-col">
      <StatusBar offline />
      
      {/* Header */}
      <div className="bg-emerald-800 px-5 pt-4 pb-6">
        <h1 className="text-white text-xl font-bold mb-1">Settings</h1>
        <p className="text-emerald-200 text-sm">App configuration</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-5 py-4 pb-24">
        {/* User Profile Card */}
        <div className="bg-white rounded-xl p-4 border border-stone-200 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-stone-800">Kwame Asante</h3>
              <p className="text-sm text-stone-500">Field Agent</p>
              <p className="text-xs text-emerald-600 mt-1">Akosombo Cooperative</p>
            </div>
            <ChevronRight size={20} className="text-stone-300" />
          </div>
        </div>

        {/* Sync Status */}
        <div className="mb-6">
          <h2 className="text-stone-700 font-semibold mb-3">Sync Status</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">1 item pending sync</p>
                <p className="text-sm text-amber-700 mt-1">
                  Connect to WiFi to upload your data
                </p>
                <button className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium">
                  Sync Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="mb-6">
          <h2 className="text-stone-700 font-semibold mb-3 flex items-center gap-2">
            <Globe size={18} />
            Language
          </h2>
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            {['English', 'Twi', 'Ewe', 'French'].map((lang, i) => (
              <button
                key={lang}
                className={`w-full flex items-center justify-between px-4 py-3 ${
                  i !== 3 ? 'border-b border-stone-100' : ''
                } hover:bg-stone-50 transition-colors`}
              >
                <span className="text-stone-700">{lang}</span>
                {lang === 'English' && (
                  <CheckCircle2 size={20} className="text-emerald-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* App Info */}
        <div className="text-center text-stone-400 text-sm">
          <p>Tracebud Field App v1.0.0</p>
          <p className="mt-1">Works offline</p>
        </div>
      </div>

      <TabBar activeTab="settings" onTabChange={() => {}} />
    </div>
  )
}

// Main Prototype Page
export default function PrototypePage() {
  const [activeScreen, setActiveScreen] = useState<'home' | 'plots' | 'settings'>('home')
  const [isRecording, setIsRecording] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 to-emerald-50 py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-emerald-800 mb-2">Tracebud Field App</h1>
        <p className="text-stone-600 max-w-md mx-auto">
          Interactive prototype for farmers and field agents. Tap through the screens below.
        </p>
      </div>

      {/* Screen Selector */}
      <div className="flex justify-center gap-2 mb-8">
        {[
          { id: 'home', label: 'Record Screen', icon: Home },
          { id: 'plots', label: 'Plots Screen', icon: Map },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((screen) => (
          <button
            key={screen.id}
            onClick={() => setActiveScreen(screen.id as typeof activeScreen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
              activeScreen === screen.id
                ? 'bg-emerald-700 text-white'
                : 'bg-white text-stone-600 hover:bg-stone-50'
            }`}
          >
            <screen.icon size={18} />
            {screen.label}
          </button>
        ))}
      </div>

      {/* Phone Display */}
      <div className="flex justify-center">
        <PhoneFrame>
          {activeScreen === 'home' && (
            <HomeScreen
              isRecording={isRecording}
              onStartRecording={() => setIsRecording(true)}
              onStopRecording={() => setIsRecording(false)}
            />
          )}
          {activeScreen === 'plots' && <PlotsScreen />}
          {activeScreen === 'settings' && <SettingsScreen />}
        </PhoneFrame>
      </div>

      {/* Feature Highlights */}
      <div className="max-w-3xl mx-auto mt-12 grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
            <MapPin size={24} className="text-emerald-600" />
          </div>
          <h3 className="font-semibold text-stone-800 mb-2">GPS Plot Mapping</h3>
          <p className="text-sm text-stone-500">
            Walk your plot boundary to automatically capture accurate GPS coordinates
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
            <WifiOff size={24} className="text-amber-600" />
          </div>
          <h3 className="font-semibold text-stone-800 mb-2">Works Offline</h3>
          <p className="text-sm text-stone-500">
            No internet? No problem. All data syncs automatically when connected
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
            <FileCheck size={24} className="text-emerald-600" />
          </div>
          <h3 className="font-semibold text-stone-800 mb-2">EU Compliance Ready</h3>
          <p className="text-sm text-stone-500">
            Built-in declarations for EUDR compliance, labor standards, and traceability
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-12">
        <p className="text-stone-500 mb-4">Interested in bringing Tracebud to your cooperative?</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-700 text-white rounded-full font-medium hover:bg-emerald-800 transition-colors"
        >
          Learn More
          <ChevronRight size={18} />
        </a>
      </div>
    </div>
  )
}
