"use client"

import { useState, useEffect } from "react"
import {
  MapPin,
  TreeDeciduous,
  Settings,
  User,
  CheckCircle2,
  Circle,
  Play,
  Square,
  Clock,
  Wifi,
  WifiOff,
  ChevronRight,
  Camera,
  FileText,
  Package,
  Languages,
  Shield,
  Upload,
  Leaf,
  Globe,
} from "lucide-react"

type Screen = "record" | "plots" | "settings"

export default function PrototypePage() {
  const [activeScreen, setActiveScreen] = useState<Screen>("record")
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [fpicConsent, setFpicConsent] = useState(false)
  const [laborDeclaration, setLaborDeclaration] = useState(false)

  // Simulate recording time
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-emerald-900">Tracebud Field App</h1>
          </div>
          <p className="text-emerald-700">Interactive Prototype - Farmer Data Collection</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* Phone Frame */}
          <div className="relative mx-auto">
            {/* Phone outer frame */}
            <div className="relative w-[320px] h-[680px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl">
              {/* Phone inner bezel */}
              <div className="relative w-full h-full bg-slate-950 rounded-[2.5rem] overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-900 rounded-b-2xl z-20" />

                {/* Screen Content */}
                <div className="relative w-full h-full bg-stone-50 overflow-hidden flex flex-col">
                  {/* Status Bar */}
                  <div className="bg-emerald-700 pt-8 pb-2 px-4 flex items-center justify-between">
                    <span className="text-white text-xs font-medium">9:41</span>
                    <div className="flex items-center gap-1">
                      <WifiOff className="w-3.5 h-3.5 text-amber-300" />
                      <span className="text-amber-300 text-xs font-medium">Offline</span>
                    </div>
                  </div>

                  {/* App Header */}
                  <div className="bg-emerald-700 px-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-semibold">Kofi Mensah</p>
                          <p className="text-emerald-200 text-xs">Field Agent</p>
                        </div>
                      </div>
                      <div className="bg-emerald-600 px-2 py-0.5 rounded-full">
                        <span className="text-white text-xs">EN</span>
                      </div>
                    </div>
                  </div>

                  {/* Screen Content */}
                  <div className="flex-1 overflow-y-auto">
                    {activeScreen === "record" && (
                      <RecordScreen
                        isRecording={isRecording}
                        setIsRecording={setIsRecording}
                        recordingTime={recordingTime}
                        setRecordingTime={setRecordingTime}
                        fpicConsent={fpicConsent}
                        setFpicConsent={setFpicConsent}
                        laborDeclaration={laborDeclaration}
                        setLaborDeclaration={setLaborDeclaration}
                        formatTime={formatTime}
                      />
                    )}
                    {activeScreen === "plots" && <PlotsScreen />}
                    {activeScreen === "settings" && <SettingsScreen />}
                  </div>

                  {/* Tab Bar */}
                  <div className="bg-white border-t border-stone-200 px-2 pb-6 pt-2">
                    <div className="flex justify-around">
                      <TabButton
                        icon={<MapPin className="w-5 h-5" />}
                        label="Record"
                        active={activeScreen === "record"}
                        onClick={() => setActiveScreen("record")}
                      />
                      <TabButton
                        icon={<TreeDeciduous className="w-5 h-5" />}
                        label="Plots"
                        active={activeScreen === "plots"}
                        onClick={() => setActiveScreen("plots")}
                      />
                      <TabButton
                        icon={<Settings className="w-5 h-5" />}
                        label="Settings"
                        active={activeScreen === "settings"}
                        onClick={() => setActiveScreen("settings")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="flex-1 max-w-md">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-stone-200">
              <h2 className="text-xl font-bold text-emerald-900 mb-4">Key Features</h2>

              <div className="space-y-4">
                <FeatureCard
                  icon={<MapPin className="w-5 h-5 text-emerald-600" />}
                  title="GPS Plot Mapping"
                  description="Walk the perimeter of your farm plots to automatically capture accurate boundaries using GPS."
                />
                <FeatureCard
                  icon={<WifiOff className="w-5 h-5 text-amber-600" />}
                  title="Works Offline"
                  description="Collect data without internet. Sync automatically when you're back online."
                />
                <FeatureCard
                  icon={<Shield className="w-5 h-5 text-blue-600" />}
                  title="EU Compliance Ready"
                  description="Built-in EUDR compliance with FPIC consent and labor declarations."
                />
                <FeatureCard
                  icon={<Camera className="w-5 h-5 text-purple-600" />}
                  title="Photo Documentation"
                  description="Capture ground-truth photos with GPS location for verification."
                />
                <FeatureCard
                  icon={<Languages className="w-5 h-5 text-rose-600" />}
                  title="Multi-Language"
                  description="Available in English, French, and local languages for accessibility."
                />
              </div>

              <div className="mt-6 pt-6 border-t border-stone-200">
                <p className="text-sm text-stone-600 mb-4">
                  This is an interactive prototype. Try clicking around the phone screen to explore the app.
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-emerald-600 text-white text-center py-3 rounded-xl font-semibold cursor-pointer hover:bg-emerald-700 transition-colors">
                    Request Demo
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${
        active ? "text-emerald-700 bg-emerald-50" : "text-stone-400 hover:text-stone-600"
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}

function RecordScreen({
  isRecording,
  setIsRecording,
  recordingTime,
  setRecordingTime,
  fpicConsent,
  setFpicConsent,
  laborDeclaration,
  setLaborDeclaration,
  formatTime,
}: {
  isRecording: boolean
  setIsRecording: (v: boolean) => void
  recordingTime: number
  setRecordingTime: (v: number) => void
  fpicConsent: boolean
  setFpicConsent: (v: boolean) => void
  laborDeclaration: boolean
  setLaborDeclaration: (v: boolean) => void
  formatTime: (s: number) => string
}) {
  return (
    <div className="p-4 space-y-4">
      {/* Farmer Identity Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <User className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <p className="font-semibold text-stone-900">Kwame Asante</p>
            <p className="text-xs text-stone-500">Farmer ID: GH-2024-0847</p>
          </div>
        </div>

        {/* Compliance Checkboxes */}
        <div className="space-y-2">
          <button
            onClick={() => setFpicConsent(!fpicConsent)}
            className="w-full flex items-start gap-3 p-2 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors"
          >
            {fpicConsent ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-stone-300 flex-shrink-0 mt-0.5" />
            )}
            <div className="text-left">
              <p className="text-sm font-medium text-stone-900">FPIC Consent</p>
              <p className="text-xs text-stone-500">Free, Prior and Informed Consent given</p>
            </div>
          </button>

          <button
            onClick={() => setLaborDeclaration(!laborDeclaration)}
            className="w-full flex items-start gap-3 p-2 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors"
          >
            {laborDeclaration ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-stone-300 flex-shrink-0 mt-0.5" />
            )}
            <div className="text-left">
              <p className="text-sm font-medium text-stone-900">Labor Declaration</p>
              <p className="text-xs text-stone-500">No child or forced labor</p>
            </div>
          </button>
        </div>
      </div>

      {/* GPS Recording Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-600" />
          Walk Plot Perimeter
        </h3>

        {/* Map Preview */}
        <div className="relative h-32 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl mb-3 overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <svg width="100%" height="100%" className="text-emerald-600">
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          {isRecording && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <svg className="absolute w-24 h-24" viewBox="0 0 100 100">
                <path
                  d="M 20 50 Q 30 20 50 30 T 80 50 T 50 80 T 20 50"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                  className="animate-pulse"
                />
              </svg>
            </div>
          )}
          <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded-lg text-xs font-medium text-stone-700">
            {`GPS: 5.6037\u00B0 N, 0.1870\u00B0 W`}
          </div>
        </div>

        {/* Recording Stats */}
        {isRecording && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-emerald-50 rounded-xl p-2 text-center">
              <p className="text-xs text-emerald-600">Time</p>
              <p className="font-bold text-emerald-900">{formatTime(recordingTime)}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-2 text-center">
              <p className="text-xs text-emerald-600">Points</p>
              <p className="font-bold text-emerald-900">{Math.floor(recordingTime / 2)}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-2 text-center">
              <p className="text-xs text-emerald-600">Area</p>
              <p className="font-bold text-emerald-900">{(recordingTime * 0.1).toFixed(1)} ha</p>
            </div>
          </div>
        )}

        {/* Start/Stop Button */}
        <button
          onClick={() => {
            if (isRecording) {
              setRecordingTime(0)
            }
            setIsRecording(!isRecording)
          }}
          className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            isRecording
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {isRecording ? (
            <>
              <Square className="w-5 h-5" />
              Stop Recording
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Start Walking
            </>
          )}
        </button>
      </div>

      {/* Tips Card */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
        <p className="text-sm text-amber-900 font-medium mb-1">Tip for best results:</p>
        <p className="text-xs text-amber-700">
          Walk slowly along the boundary of the plot. Keep your phone in your hand with a clear view of the sky.
        </p>
      </div>
    </div>
  )
}

