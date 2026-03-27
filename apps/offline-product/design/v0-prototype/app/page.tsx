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
  WifiOff,
  Wifi,
  ChevronRight,
  ChevronLeft,
  Camera,
  FileText,
  Package,
  Languages,
  Shield,
  Upload,
  Leaf,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Image,
  Scale,
  QrCode,
  Home,
  Fingerprint,
  FileCheck,
  Layers,
  Satellite,
  Mountain,
  Hand,
  Pen,
  X,
  Check,
  Info,
  Download,
  RotateCcw,
} from "lucide-react"

type Screen = "home" | "register" | "plots" | "plot-detail" | "harvest" | "documents" | "settings"
type SubScreen = null | "photos" | "documents" | "harvests" | "voucher"

export default function PrototypePage() {
  const [activeScreen, setActiveScreen] = useState<Screen>("home")
  const [subScreen, setSubScreen] = useState<SubScreen>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [waypoints, setWaypoints] = useState(0)
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null)
  const [showGpsWarning, setShowGpsWarning] = useState(false)
  
  // Compliance states
  const [fpicConsent, setFpicConsent] = useState(false)
  const [laborDeclaration, setLaborDeclaration] = useState(false)
  const [landTenure, setLandTenure] = useState(false)
  const [noDeforestation, setNoDeforestation] = useState(false)

  // Simulate recording with waypoint averaging
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((t) => t + 1)
        // Simulate waypoint averaging every 60-120 seconds
        if (recordingTime > 0 && recordingTime % 8 === 0) {
          setWaypoints((w) => w + 1)
          // Show amber warning occasionally
          if (Math.random() > 0.7) {
            setShowGpsWarning(true)
            setTimeout(() => setShowGpsWarning(false), 3000)
          }
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording, recordingTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const navigateTo = (screen: Screen, plotId?: string) => {
    setActiveScreen(screen)
    setSubScreen(null)
    if (plotId) setSelectedPlot(plotId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-stone-50 to-amber-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-emerald-900">Tracebud</h1>
              <p className="text-emerald-600 text-sm font-medium">Farmer Field App</p>
            </div>
          </div>
          <p className="text-stone-600 mt-2">Interactive Prototype - EUDR Compliance Made Simple</p>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 items-start justify-center">
          {/* Phone Frame */}
          <div className="relative mx-auto flex-shrink-0">
            {/* Phone outer frame */}
            <div className="relative w-[340px] h-[720px] bg-gradient-to-b from-slate-800 to-slate-900 rounded-[3rem] p-3 shadow-2xl">
              {/* Phone inner bezel */}
              <div className="relative w-full h-full bg-slate-950 rounded-[2.5rem] overflow-hidden">
                {/* Dynamic Island */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-20 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-800" />
                  <div className="w-3 h-3 rounded-full bg-slate-800" />
                </div>

                {/* Screen Content */}
                <div className="relative w-full h-full bg-stone-50 overflow-hidden flex flex-col">
                  {/* Status Bar */}
                  <div className="bg-emerald-700 pt-10 pb-2 px-5 flex items-center justify-between">
                    <span className="text-white text-xs font-semibold">9:41</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded-full">
                        <WifiOff className="w-3 h-3 text-amber-300" />
                        <span className="text-amber-300 text-xs font-semibold">Offline</span>
                      </div>
                    </div>
                  </div>

                  {/* App Header with Back Button */}
                  <div className="bg-emerald-700 px-4 pb-4">
                    <div className="flex items-center justify-between">
                      {activeScreen !== "home" ? (
                        <button 
                          onClick={() => {
                            if (subScreen) {
                              setSubScreen(null)
                            } else if (activeScreen === "plot-detail") {
                              navigateTo("plots")
                            } else {
                              navigateTo("home")
                            }
                          }}
                          className="flex items-center gap-1 text-white/90 hover:text-white transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                          <span className="text-sm">Back</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-semibold">Maria Santos</p>
                            <p className="text-emerald-200 text-xs">Farmer - Honduras</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="bg-emerald-600/50 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                          <span className="text-white text-xs font-medium">ES</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Screen Content */}
                  <div className="flex-1 overflow-y-auto">
                    {activeScreen === "home" && (
                      <HomeScreen 
                        navigateTo={navigateTo}
                      />
                    )}
                    {activeScreen === "register" && (
                      <RegisterPlotScreen
                        isRecording={isRecording}
                        setIsRecording={setIsRecording}
                        recordingTime={recordingTime}
                        setRecordingTime={setRecordingTime}
                        waypoints={waypoints}
                        setWaypoints={setWaypoints}
                        showGpsWarning={showGpsWarning}
                        fpicConsent={fpicConsent}
                        setFpicConsent={setFpicConsent}
                        laborDeclaration={laborDeclaration}
                        setLaborDeclaration={setLaborDeclaration}
                        landTenure={landTenure}
                        setLandTenure={setLandTenure}
                        noDeforestation={noDeforestation}
                        setNoDeforestation={setNoDeforestation}
                        formatTime={formatTime}
                      />
                    )}
                    {activeScreen === "plots" && (
                      <PlotsScreen 
                        navigateTo={navigateTo}
                        setSelectedPlot={setSelectedPlot}
                      />
                    )}
                    {activeScreen === "plot-detail" && (
                      <PlotDetailScreen
                        plotId={selectedPlot}
                        subScreen={subScreen}
                        setSubScreen={setSubScreen}
                        navigateTo={navigateTo}
                      />
                    )}
                    {activeScreen === "harvest" && (
                      <HarvestScreen navigateTo={navigateTo} />
                    )}
                    {activeScreen === "documents" && (
                      <DocumentsScreen />
                    )}
                    {activeScreen === "settings" && <SettingsScreen />}
                  </div>

                  {/* Tab Bar */}
                  <div className="bg-white border-t border-stone-200 px-2 pb-7 pt-2 shadow-lg">
                    <div className="flex justify-around">
                      <TabButton
                        icon={<Home className="w-5 h-5" />}
                        label="Home"
                        active={activeScreen === "home"}
                        onClick={() => navigateTo("home")}
                      />
                      <TabButton
                        icon={<TreeDeciduous className="w-5 h-5" />}
                        label="My Plots"
                        active={activeScreen === "plots" || activeScreen === "plot-detail"}
                        onClick={() => navigateTo("plots")}
                        badge={3}
                      />
                      <TabButton
                        icon={<Scale className="w-5 h-5" />}
                        label="Harvests"
                        active={activeScreen === "harvest"}
                        onClick={() => navigateTo("harvest")}
                      />
                      <TabButton
                        icon={<Settings className="w-5 h-5" />}
                        label="Settings"
                        active={activeScreen === "settings"}
                        onClick={() => navigateTo("settings")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights Panel */}
          <div className="flex-1 max-w-lg">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-stone-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-stone-900">EUDR Compliance Features</h2>
                  <p className="text-sm text-stone-500">Everything farmers need for EU market access</p>
                </div>
              </div>

              <div className="space-y-4">
                <FeatureCard
                  icon={<Satellite className="w-5 h-5 text-emerald-600" />}
                  title="Adaptive GPS Mapping"
                  description="Waypoint averaging handles tropical canopy interference. 60-120 second averaging at each vertex filters multipath errors."
                  tag="GNSS"
                />
                <FeatureCard
                  icon={<Camera className="w-5 h-5 text-amber-600" />}
                  title="Ground-Truth Photo Vault"
                  description="360-degree timestamped photos override satellite false-positives during EU audits. Proves pruning vs deforestation."
                  tag="Verification"
                />
                <FeatureCard
                  icon={<FileCheck className="w-5 h-5 text-blue-600" />}
                  title="Land Tenure Support"
                  description="OCR for Clave Catastral. Supports 'Productor en Posesi&oacute;n' declarations for informal smallholders."
                  tag="Legality"
                />
                <FeatureCard
                  icon={<Hand className="w-5 h-5 text-purple-600" />}
                  title="FPIC & Labor Compliance"
                  description="Digital repository for community assembly minutes, social agreements, and ILO labor standard attestations."
                  tag="Human Rights"
                />
                <FeatureCard
                  icon={<Scale className="w-5 h-5 text-rose-600" />}
                  title="Yield Cap Validation"
                  description="Cross-references harvest weight against polygon carrying capacity. Flags transactions exceeding 1,500kg/ha."
                  tag="Anti-Fraud"
                />
                <FeatureCard
                  icon={<QrCode className="w-5 h-5 text-teal-600" />}
                  title="Digital Compliance Receipt"
                  description="QR-based proof of compliance portable to any buyer. Full traceability from plot to port."
                  tag="Traceability"
                />
              </div>

              <div className="mt-6 pt-6 border-t border-stone-200">
                <div className="flex items-center gap-3 mb-4">
                  <WifiOff className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-semibold text-stone-900">100% Offline Capable</p>
                    <p className="text-sm text-stone-500">Sync when connectivity returns</p>
                  </div>
                </div>
                <p className="text-sm text-stone-600 mb-4">
                  This interactive prototype demonstrates the complete farmer journey. Click through the phone to explore all screens.
                </p>
                <a
                  href="https://exporter-demo.tracebud.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-emerald-600 text-white py-3.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 text-center"
                >
                  Try the demo dashboard for exporters
                </a>
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
  badge,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
        active 
          ? "text-emerald-700 bg-emerald-50" 
          : "text-stone-400 hover:text-stone-600 hover:bg-stone-50"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
      {badge && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  )
}

function HomeScreen({ navigateTo }: { navigateTo: (screen: Screen) => void }) {
  return (
    <div className="p-4 space-y-4">
      {/* Welcome Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-4 text-white shadow-lg">
        <p className="text-emerald-100 text-sm mb-1">Welcome back,</p>
        <h2 className="text-xl font-bold mb-3">Maria Santos</h2>
        <div className="flex gap-2">
          <div className="bg-white/20 rounded-lg px-3 py-1.5">
            <p className="text-xs text-emerald-100">Plots</p>
            <p className="text-lg font-bold">3</p>
          </div>
          <div className="bg-white/20 rounded-lg px-3 py-1.5">
            <p className="text-xs text-emerald-100">Compliant</p>
            <p className="text-lg font-bold">2</p>
          </div>
          <div className="bg-white/20 rounded-lg px-3 py-1.5">
            <p className="text-xs text-emerald-100">Pending</p>
            <p className="text-lg font-bold text-amber-300">1</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => navigateTo("register")}
          className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:border-emerald-300 hover:shadow-md transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
            <MapPin className="w-5 h-5 text-emerald-700" />
          </div>
          <p className="font-semibold text-stone-900 text-sm">Register Plot</p>
          <p className="text-xs text-stone-500">Walk perimeter</p>
        </button>

        <button 
          onClick={() => navigateTo("harvest")}
          className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:border-emerald-300 hover:shadow-md transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
            <Scale className="w-5 h-5 text-amber-700" />
          </div>
          <p className="font-semibold text-stone-900 text-sm">Log Harvest</p>
          <p className="text-xs text-stone-500">Record delivery</p>
        </button>

        <button 
          onClick={() => navigateTo("documents")}
          className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:border-emerald-300 hover:shadow-md transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-blue-700" />
          </div>
          <p className="font-semibold text-stone-900 text-sm">Documents</p>
          <p className="text-xs text-stone-500">Land & permits</p>
        </button>

        <button 
          onClick={() => navigateTo("plots")}
          className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:border-emerald-300 hover:shadow-md transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
            <QrCode className="w-5 h-5 text-purple-700" />
          </div>
          <p className="font-semibold text-stone-900 text-sm">My Vouchers</p>
          <p className="text-xs text-stone-500">Compliance QR</p>
        </button>
      </div>

      {/* Compliance Alert */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 text-sm">Action Required</p>
            <p className="text-xs text-amber-700 mt-1">
              Plot "Finca Norte" needs ground-truth photos to complete compliance verification.
            </p>
            <button 
              onClick={() => navigateTo("plots")}
              className="text-xs font-semibold text-amber-700 mt-2 flex items-center gap-1 hover:text-amber-800"
            >
              Complete Now <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Sync Status */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-stone-500" />
            <span className="text-sm font-medium text-stone-700">Sync Status</span>
          </div>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
            2 pending
          </span>
        </div>
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full w-2/3 bg-emerald-500 rounded-full" />
        </div>
        <p className="text-xs text-stone-500 mt-2">Last sync: 2 hours ago</p>
      </div>
    </div>
  )
}

function RegisterPlotScreen({
  isRecording,
  setIsRecording,
  recordingTime,
  setRecordingTime,
  waypoints,
  setWaypoints,
  showGpsWarning,
  fpicConsent,
  setFpicConsent,
  laborDeclaration,
  setLaborDeclaration,
  landTenure,
  setLandTenure,
  noDeforestation,
  setNoDeforestation,
  formatTime,
}: {
  isRecording: boolean
  setIsRecording: (v: boolean) => void
  recordingTime: number
  setRecordingTime: (v: number) => void
  waypoints: number
  setWaypoints: (v: number) => void
  showGpsWarning: boolean
  fpicConsent: boolean
  setFpicConsent: (v: boolean) => void
  laborDeclaration: boolean
  setLaborDeclaration: (v: boolean) => void
  landTenure: boolean
  setLandTenure: (v: boolean) => void
  noDeforestation: boolean
  setNoDeforestation: (v: boolean) => void
  formatTime: (s: number) => string
}) {
  const [captureMode, setCaptureMode] = useState<"walk" | "draw">("walk")
  
  return (
    <div className="p-4 space-y-4">
      {/* Plot Name Input */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <label className="text-sm font-medium text-stone-700 mb-2 block">Plot Name</label>
        <input 
          type="text"
          placeholder="e.g., Finca Norte - Caf&eacute;"
          className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {/* Capture Mode Toggle */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-stone-200">
        <div className="flex gap-2">
          <button
            onClick={() => setCaptureMode("walk")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              captureMode === "walk" 
                ? "bg-emerald-600 text-white" 
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <MapPin className="w-4 h-4" />
            Walk Perimeter
          </button>
          <button
            onClick={() => setCaptureMode("draw")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              captureMode === "draw" 
                ? "bg-emerald-600 text-white" 
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <Pen className="w-4 h-4" />
            Draw on Map
          </button>
        </div>
      </div>

      {/* GPS Recording Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        {/* Map Preview */}
        <div className="relative h-40 bg-gradient-to-br from-emerald-100 to-emerald-200 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" className="text-emerald-700">
              <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* Satellite imagery hint */}
          <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded-lg flex items-center gap-1">
            <Satellite className="w-3 h-3 text-emerald-700" />
            <span className="text-xs font-medium text-emerald-800">Offline Map</span>
          </div>

          {isRecording && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-ping absolute" />
              <div className="w-3 h-3 bg-red-500 rounded-full relative z-10" />
              <svg className="absolute w-32 h-32" viewBox="0 0 100 100">
                <path
                  d="M 15 50 Q 25 15 50 25 T 85 50 T 50 85 T 15 50"
                  fill="rgba(5, 150, 105, 0.2)"
                  stroke="#059669"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
                {/* Waypoint markers */}
                {[...Array(Math.min(waypoints, 8))].map((_, i) => (
                  <circle
                    key={i}
                    cx={15 + (i * 10)}
                    cy={50 + Math.sin(i) * 20}
                    r="4"
                    fill="#059669"
                    stroke="white"
                    strokeWidth="2"
                  />
                ))}
              </svg>
            </div>
          )}
          
          <div className="absolute bottom-2 right-2 bg-white/95 px-2 py-1 rounded-lg text-xs font-medium text-stone-700 shadow">
            {`14.8234\u00B0 N, 87.1892\u00B0 W`}
          </div>
          
          {/* GPS Warning Banner */}
          {showGpsWarning && (
            <div className="absolute top-2 right-2 left-2 bg-amber-500 text-white px-3 py-2 rounded-lg flex items-center gap-2 animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-medium">Hold steady - averaging GPS signal...</span>
            </div>
          )}
        </div>

        <div className="p-4">
          {/* Recording Stats */}
          {isRecording && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-emerald-50 rounded-xl p-2 text-center">
                <p className="text-[10px] text-emerald-600 font-medium">Time</p>
                <p className="font-bold text-emerald-900 text-sm">{formatTime(recordingTime)}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-2 text-center">
                <p className="text-[10px] text-emerald-600 font-medium">Waypoints</p>
                <p className="font-bold text-emerald-900 text-sm">{waypoints}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-2 text-center">
                <p className="text-[10px] text-emerald-600 font-medium">Sats</p>
                <p className="font-bold text-emerald-900 text-sm">8/12</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-2 text-center">
                <p className="text-[10px] text-emerald-600 font-medium">Area</p>
                <p className="font-bold text-emerald-900 text-sm">{(waypoints * 0.3).toFixed(1)}ha</p>
              </div>
            </div>
          )}

          {/* Start/Stop Button */}
          <button
            onClick={() => {
              if (isRecording) {
                setRecordingTime(0)
                setWaypoints(0)
              }
              setIsRecording(!isRecording)
            }}
            className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg ${
              isRecording
                ? "bg-red-500 text-white hover:bg-red-600 shadow-red-200"
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200"
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-5 h-5" />
                Stop & Save Polygon
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Walking
              </>
            )}
          </button>
        </div>
      </div>

      {/* Compliance Declarations */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          Required Declarations
        </h3>
        
        <div className="space-y-2">
          <ComplianceCheckbox
            checked={fpicConsent}
            onChange={() => setFpicConsent(!fpicConsent)}
            title="FPIC Consent"
            description="Free, Prior and Informed Consent obtained"
          />
          <ComplianceCheckbox
            checked={laborDeclaration}
            onChange={() => setLaborDeclaration(!laborDeclaration)}
            title="Labor Standards"
            description="No child or forced labor (ILO compliant)"
          />
          <ComplianceCheckbox
            checked={landTenure}
            onChange={() => setLandTenure(!landTenure)}
            title="Land Tenure"
            description="Legal right to use this land"
          />
          <ComplianceCheckbox
            checked={noDeforestation}
            onChange={() => setNoDeforestation(!noDeforestation)}
            title="No Deforestation"
            description="Land not deforested after Dec 31, 2020"
          />
        </div>
      </div>

      {/* Tip Card */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">GPS Averaging Active</p>
            <p className="text-xs text-blue-700 mt-1">
              Each waypoint averages 60+ seconds of readings to handle canopy interference. Walk slowly and steadily.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ComplianceCheckbox({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean
  onChange: () => void
  title: string
  description: string
}) {
  return (
    <button
      onClick={onChange}
      className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all ${
        checked 
          ? "bg-emerald-50 border border-emerald-200" 
          : "bg-stone-50 border border-transparent hover:bg-stone-100"
      }`}
    >
      {checked ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
      ) : (
        <Circle className="w-5 h-5 text-stone-300 flex-shrink-0 mt-0.5" />
      )}
      <div className="text-left">
        <p className={`text-sm font-medium ${checked ? "text-emerald-900" : "text-stone-700"}`}>{title}</p>
        <p className="text-xs text-stone-500">{description}</p>
      </div>
    </button>
  )
}

function PlotsScreen({ 
  navigateTo, 
  setSelectedPlot 
}: { 
  navigateTo: (screen: Screen, plotId?: string) => void
  setSelectedPlot: (id: string) => void 
}) {
  const plots = [
    { 
      id: "P-001", 
      name: "Finca Norte - Caf\u00e9", 
      area: "2.4 ha", 
      status: "compliant",
      deforestationStatus: "green",
      photos: 6,
      harvests: 3,
      lastSync: "Today"
    },
    { 
      id: "P-002", 
      name: "Finca Sur - Cacao", 
      area: "1.8 ha", 
      status: "review",
      deforestationStatus: "amber",
      photos: 2,
      harvests: 1,
      lastSync: "Yesterday"
    },
    { 
      id: "P-003", 
      name: "Parcela R\u00edo", 
      area: "3.2 ha", 
      status: "pending",
      deforestationStatus: "pending",
      photos: 0,
      harvests: 0,
      lastSync: "3 days ago"
    },
  ]

  const statusConfig = {
    compliant: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle, label: "Compliant" },
    review: { bg: "bg-amber-100", text: "text-amber-700", icon: AlertTriangle, label: "In Review" },
    pending: { bg: "bg-stone-100", text: "text-stone-600", icon: Clock, label: "Pending" },
  }

  const deforestationConfig = {
    green: { bg: "bg-emerald-500", label: "Clear" },
    amber: { bg: "bg-amber-500", label: "Review" },
    red: { bg: "bg-red-500", label: "Alert" },
    pending: { bg: "bg-stone-300", label: "Checking" },
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-stone-900">My Registered Plots</h3>
        <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">
          {plots.length} plots
        </span>
      </div>

      {plots.map((plot) => {
        const status = statusConfig[plot.status as keyof typeof statusConfig]
        const deforestation = deforestationConfig[plot.deforestationStatus as keyof typeof deforestationConfig]
        const StatusIcon = status.icon

        return (
          <button
            key={plot.id}
            onClick={() => {
              setSelectedPlot(plot.id)
              navigateTo("plot-detail", plot.id)
            }}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:border-emerald-300 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-stone-900">{plot.name}</p>
                <p className="text-xs text-stone-500">{plot.id} &middot; {plot.area}</p>
              </div>
              <div className={`flex items-center gap-1 ${status.bg} ${status.text} px-2 py-1 rounded-full`}>
                <StatusIcon className="w-3 h-3" />
                <span className="text-xs font-medium">{status.label}</span>
              </div>
            </div>

            {/* Deforestation Status Bar */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${deforestation.bg}`} />
              <span className="text-xs text-stone-600">Deforestation Check: {deforestation.label}</span>
            </div>

            <div className="flex items-center gap-4 text-xs text-stone-500">
              <span className="flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" />
                {plot.photos} photos
              </span>
              <span className="flex items-center gap-1">
                <Scale className="w-3.5 h-3.5" />
                {plot.harvests} harvests
              </span>
              <span className="flex items-center gap-1 ml-auto">
                <Clock className="w-3.5 h-3.5" />
                {plot.lastSync}
              </span>
            </div>
          </button>
        )
      })}

      {/* Add New Plot Button */}
      <button 
        onClick={() => navigateTo("register")}
        className="w-full py-4 rounded-2xl border-2 border-dashed border-emerald-300 text-emerald-700 font-semibold flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
      >
        <MapPin className="w-5 h-5" />
        Register New Plot
      </button>
    </div>
  )
}

function PlotDetailScreen({
  plotId,
  subScreen,
  setSubScreen,
  navigateTo,
}: {
  plotId: string | null
  subScreen: SubScreen
  setSubScreen: (s: SubScreen) => void
  navigateTo: (screen: Screen) => void
}) {
  if (subScreen === "photos") {
    return <PhotoVaultScreen />
  }
  
  if (subScreen === "documents") {
    return <PlotDocumentsScreen />
  }

  if (subScreen === "harvests") {
    return <PlotHarvestsScreen />
  }

  if (subScreen === "voucher") {
    return <VoucherScreen />
  }

  return (
    <div className="p-4 space-y-4">
      {/* Plot Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-4 text-white">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-emerald-200 text-xs">{plotId}</p>
            <h2 className="text-lg font-bold">Finca Norte - Caf&eacute;</h2>
          </div>
          <div className="bg-emerald-500/30 px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span className="text-xs font-medium">Compliant</span>
          </div>
        </div>
        <div className="flex gap-3 mt-3">
          <div className="bg-white/20 rounded-lg px-3 py-1.5">
            <p className="text-xs text-emerald-100">Area</p>
            <p className="font-bold">2.4 ha</p>
          </div>
          <div className="bg-white/20 rounded-lg px-3 py-1.5">
            <p className="text-xs text-emerald-100">Vertices</p>
            <p className="font-bold">12</p>
          </div>
          <div className="bg-white/20 rounded-lg px-3 py-1.5">
            <p className="text-xs text-emerald-100">Commodity</p>
            <p className="font-bold">Coffee</p>
          </div>
        </div>
      </div>

      {/* Deforestation Status */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <Satellite className="w-4 h-4 text-emerald-600" />
          Deforestation Analysis
        </h3>
        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-medium text-emerald-900">No Deforestation Detected</p>
            <p className="text-xs text-emerald-700">Baseline: Dec 31, 2020 (FAO definition)</p>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="space-y-2">
        <ActionCard
          icon={<Camera className="w-5 h-5 text-purple-600" />}
          title="Photo Vault"
          description="6 ground-truth photos"
          status="complete"
          onClick={() => setSubScreen("photos")}
        />
        <ActionCard
          icon={<FileText className="w-5 h-5 text-blue-600" />}
          title="Land Documents"
          description="Clave Catastral uploaded"
          status="complete"
          onClick={() => setSubScreen("documents")}
        />
        <ActionCard
          icon={<Scale className="w-5 h-5 text-amber-600" />}
          title="Harvest Records"
          description="3 harvests logged"
          status="complete"
          onClick={() => setSubScreen("harvests")}
        />
        <ActionCard
          icon={<Hand className="w-5 h-5 text-rose-600" />}
          title="FPIC & Social"
          description="Consent documented"
          status="complete"
          onClick={() => {}}
        />
      </div>

      {/* Generate Voucher Button */}
      <button 
        onClick={() => setSubScreen("voucher")}
        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-colors"
      >
        <QrCode className="w-5 h-5" />
        View Compliance Voucher
      </button>
    </div>
  )
}

function ActionCard({
  icon,
  title,
  description,
  status,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  status: "complete" | "pending" | "required"
  onClick: () => void
}) {
  const statusConfig = {
    complete: { icon: CheckCircle, color: "text-emerald-500" },
    pending: { icon: Clock, color: "text-amber-500" },
    required: { icon: AlertTriangle, color: "text-red-500" },
  }
  const StatusIcon = statusConfig[status].icon

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl p-3 shadow-sm border border-stone-200 flex items-center gap-3 hover:border-emerald-300 hover:shadow-md transition-all"
    >
      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium text-stone-900 text-sm">{title}</p>
        <p className="text-xs text-stone-500">{description}</p>
      </div>
      <StatusIcon className={`w-5 h-5 ${statusConfig[status].color}`} />
      <ChevronRight className="w-4 h-4 text-stone-400" />
    </button>
  )
}

function PhotoVaultScreen() {
  const photos = [
    { id: 1, type: "North View", time: "09:23 AM" },
    { id: 2, type: "East View", time: "09:25 AM" },
    { id: 3, type: "South View", time: "09:27 AM" },
    { id: 4, type: "West View", time: "09:29 AM" },
    { id: 5, type: "Center", time: "09:31 AM" },
    { id: 6, type: "Crop Detail", time: "09:33 AM" },
  ]

  return (
    <div className="p-4 space-y-4">
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Ground-Truth Evidence</p>
            <p className="text-xs text-blue-700 mt-1">
              These geo-tagged photos override satellite false-positives during EU audits.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {photos.map((photo) => (
          <div key={photo.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-stone-200">
            <div className="h-24 bg-gradient-to-br from-emerald-200 to-emerald-300 flex items-center justify-center">
              <Image className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="p-2">
              <p className="text-xs font-medium text-stone-900">{photo.type}</p>
              <p className="text-[10px] text-stone-500">{photo.time}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors">
        <Camera className="w-5 h-5" />
        Take New Photo
      </button>
    </div>
  )
}

function PlotDocumentsScreen() {
  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-stone-900">Land Tenure Documents</h3>

      {/* Uploaded Documents */}
      <div className="space-y-2">
        <DocumentItem
          title="Clave Catastral"
          description="National cadastral key - OCR verified"
          status="verified"
        />
        <DocumentItem
          title="Producer Declaration"
          description="Productor en Posesi&oacute;n form"
          status="verified"
        />
        <DocumentItem
          title="Municipal Letter"
          description="Local authority attestation"
          status="pending"
        />
      </div>

      {/* Protected Area Notice */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
        <div className="flex gap-3">
          <Mountain className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-900">Buffer Zone Detected</p>
            <p className="text-xs text-amber-700 mt-1">
              Plot overlaps SINAPH buffer zone. Upload management permit for compliance officer review.
            </p>
          </div>
        </div>
      </div>

      <button className="w-full bg-stone-100 text-stone-700 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-stone-200 transition-colors">
        <Upload className="w-5 h-5" />
        Upload Document
      </button>
    </div>
  )
}

function DocumentItem({
  title,
  description,
  status,
}: {
  title: string
  description: string
  status: "verified" | "pending" | "missing"
}) {
  const statusConfig = {
    verified: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
    pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
    missing: { icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
  }
  const StatusIcon = statusConfig[status].icon

  return (
    <div className={`p-3 rounded-xl flex items-center gap-3 ${statusConfig[status].bg}`}>
      <FileText className="w-5 h-5 text-stone-600" />
      <div className="flex-1">
        <p className="text-sm font-medium text-stone-900">{title}</p>
        <p className="text-xs text-stone-500">{description}</p>
      </div>
      <StatusIcon className={`w-5 h-5 ${statusConfig[status].color}`} />
    </div>
  )
}

function PlotHarvestsScreen() {
  const harvests = [
    { id: "H-001", date: "Mar 10, 2024", weight: "850 kg", buyer: "Coop Norte", valid: true },
    { id: "H-002", date: "Feb 15, 2024", weight: "720 kg", buyer: "Coop Norte", valid: true },
    { id: "H-003", date: "Jan 20, 2024", weight: "680 kg", buyer: "Exportadora Sur", valid: true },
  ]

  const yieldUsed = 2250
  const yieldCap = 3600 // 2.4ha * 1500kg

  return (
    <div className="p-4 space-y-4">
      {/* Yield Cap Indicator */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-stone-700">Yield Capacity Used</span>
          <span className="text-sm font-semibold text-emerald-700">
            {yieldUsed} / {yieldCap} kg
          </span>
        </div>
        <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${(yieldUsed / yieldCap) * 100}%` }}
          />
        </div>
        <p className="text-xs text-stone-500 mt-2">
          Based on 2.4 ha at 1,500 kg/ha carrying capacity
        </p>
      </div>

      {/* Harvest List */}
      <div className="space-y-2">
        {harvests.map((harvest) => (
          <div key={harvest.id} className="bg-white rounded-xl p-3 shadow-sm border border-stone-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-stone-900">{harvest.weight}</p>
                <p className="text-xs text-stone-500">{harvest.date}</p>
              </div>
              <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3" />
                <span className="text-xs font-medium">Valid</span>
              </div>
            </div>
            <p className="text-xs text-stone-500 mt-2">Buyer: {harvest.buyer}</p>
          </div>
        ))}
      </div>

      <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors">
        <Scale className="w-5 h-5" />
        Log New Harvest
      </button>
    </div>
  )
}

function VoucherScreen() {
  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-stone-200 text-center">
        {/* QR Code Placeholder */}
        <div className="w-40 h-40 mx-auto bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
          <QrCode className="w-20 h-20 text-stone-400" />
        </div>
        
        <h3 className="font-bold text-stone-900 text-lg">Compliance Voucher</h3>
        <p className="text-sm text-stone-500 mb-4">Scan to verify traceability</p>
        
        <div className="space-y-2 text-left bg-stone-50 rounded-xl p-4">
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Plot ID</span>
            <span className="font-medium text-stone-900">P-001</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Farmer</span>
            <span className="font-medium text-stone-900">Maria Santos</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Commodity</span>
            <span className="font-medium text-stone-900">Coffee (HS 0901)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Status</span>
            <span className="font-medium text-emerald-600">EUDR Compliant</span>
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-900">Portable Proof</p>
            <p className="text-xs text-emerald-700 mt-1">
              This voucher can be presented to any buyer as proof of EUDR compliance.
            </p>
          </div>
        </div>
      </div>

      <button className="w-full bg-stone-100 text-stone-700 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-stone-200 transition-colors">
        <Download className="w-5 h-5" />
        Download PDF
      </button>
    </div>
  )
}

function HarvestScreen({ navigateTo }: { navigateTo: (screen: Screen) => void }) {
  const [weight, setWeight] = useState("")
  const [selectedPlot, setSelectedPlot] = useState("")

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-stone-900">Log New Harvest</h3>

      {/* Plot Selection */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <label className="text-sm font-medium text-stone-700 mb-2 block">Select Plot</label>
        <select 
          value={selectedPlot}
          onChange={(e) => setSelectedPlot(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Choose a plot...</option>
          <option value="P-001">Finca Norte - Caf&eacute; (2.4 ha)</option>
          <option value="P-002">Finca Sur - Cacao (1.8 ha)</option>
          <option value="P-003">Parcela R&iacute;o (3.2 ha)</option>
        </select>
      </div>

      {/* Weight Input */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <label className="text-sm font-medium text-stone-700 mb-2 block">Harvest Weight (kg)</label>
        <input 
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Enter weight in kilograms"
          className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {weight && Number(weight) > 1500 && (
          <div className="mt-2 flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs">Exceeds typical yield - verification required</span>
          </div>
        )}
      </div>

      {/* Buyer Info */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <label className="text-sm font-medium text-stone-700 mb-2 block">Buyer / Cooperative</label>
        <input 
          type="text"
          placeholder="Enter buyer name"
          className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Yield Warning */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Yield Validation</p>
            <p className="text-xs text-blue-700 mt-1">
              Harvest weight is checked against plot carrying capacity (1,500 kg/ha) to prevent fraud.
            </p>
          </div>
        </div>
      </div>

      <button className="w-full bg-emerald-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-colors">
        <Check className="w-5 h-5" />
        Record Harvest
      </button>
    </div>
  )
}

function DocumentsScreen() {
  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-stone-900">My Documents</h3>

      {/* Document Categories */}
      <div className="space-y-2">
        <DocumentCategory
          icon={<Fingerprint className="w-5 h-5 text-emerald-600" />}
          title="Identity Documents"
          count={2}
          status="complete"
        />
        <DocumentCategory
          icon={<FileText className="w-5 h-5 text-blue-600" />}
          title="Land Tenure"
          count={3}
          status="complete"
        />
        <DocumentCategory
          icon={<Hand className="w-5 h-5 text-purple-600" />}
          title="FPIC Consent"
          count={1}
          status="complete"
        />
        <DocumentCategory
          icon={<Users className="w-5 h-5 text-amber-600" />}
          title="Labor Attestations"
          count={2}
          status="pending"
        />
        <DocumentCategory
          icon={<Mountain className="w-5 h-5 text-rose-600" />}
          title="Protected Area Permits"
          count={0}
          status="missing"
        />
      </div>

      <button className="w-full bg-stone-100 text-stone-700 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-stone-200 transition-colors">
        <Upload className="w-5 h-5" />
        Upload New Document
      </button>
    </div>
  )
}

function Users(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function DocumentCategory({
  icon,
  title,
  count,
  status,
}: {
  icon: React.ReactNode
  title: string
  count: number
  status: "complete" | "pending" | "missing"
}) {
  const statusConfig = {
    complete: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Complete" },
    pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending" },
    missing: { bg: "bg-red-100", text: "text-red-700", label: "Required" },
  }
  const config = statusConfig[status]

  return (
    <button className="w-full bg-white rounded-xl p-4 shadow-sm border border-stone-200 flex items-center gap-3 hover:border-emerald-300 transition-all">
      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium text-stone-900 text-sm">{title}</p>
        <p className="text-xs text-stone-500">{count} documents</p>
      </div>
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
      <ChevronRight className="w-4 h-4 text-stone-400" />
    </button>
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
          <div className="flex-1">
            <p className="font-semibold text-stone-900">Maria Santos</p>
            <p className="text-xs text-stone-500">Farmer - Honduras</p>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-emerald-600 font-medium">Verified Producer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <SettingsItem icon={<Languages className="w-5 h-5" />} label="Language" value="Espa&ntilde;ol" />
        <SettingsItem icon={<Globe className="w-5 h-5" />} label="Region" value="Honduras" />
        <SettingsItem icon={<Shield className="w-5 h-5" />} label="Data Privacy" />
        <SettingsItem icon={<FileText className="w-5 h-5" />} label="Export My Data" last />
      </div>

      {/* Sync Status */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-emerald-600" />
          Sync Status
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600">Last sync</span>
            <span className="text-sm font-medium text-stone-900">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600">Pending uploads</span>
            <span className="text-sm font-medium text-amber-600">2 items</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600">Storage used</span>
            <span className="text-sm font-medium text-stone-900">48 MB</span>
          </div>
        </div>
        <button className="w-full mt-4 bg-emerald-50 text-emerald-700 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors">
          <RotateCcw className="w-4 h-4" />
          Force Sync Now
        </button>
      </div>

      {/* App Info */}
      <div className="text-center py-4">
        <p className="text-xs text-stone-400">Tracebud Field App v1.0.0</p>
        <p className="text-xs text-stone-400">EUDR Compliance Ready</p>
      </div>
    </div>
  )
}

function SettingsItem({
  icon,
  label,
  value,
  last,
}: {
  icon: React.ReactNode
  label: string
  value?: string
  last?: boolean
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-stone-50 transition-colors ${
        !last ? "border-b border-stone-100" : ""
      }`}
    >
      <span className="text-stone-500">{icon}</span>
      <span className="flex-1 text-left text-sm font-medium text-stone-900">{label}</span>
      {value && <span className="text-sm text-stone-500">{value}</span>}
      <ChevronRight className="w-4 h-4 text-stone-400" />
    </button>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  tag,
}: {
  icon: React.ReactNode
  title: string
  description: string
  tag: string
}) {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-stone-50 border border-stone-100 hover:bg-stone-100 transition-colors">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-stone-900 text-sm">{title}</p>
          <span className="text-[10px] font-medium bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded">
            {tag}
          </span>
        </div>
        <p className="text-xs text-stone-600 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