function PlotsScreen() {
  const plots = [
    { id: "P-001", name: "Cocoa Farm North", area: "2.4 ha", status: "complete", photos: 4 },
    { id: "P-002", name: "Cocoa Farm South", area: "1.8 ha", status: "pending", photos: 2 },
    { id: "P-003", name: "Mixed Crop Field", area: "0.9 ha", status: "incomplete", photos: 0 },
  ]

  const statusColors = {
    complete: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    incomplete: "bg-stone-100 text-stone-600",
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-stone-900">Your Plots</h3>
        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
          {plots.length} plots
        </span>
      </div>

      {plots.map((plot) => (
        <div
          key={plot.id}
          className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 active:bg-stone-50 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-stone-900">{plot.name}</p>
              <p className="text-xs text-stone-500">{plot.id}</p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[plot.status as keyof typeof statusColors]}`}
            >
              {plot.status}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-stone-600">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {plot.area}
            </span>
            <span className="flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" />
              {plot.photos} photos
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-stone-100 flex gap-2">
            <button className="flex-1 text-xs bg-emerald-50 text-emerald-700 py-2 rounded-lg font-medium hover:bg-emerald-100 transition-colors">
              View Details
            </button>
            <button className="flex-1 text-xs bg-stone-50 text-stone-700 py-2 rounded-lg font-medium hover:bg-stone-100 transition-colors">
              Add Harvest
            </button>
          </div>
        </div>
      ))}

      {/* Sync Status */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 mt-4">
        <div className="flex items-center gap-3">
          <Upload className="w-5 h-5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-900">2 plots pending sync</p>
            <p className="text-xs text-amber-700">Will upload when online</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsScreen() {
  return (
    <div className="p-4 space-y-4">
      {/* User Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
            <User className="w-7 h-7 text-emerald-700" />
          </div>
          <div>
            <p className="font-semibold text-stone-900">Kofi Mensah</p>
            <p className="text-xs text-stone-500">Field Agent</p>
            <p className="text-xs text-emerald-600 font-medium">Verified</p>
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <SettingsItem icon={<Languages className="w-5 h-5" />} label="Language" value="English" />
        <SettingsItem icon={<Globe className="w-5 h-5" />} label="Region" value="Ghana" />
        <SettingsItem icon={<Shield className="w-5 h-5" />} label="Data Privacy" />
        <SettingsItem icon={<FileText className="w-5 h-5" />} label="Export Data" last />
      </div>

      {/* Sync Status */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <h3 className="font-semibold text-stone-900 mb-3">Sync Status</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600">Last sync</span>
            <span className="text-sm font-medium text-stone-900">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600">Pending uploads</span>
            <span className="text-sm font-medium text-amber-600">2 items</span>
          </div>
        </div>
        <button className="w-full mt-3 py-3 bg-stone-100 text-stone-700 rounded-xl font-medium text-sm hover:bg-stone-200 transition-colors">
          Sync Now
        </button>
      </div>

      {/* App Version */}
      <div className="text-center pt-4">
        <p className="text-xs text-stone-400">Tracebud v1.0.0</p>
        <p className="text-xs text-stone-400">Prototype Build</p>
      </div>
    </div>
  )
}

function SettingsItem({
  icon,
  label,
  value,
  last = false,
}: {
  icon: React.ReactNode
  label: string
  value?: string
  last?: boolean
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 p-4 hover:bg-stone-50 transition-colors ${!last ? "border-b border-stone-100" : ""}`}
    >
      <span className="text-stone-400">{icon}</span>
      <span className="flex-1 text-left text-sm font-medium text-stone-900">{label}</span>
      {value && <span className="text-sm text-stone-500">{value}</span>}
      <ChevronRight className="w-4 h-4 text-stone-300" />
    </button>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">{icon}</div>
      <div>
        <p className="font-semibold text-stone-900">{title}</p>
        <p className="text-sm text-stone-600">{description}</p>
      </div>
    </div>
  )
}
