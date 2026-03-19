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
  ChevronRight,
  ChevronLeft,
  Camera,
  FileText,
  Languages,
  Shield,
  Upload,
  Leaf,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Image,
  Scale,
  QrCode,
  Home,
  Fingerprint,
  FileCheck,
  Satellite,
  Hand,
  Pen,
  X,
  Check,
  Info,
  Download,
  RotateCcw,
  Plus,
  Navigation,
  Target,
  Crosshair,
  Timer,
  Signal,
  AlertCircle,
  Users,
  FileImage,
  Stamp,
  Map,
  Smartphone,
  ScanLine,
} from "lucide-react"

type Screen = 
  | "home" 
  | "register" 
  | "register-method"
  | "register-walk"
  | "register-centroid"
  | "register-draw"
  | "register-declarations"
  | "register-photos"
  | "register-complete"
  | "plots" 
  | "plot-detail" 
  | "plot-photos"
  | "plot-documents"
  | "plot-harvests"
  | "plot-voucher"
  | "harvest" 
  | "harvest-select"
  | "harvest-weigh"
  | "harvest-complete"
  | "documents" 
  | "documents-identity"
  | "documents-land"
  | "documents-fpic"
  | "documents-labor"
  | "settings"

export default function PrototypePage() {
  const [activeScreen, setActiveScreen] = useState<Screen>("home")
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [waypoints, setWaypoints] = useState(0)
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null)
  const [showGpsWarning, setShowGpsWarning] = useState(false)
  const [waypointAveraging, setWaypointAveraging] = useState(0)
  const [gpsAccuracy, setGpsAccuracy] = useState<"good" | "amber" | "poor">("good")
  const [harvestWeight, setHarvestWeight] = useState("")
  
  // Registration states
  const [plotName, setPlotName] = useState("")
  const [plotSize, setPlotSize] = useState<"small" | "large" | null>(null)
  
  // Compliance states
  const [fpicConsent, setFpicConsent] = useState(false)
  const [laborDeclaration, setLaborDeclaration] = useState(false)
  const [landTenure, setLandTenure] = useState(false)
  const [noDeforestation, setNoDeforestation] = useState(false)
  const [photosTaken, setPhotosTaken] = useState(0)

  // Simulate recording with waypoint averaging
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((t) => t + 1)
        // Simulate waypoint averaging (60-120 second intervals)
        setWaypointAveraging((w) => {
          if (w >= 100) {
            setWaypoints((wp) => wp + 1)
            // Random GPS quality simulation
            const rand = Math.random()
            if (rand > 0.8) {
              setGpsAccuracy("poor")
              setShowGpsWarning(true)
            } else if (rand > 0.6) {
              setGpsAccuracy("amber")
              setShowGpsWarning(true)
            } else {
              setGpsAccuracy("good")
              setShowGpsWarning(false)
            }
            return 0
          }
          return w + 12
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  useEffect(() => {
    if (showGpsWarning) {
      const timer = setTimeout(() => setShowGpsWarning(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showGpsWarning])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const navigateTo = (screen: Screen, plotId?: string) => {
    setActiveScreen(screen)
    if (plotId) setSelectedPlot(plotId)
  }

  const resetRegistration = () => {
    setIsRecording(false)
    setRecordingTime(0)
    setWaypoints(0)
    setWaypointAveraging(0)
    setPlotName("")
    setPlotSize(null)
    setFpicConsent(false)
    setLaborDeclaration(false)
    setLandTenure(false)
    setNoDeforestation(false)
    setPhotosTaken(0)
  }

  const getBackScreen = (): Screen => {
    const backMap: Record<Screen, Screen> = {
      "home": "home",
      "register": "home",
      "register-method": "register",
      "register-walk": "register-method",
      "register-draw": "register-method",
      "register-declarations": "register-walk",
      "register-photos": "register-declarations",
      "register-complete": "home",
      "plots": "home",
      "plot-detail": "plots",
      "plot-photos": "plot-detail",
      "plot-documents": "plot-detail",
      "plot-harvests": "plot-detail",
      "plot-voucher": "plot-detail",
      "harvest": "home",
      "harvest-select": "harvest",
      "harvest-weigh": "harvest-select",
      "harvest-complete": "home",
      "documents": "home",
      "documents-identity": "documents",
      "documents-land": "documents",
      "documents-fpic": "documents",
      "documents-labor": "documents",
      "settings": "home",
    }
    return backMap[activeScreen] || "home"
  }

  const getScreenTitle = (): string => {
    const titles: Record<Screen, string> = {
      "home": "Home",
      "register": "Register Plot",
      "register-method": "Capture Method",
      "register-walk": "Walk Perimeter",
      "register-centroid": "Capture Plot Center",
      "register-draw": "Draw on Map",
      "register-declarations": "Declarations",
      "register-photos": "Ground-Truth Photos",
      "register-complete": "Registration Complete",
      "plots": "My Plots",
      "plot-detail": "Plot Details",
      "plot-photos": "Photo Vault",
      "plot-documents": "Land Documents",
      "plot-harvests": "Harvest Records",
      "plot-voucher": "Compliance Voucher",
      "harvest": "Log Harvest",
      "harvest-select": "Select Plot",
      "harvest-weigh": "Record Weight",
      "harvest-complete": "Harvest Logged",
      "documents": "Documents",
      "documents-identity": "Identity Documents",
      "documents-land": "Land Tenure",
      "documents-fpic": "FPIC Consent",
      "documents-labor": "Labor Standards",
      "settings": "Settings",
    }
    return titles[activeScreen] || "Tracebud"
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
            <div className="relative w-[340px] h-[720px] bg-gradient-to-b from-slate-800 to-slate-900 rounded-[3rem] p-3 shadow-2xl">
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

                  {/* App Header */}
                  <div className="bg-emerald-700 px-4 pb-4">
                    <div className="flex items-center justify-between">
                      {activeScreen !== "home" ? (
                        <button 
                          onClick={() => navigateTo(getBackScreen())}
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
                      {activeScreen !== "home" && (
                        <span className="text-white font-medium text-sm">{getScreenTitle()}</span>
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
                    {activeScreen === "home" && <HomeScreen navigateTo={navigateTo} />}
                    
                    {/* Registration Flow */}
                    {activeScreen === "register" && (
                      <RegisterStartScreen 
                        navigateTo={navigateTo}
                        plotName={plotName}
                        setPlotName={setPlotName}
                        plotSize={plotSize}
                        setPlotSize={setPlotSize}
                      />
                    )}
                    {activeScreen === "register-method" && (
                      <RegisterMethodScreen navigateTo={navigateTo} plotSize={plotSize} />
                    )}
                    {activeScreen === "register-walk" && (
                      <RegisterWalkScreen
                        navigateTo={navigateTo}
                        isRecording={isRecording}
                        setIsRecording={setIsRecording}
                        recordingTime={recordingTime}
                        waypoints={waypoints}
                        waypointAveraging={waypointAveraging}
                        gpsAccuracy={gpsAccuracy}
                        showGpsWarning={showGpsWarning}
                        formatTime={formatTime}
                      />
                    )}
                    {activeScreen === "register-centroid" && (
                      <RegisterCentroidScreen
                        navigateTo={navigateTo}
                        isRecording={isRecording}
                        setIsRecording={setIsRecording}
                        recordingTime={recordingTime}
                        gpsAccuracy={gpsAccuracy}
                        showGpsWarning={showGpsWarning}
                        formatTime={formatTime}
                      />
                    )}
                    {activeScreen === "register-draw" && (
                      <RegisterDrawScreen navigateTo={navigateTo} />
                    )}
                    {activeScreen === "register-declarations" && (
                      <RegisterDeclarationsScreen
                        navigateTo={navigateTo}
                        fpicConsent={fpicConsent}
                        setFpicConsent={setFpicConsent}
                        laborDeclaration={laborDeclaration}
                        setLaborDeclaration={setLaborDeclaration}
                        landTenure={landTenure}
                        setLandTenure={setLandTenure}
                        noDeforestation={noDeforestation}
                        setNoDeforestation={setNoDeforestation}
                      />
                    )}
                    {activeScreen === "register-photos" && (
                      <RegisterPhotosScreen
                        navigateTo={navigateTo}
                        photosTaken={photosTaken}
                        setPhotosTaken={setPhotosTaken}
                      />
                    )}
                    {activeScreen === "register-complete" && (
                      <RegisterCompleteScreen navigateTo={navigateTo} resetRegistration={resetRegistration} />
                    )}

                    {/* Plots Flow */}
                    {activeScreen === "plots" && <PlotsScreen navigateTo={navigateTo} setSelectedPlot={setSelectedPlot} />}
                    {activeScreen === "plot-detail" && <PlotDetailScreen navigateTo={navigateTo} plotId={selectedPlot} />}
                    {activeScreen === "plot-photos" && <PlotPhotosScreen />}
                    {activeScreen === "plot-documents" && <PlotDocumentsScreen />}
                    {activeScreen === "plot-harvests" && <PlotHarvestsScreen />}
                    {activeScreen === "plot-voucher" && <PlotVoucherScreen />}

                    {/* Harvest Flow */}
                    {activeScreen === "harvest" && <HarvestScreen navigateTo={navigateTo} />}
                    {activeScreen === "harvest-select" && <HarvestSelectScreen navigateTo={navigateTo} />}
                    {activeScreen === "harvest-weigh" && (
                      <HarvestWeighScreen 
                        navigateTo={navigateTo}
                        weight={harvestWeight}
                        setWeight={setHarvestWeight}
                      />
                    )}
                    {activeScreen === "harvest-complete" && <HarvestCompleteScreen navigateTo={navigateTo} />}

                    {/* Documents Flow */}
                    {activeScreen === "documents" && <DocumentsScreen navigateTo={navigateTo} />}
                    {activeScreen === "documents-identity" && <DocumentsIdentityScreen />}
                    {activeScreen === "documents-land" && <DocumentsLandScreen />}
                    {activeScreen === "documents-fpic" && <DocumentsFPICScreen />}
                    {activeScreen === "documents-labor" && <DocumentsLaborScreen />}

                    {/* Settings */}
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
                        active={activeScreen.startsWith("plot")}
                        onClick={() => navigateTo("plots")}
                        badge={3}
                      />
                      <TabButton
                        icon={<Scale className="w-5 h-5" />}
                        label="Harvests"
                        active={activeScreen.startsWith("harvest")}
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
                  description="OCR for Clave Catastral. Supports 'Productor en Posesion' declarations for informal smallholders."
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
                  Click through the phone to explore all screens and features.
                </p>
                <button className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
                  Request Full Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ COMPONENTS ============

function TabButton({ icon, label, active, onClick, badge }: {
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
        active ? "text-emerald-700 bg-emerald-50" : "text-stone-400 hover:text-stone-600"
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

function FeatureCard({ icon, title, description, tag }: {
  icon: React.ReactNode
  title: string
  description: string
  tag: string
}) {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-stone-900 text-sm">{title}</p>
          <span className="text-[10px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded font-medium">{tag}</span>
        </div>
        <p className="text-xs text-stone-600 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function Checkbox({ checked, onChange, label, description }: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-start gap-3 p-3 rounded-xl bg-white border border-stone-200 text-left hover:border-emerald-300 transition-colors"
    >
      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
        checked ? "bg-emerald-600 border-emerald-600" : "border-stone-300"
      }`}>
        {checked && <Check className="w-4 h-4 text-white" />}
      </div>
      <div className="flex-1">
        <p className="font-medium text-stone-900 text-sm">{label}</p>
        {description && <p className="text-xs text-stone-500 mt-0.5">{description}</p>}
      </div>
    </button>
  )
}

// ============ SCREENS ============

function HomeScreen({ navigateTo }: { navigateTo: (s: Screen) => void }) {
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
        <button onClick={() => navigateTo("register")} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:border-emerald-300 transition-all text-left">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
            <MapPin className="w-5 h-5 text-emerald-700" />
          </div>
          <p className="font-semibold text-stone-900 text-sm">Register Plot</p>
          <p className="text-xs text-stone-500">Walk perimeter</p>
        </button>

        <button onClick={() => navigateTo("harvest")} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:border-emerald-300 transition-all text-left">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
            <Scale className="w-5 h-5 text-amber-700" />
          </div>
          <p className="font-semibold text-stone-900 text-sm">Log Harvest</p>
          <p className="text-xs text-stone-500">Record delivery</p>
        </button>

        <button onClick={() => navigateTo("documents")} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:border-emerald-300 transition-all text-left">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-blue-700" />
          </div>
          <p className="font-semibold text-stone-900 text-sm">Documents</p>
          <p className="text-xs text-stone-500">Land & permits</p>
        </button>

        <button onClick={() => navigateTo("plots")} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:border-emerald-300 transition-all text-left">
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
            <p className="text-xs text-amber-700 mt-1">Plot "Finca Norte" needs ground-truth photos.</p>
            <button onClick={() => navigateTo("plots")} className="text-xs font-semibold text-amber-700 mt-2 flex items-center gap-1">
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
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">3 pending</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-600">Finca Sur polygon</span>
            <span className="text-amber-600 font-medium">Queued</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-600">Photo vault (4 images)</span>
            <span className="text-amber-600 font-medium">Queued</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-600">Harvest record - 45kg</span>
            <span className="text-amber-600 font-medium">Queued</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ REGISTRATION FLOW ============

function RegisterStartScreen({ navigateTo, plotName, setPlotName, plotSize, setPlotSize }: {
  navigateTo: (s: Screen) => void
  plotName: string
  setPlotName: (v: string) => void
  plotSize: "small" | "large" | null
  setPlotSize: (v: "small" | "large" | null) => void
}) {
  return (
    <div className="p-4 space-y-4">
      <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-900 text-sm">Plot Registration</p>
            <p className="text-xs text-emerald-700 mt-1">
              Register your plot to receive EUDR compliance certification and access EU markets.
            </p>
          </div>
        </div>
      </div>

      {/* Plot Name */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <label className="block text-sm font-medium text-stone-700 mb-2">Plot Name</label>
        <input
          type="text"
          value={plotName}
          onChange={(e) => setPlotName(e.target.value)}
          placeholder="e.g., Finca Nueva"
          className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {/* Plot Size Selection */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <label className="block text-sm font-medium text-stone-700 mb-3">Estimated Plot Size</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPlotSize("small")}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              plotSize === "small" ? "border-emerald-500 bg-emerald-50" : "border-stone-200"
            }`}
          >
            <p className="font-semibold text-stone-900 text-sm">{"< 4 Hectares"}</p>
            <p className="text-xs text-stone-500 mt-1">Point or polygon capture</p>
          </button>
          <button
            onClick={() => setPlotSize("large")}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              plotSize === "large" ? "border-emerald-500 bg-emerald-50" : "border-stone-200"
            }`}
          >
            <p className="font-semibold text-stone-900 text-sm">{">= 4 Hectares"}</p>
            <p className="text-xs text-stone-500 mt-1">Full polygon required</p>
          </button>
        </div>
      </div>

      {/* Contiguity Warning */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-900 text-sm">Contiguity Rule</p>
            <p className="text-xs text-blue-700 mt-1">
              Fields separated by roads, rivers, or railways must be registered as separate plots with unique GeoIDs.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigateTo("register-method")}
        disabled={!plotName || !plotSize}
        className={`w-full py-4 rounded-xl font-semibold transition-all ${
          plotName && plotSize
            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
            : "bg-stone-200 text-stone-400"
        }`}
      >
        Continue
      </button>
    </div>
  )
}

function RegisterMethodScreen({ navigateTo, plotSize }: {
  navigateTo: (s: Screen) => void
  plotSize: "small" | "large" | null
}) {
  return (
    <div className="p-4 space-y-4">
      <p className="text-sm text-stone-600">Choose how to capture your plot boundaries:</p>

      {/* Walk Perimeter Option */}
      <button
        onClick={() => navigateTo("register-walk")}
        className="w-full bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:border-emerald-300 transition-all text-left"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Navigation className="w-6 h-6 text-emerald-700" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-stone-900">Walk Perimeter</p>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Recommended</span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Walk around your plot while GPS records waypoints with averaging to filter canopy interference.
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <Timer className="w-3 h-3 text-stone-400" />
                <span className="text-xs text-stone-500">60-120s per point</span>
              </div>
              <div className="flex items-center gap-1">
                <Signal className="w-3 h-3 text-stone-400" />
                <span className="text-xs text-stone-500">Dual-freq GPS</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400" />
        </div>
      </button>

      {/* Draw on Map Option */}
      <button
        onClick={() => navigateTo("register-draw")}
        className="w-full bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:border-emerald-300 transition-all text-left"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Pen className="w-6 h-6 text-blue-700" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-stone-900">Draw on Map</p>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Fallback</span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Manually trace your plot boundary on offline satellite imagery when GPS is unavailable.
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <Map className="w-3 h-3 text-stone-400" />
                <span className="text-xs text-stone-500">Offline tiles</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400" />
        </div>
      </button>

      {plotSize === "small" && (
        <button
          onClick={() => navigateTo("register-centroid")}
          className="w-full bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:border-emerald-300 transition-all text-left"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-purple-700" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-stone-900">Centroid Only</p>
              <p className="text-xs text-stone-500 mt-1">
                For plots under 4ha, capture a single averaged center point instead of full perimeter.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-400" />
          </div>
        </button>
      )}
    </div>
  )
}

function RegisterWalkScreen({ navigateTo, isRecording, setIsRecording, recordingTime, waypoints, waypointAveraging, gpsAccuracy, showGpsWarning, formatTime }: {
  navigateTo: (s: Screen) => void
  isRecording: boolean
  setIsRecording: (v: boolean) => void
  recordingTime: number
  waypoints: number
  waypointAveraging: number
  gpsAccuracy: "good" | "amber" | "poor"
  showGpsWarning: boolean
  formatTime: (s: number) => string
}) {
  return (
    <div className="p-4 space-y-4">
      {/* GPS Status Card */}
      <div className={`rounded-2xl p-4 border ${
        gpsAccuracy === "good" ? "bg-emerald-50 border-emerald-200" :
        gpsAccuracy === "amber" ? "bg-amber-50 border-amber-200" :
        "bg-red-50 border-red-200"
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Satellite className={`w-5 h-5 ${
              gpsAccuracy === "good" ? "text-emerald-600" :
              gpsAccuracy === "amber" ? "text-amber-600" :
              "text-red-600"
            }`} />
            <span className="text-sm font-semibold text-stone-900">GPS Signal</span>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            gpsAccuracy === "good" ? "bg-emerald-200 text-emerald-800" :
            gpsAccuracy === "amber" ? "bg-amber-200 text-amber-800" :
            "bg-red-200 text-red-800"
          }`}>
            {gpsAccuracy === "good" ? "Strong" : gpsAccuracy === "amber" ? "Moderate" : "Weak"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-stone-500">HDOP</span>
            <p className="font-semibold text-stone-900">{gpsAccuracy === "good" ? "1.2" : gpsAccuracy === "amber" ? "2.8" : "4.5"}</p>
          </div>
          <div>
            <span className="text-stone-500">Satellites</span>
            <p className="font-semibold text-stone-900">{gpsAccuracy === "good" ? "12" : gpsAccuracy === "amber" ? "8" : "5"}</p>
          </div>
          <div>
            <span className="text-stone-500">Mode</span>
            <p className="font-semibold text-stone-900">L1/L5</p>
          </div>
        </div>
      </div>

      {/* Amber Warning */}
      {showGpsWarning && (
        <div className="bg-amber-100 rounded-xl p-3 border border-amber-300 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <p className="text-xs font-semibold text-amber-800">Hold steady - averaging in progress</p>
          </div>
        </div>
      )}

      {/* Map Preview */}
      <div className="relative bg-stone-200 rounded-2xl h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-emerald-800/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Crosshair className={`w-12 h-12 mx-auto mb-2 ${isRecording ? "text-emerald-500 animate-pulse" : "text-stone-400"}`} />
            <p className="text-xs text-stone-600 font-medium">
              {isRecording ? "Recording GPS track..." : "Start to begin capture"}
            </p>
          </div>
        </div>
        {/* Waypoint indicators */}
        {waypoints > 0 && (
          <div className="absolute bottom-3 left-3 flex gap-1">
            {Array.from({ length: Math.min(waypoints, 6) }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-emerald-500" />
            ))}
            {waypoints > 6 && <span className="text-xs text-white font-medium">+{waypoints - 6}</span>}
          </div>
        )}
        {/* Coordinates */}
        <div className="absolute bottom-3 right-3 bg-white/90 px-2 py-1 rounded-lg text-xs font-mono text-stone-700">
          {`14.8234\u00B0N, 87.1892\u00B0W`}
        </div>
      </div>

      {/* Waypoint Averaging Progress */}
      {isRecording && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-700">Waypoint Averaging</span>
            <span className="text-xs text-emerald-600 font-semibold">{waypointAveraging}%</span>
          </div>
          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
              style={{ width: `${waypointAveraging}%` }}
            />
          </div>
          <p className="text-xs text-stone-500 mt-2">Averaging 60-120 seconds to filter multipath errors</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-stone-200">
          <Clock className="w-5 h-5 text-stone-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-stone-900">{formatTime(recordingTime)}</p>
          <p className="text-xs text-stone-500">Duration</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-stone-200">
          <MapPin className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-stone-900">{waypoints}</p>
          <p className="text-xs text-stone-500">Waypoints</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-stone-200">
          <Navigation className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-stone-900">{(waypoints * 0.15).toFixed(1)}</p>
          <p className="text-xs text-stone-500">Est. Ha</p>
        </div>
      </div>

      {/* Recording Controls */}
      <div className="flex gap-3">
        {!isRecording ? (
          <button
            onClick={() => setIsRecording(true)}
            className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
          >
            <Play className="w-5 h-5" />
            Start Recording
          </button>
        ) : (
          <>
            <button
              onClick={() => setIsRecording(false)}
              className="flex-1 bg-red-500 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <Square className="w-5 h-5" />
              Stop
            </button>
            <button
              onClick={() => {
                setIsRecording(false)
                navigateTo("register-declarations")
              }}
              disabled={waypoints < 3}
              className={`flex-1 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                waypoints >= 3 ? "bg-emerald-600 text-white" : "bg-stone-200 text-stone-400"
              }`}
            >
              <Check className="w-5 h-5" />
              Complete
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function RegisterCentroidScreen({ navigateTo, isRecording, setIsRecording, recordingTime, gpsAccuracy, showGpsWarning, formatTime }: {
  navigateTo: (s: Screen) => void
  isRecording: boolean
  setIsRecording: (v: boolean) => void
  recordingTime: number
  gpsAccuracy: "good" | "amber" | "poor"
  showGpsWarning: boolean
  formatTime: (s: number) => string
}) {
  return (
    <div className="p-4 space-y-4">
      {/* GPS Status Card */}
      <div className={`rounded-2xl p-4 border ${
        gpsAccuracy === "good" ? "bg-emerald-50 border-emerald-200" :
        gpsAccuracy === "amber" ? "bg-amber-50 border-amber-200" :
        "bg-red-50 border-red-200"
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Satellite className={`w-5 h-5 ${
              gpsAccuracy === "good" ? "text-emerald-600" :
              gpsAccuracy === "amber" ? "text-amber-600" :
              "text-red-600"
            }`} />
            <span className="text-sm font-semibold text-stone-900">GPS Signal</span>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            gpsAccuracy === "good" ? "bg-emerald-200 text-emerald-800" :
            gpsAccuracy === "amber" ? "bg-amber-200 text-amber-800" :
            "bg-red-200 text-red-800"
          }`}>
            {gpsAccuracy === "good" ? "Strong" : gpsAccuracy === "amber" ? "Moderate" : "Weak"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-stone-500">HDOP</span>
            <p className="font-semibold text-stone-900">{gpsAccuracy === "good" ? "1.2" : gpsAccuracy === "amber" ? "2.8" : "4.5"}</p>
          </div>
          <div>
            <span className="text-stone-500">Satellites</span>
            <p className="font-semibold text-stone-900">{gpsAccuracy === "good" ? "12" : gpsAccuracy === "amber" ? "8" : "5"}</p>
          </div>
          <div>
            <span className="text-stone-500">Mode</span>
            <p className="font-semibold text-stone-900">L1/L5</p>
          </div>
        </div>
      </div>

      {/* Warning Message */}
      {showGpsWarning && (
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">GPS Averaging in Progress</p>
              <p className="text-xs text-amber-700 mt-1">Hold phone steady for accurate center point reading.</p>
            </div>
          </div>
        </div>
      )}

      {/* Recording Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
        <div className="flex flex-col items-center gap-6">
          {/* Status Circle */}
          <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
            isRecording 
              ? "bg-emerald-100 animate-pulse" 
              : "bg-stone-100"
          }`}>
            <MapPin className={`w-12 h-12 ${
              isRecording ? "text-emerald-600" : "text-stone-400"
            }`} />
          </div>

          {/* Instructions */}
          <div className="text-center">
            <p className="text-sm font-semibold text-stone-900">
              {isRecording ? "Recording Center Point" : "Ready to Record"}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {isRecording 
                ? "Keep phone steady at plot center for stable GPS reading." 
                : "Stand at the center of your plot and press record."}
            </p>
          </div>

          {/* Timer */}
          {isRecording && (
            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span className="font-mono font-semibold text-emerald-700">{formatTime(recordingTime)}</span>
            </div>
          )}

          {/* Record Button */}
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              isRecording
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
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
                Start Recording
              </>
            )}
          </button>

          {/* Recommended Duration */}
          <p className="text-xs text-stone-500">Recommended: 60-120 seconds for best accuracy</p>
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={() => navigateTo("register-declarations")}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all"
      >
        Continue to Declarations
      </button>
    </div>
  )
}

function RegisterDrawScreen({ navigateTo }: { navigateTo: (s: Screen) => void }) {
  return (
    <div className="p-4 space-y-4">
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            Trace your plot boundary on the satellite map. Pinch to zoom and tap to add vertices.
          </p>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative bg-emerald-900/20 rounded-2xl h-64 overflow-hidden border-2 border-dashed border-emerald-300">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Pen className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-stone-700">Tap to add vertices</p>
            <p className="text-xs text-stone-500">Connect at least 3 points</p>
          </div>
        </div>
        <div className="absolute bottom-3 left-3 bg-white/90 px-2 py-1 rounded-lg text-xs font-medium text-stone-700">
          Offline satellite tiles loaded
        </div>
      </div>

      <div className="flex gap-3">
        <button className="flex-1 bg-stone-200 text-stone-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
          <RotateCcw className="w-4 h-4" />
          Undo
        </button>
        <button className="flex-1 bg-red-100 text-red-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
          <X className="w-4 h-4" />
          Clear
        </button>
      </div>

      <button
        onClick={() => navigateTo("register-declarations")}
        className="w-full bg-emerald-600 text-white py-4 rounded-xl font-semibold shadow-lg shadow-emerald-200"
      >
        Continue to Declarations
      </button>
    </div>
  )
}

function RegisterDeclarationsScreen({ navigateTo, fpicConsent, setFpicConsent, laborDeclaration, setLaborDeclaration, landTenure, setLandTenure, noDeforestation, setNoDeforestation }: {
  navigateTo: (s: Screen) => void
  fpicConsent: boolean
  setFpicConsent: (v: boolean) => void
  laborDeclaration: boolean
  setLaborDeclaration: (v: boolean) => void
  landTenure: boolean
  setLandTenure: (v: boolean) => void
  noDeforestation: boolean
  setNoDeforestation: (v: boolean) => void
}) {
  const allChecked = fpicConsent && laborDeclaration && landTenure && noDeforestation

  return (
    <div className="p-4 space-y-4">
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-900 text-sm">Required Declarations</p>
            <p className="text-xs text-amber-700 mt-1">
              These attestations are required for EUDR compliance and EU market access.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Checkbox
          checked={landTenure}
          onChange={setLandTenure}
          label="Land Tenure Declaration"
          description="I have legal right to use this land (deed, possession, or customary agreement)"
        />
        <Checkbox
          checked={noDeforestation}
          onChange={setNoDeforestation}
          label="Deforestation-Free Declaration"
          description="This plot has not been deforested after December 31, 2020"
        />
        <Checkbox
          checked={fpicConsent}
          onChange={setFpicConsent}
          label="FPIC Consent"
          description="Free, Prior, and Informed Consent obtained from affected communities"
        />
        <Checkbox
          checked={laborDeclaration}
          onChange={setLaborDeclaration}
          label="Labor Standards"
          description="No child labor, forced labor, or unsafe working conditions"
        />
      </div>

      <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
        <p className="text-xs text-stone-600">
          Supporting documents can be uploaded in the Documents section after registration.
        </p>
      </div>

      <button
        onClick={() => navigateTo("register-photos")}
        disabled={!allChecked}
        className={`w-full py-4 rounded-xl font-semibold transition-all ${
          allChecked ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-stone-200 text-stone-400"
        }`}
      >
        Continue to Photos
      </button>
    </div>
  )
}

function RegisterPhotosScreen({ navigateTo, photosTaken, setPhotosTaken }: {
  navigateTo: (s: Screen) => void
  photosTaken: number
  setPhotosTaken: (v: number) => void
}) {
  const directions = ["North", "East", "South", "West"]

  return (
    <div className="p-4 space-y-4">
      <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
        <div className="flex gap-3">
          <Camera className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-900 text-sm">Ground-Truth Photo Vault</p>
            <p className="text-xs text-emerald-700 mt-1">
              Take 360-degree photos to prove land use and override satellite false-positives during EU audits.
            </p>
          </div>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 gap-3">
        {directions.map((dir, i) => (
          <button
            key={dir}
            onClick={() => setPhotosTaken(Math.min(4, photosTaken + 1))}
            className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
              i < photosTaken 
                ? "bg-emerald-100 border-emerald-400" 
                : "bg-stone-100 border-stone-300 hover:border-emerald-400"
            }`}
          >
            {i < photosTaken ? (
              <>
                <CheckCircle className="w-8 h-8 text-emerald-600 mb-1" />
                <span className="text-xs font-medium text-emerald-700">{dir}</span>
              </>
            ) : (
              <>
                <Camera className="w-8 h-8 text-stone-400 mb-1" />
                <span className="text-xs font-medium text-stone-500">{dir}</span>
                <span className="text-xs text-stone-400">Tap to capture</span>
              </>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-stone-200">
        <span className="text-sm font-medium text-stone-700">Photos captured</span>
        <span className={`text-sm font-bold ${photosTaken >= 4 ? "text-emerald-600" : "text-amber-600"}`}>
          {photosTaken}/4
        </span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigateTo("register-complete")}
          className="flex-1 bg-stone-200 text-stone-700 py-4 rounded-xl font-semibold"
        >
          Skip for Now
        </button>
        <button
          onClick={() => navigateTo("register-complete")}
          disabled={photosTaken < 4}
          className={`flex-1 py-4 rounded-xl font-semibold ${
            photosTaken >= 4 ? "bg-emerald-600 text-white" : "bg-stone-200 text-stone-400"
          }`}
        >
          Complete
        </button>
      </div>
    </div>
  )
}

function RegisterCompleteScreen({ navigateTo, resetRegistration }: {
  navigateTo: (s: Screen) => void
  resetRegistration: () => void
}) {
  return (
    <div className="p-4 space-y-4 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
        <CheckCircle className="w-10 h-10 text-emerald-600" />
      </div>
      
      <div>
        <h2 className="text-xl font-bold text-stone-900">Plot Registered!</h2>
        <p className="text-sm text-stone-600 mt-2">
          Your plot has been saved locally and will sync when connectivity is available.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-left">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-stone-700">Compliance Status</span>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">Pending Review</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-stone-600">GPS polygon captured</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-stone-600">All declarations signed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-stone-600">Deforestation check pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-stone-600">Awaiting sync</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-4">
        <button
          onClick={() => {
            resetRegistration()
            navigateTo("register")
          }}
          className="w-full bg-emerald-600 text-white py-4 rounded-xl font-semibold shadow-lg shadow-emerald-200"
        >
          Register Another Plot
        </button>
        <button
          onClick={() => {
            resetRegistration()
            navigateTo("home")
          }}
          className="w-full bg-stone-200 text-stone-700 py-4 rounded-xl font-semibold"
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}

// ============ PLOTS SCREENS ============

function PlotsScreen({ navigateTo, setSelectedPlot }: {
  navigateTo: (s: Screen) => void
  setSelectedPlot: (v: string) => void
}) {
  const plots = [
    { id: "1", name: "Finca Central", size: "2.4 ha", status: "green", photos: 4, harvests: 12 },
    { id: "2", name: "Finca Norte", size: "1.8 ha", status: "amber", photos: 0, harvests: 8 },
    { id: "3", name: "Finca Sur", size: "3.2 ha", status: "green", photos: 4, harvests: 15 },
  ]

  return (
    <div className="p-4 space-y-3">
      {plots.map((plot) => (
        <button
          key={plot.id}
          onClick={() => {
            setSelectedPlot(plot.id)
            navigateTo("plot-detail")
          }}
          className="w-full bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:border-emerald-300 transition-all text-left"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-stone-900">{plot.name}</p>
              <p className="text-xs text-stone-500">{plot.size}</p>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              plot.status === "green" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}>
              {plot.status === "green" ? "Compliant" : "Action Needed"}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-stone-500">
            <div className="flex items-center gap-1">
              <Camera className="w-3 h-3" />
              <span>{plot.photos} photos</span>
            </div>
            <div className="flex items-center gap-1">
              <Scale className="w-3 h-3" />
              <span>{plot.harvests} harvests</span>
            </div>
          </div>
        </button>
      ))}

      <button
        onClick={() => navigateTo("register")}
        className="w-full bg-emerald-50 rounded-2xl p-4 border-2 border-dashed border-emerald-300 text-emerald-700 font-semibold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
      >
        <Plus className="w-5 h-5" />
        Register New Plot
      </button>
    </div>
  )
}

function PlotDetailScreen({ navigateTo, plotId }: {
  navigateTo: (s: Screen) => void
  plotId: string | null
}) {
  return (
    <div className="p-4 space-y-4">
      {/* Plot Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Finca Central</h2>
            <p className="text-sm text-stone-500">2.4 hectares</p>
          </div>
          <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
            Compliant
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-stone-50 rounded-lg p-2">
            <span className="text-stone-500">GeoID</span>
            <p className="font-mono font-semibold text-stone-900">HN-COP-2024-001</p>
          </div>
          <div className="bg-stone-50 rounded-lg p-2">
            <span className="text-stone-500">Registered</span>
            <p className="font-semibold text-stone-900">Mar 15, 2024</p>
          </div>
        </div>
      </div>

      {/* Deforestation Status */}
      <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <p className="font-semibold text-emerald-900 text-sm">Deforestation Check Passed</p>
            <p className="text-xs text-emerald-700">No forest loss detected since Dec 31, 2020</p>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="space-y-3">
        <button onClick={() => navigateTo("plot-photos")} className="w-full bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:border-emerald-300 transition-all text-left flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Camera className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="font-semibold text-stone-900 text-sm">Photo Vault</p>
              <p className="text-xs text-stone-500">4 ground-truth photos</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400" />
        </button>

        <button onClick={() => navigateTo("plot-documents")} className="w-full bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:border-emerald-300 transition-all text-left flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <p className="font-semibold text-stone-900 text-sm">Land Documents</p>
              <p className="text-xs text-stone-500">Clave Catastral uploaded</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400" />
        </button>

        <button onClick={() => navigateTo("plot-harvests")} className="w-full bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:border-emerald-300 transition-all text-left flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Scale className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="font-semibold text-stone-900 text-sm">Harvest Records</p>
              <p className="text-xs text-stone-500">12 deliveries this season</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400" />
        </button>

        <button onClick={() => navigateTo("plot-voucher")} className="w-full bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:border-emerald-300 transition-all text-left flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <p className="font-semibold text-stone-900 text-sm">Compliance Voucher</p>
              <p className="text-xs text-stone-500">Download QR proof</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400" />
        </button>
      </div>
    </div>
  )
}

function PlotPhotosScreen() {
  return (
    <div className="p-4 space-y-4">
      <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
        <p className="text-xs text-emerald-700">
          These timestamped photos serve as evidence during EU audits to prove agricultural activity vs. deforestation.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {["North", "East", "South", "West"].map((dir) => (
          <div key={dir} className="bg-stone-200 rounded-xl aspect-square flex items-center justify-center">
            <div className="text-center">
              <Image className="w-8 h-8 text-stone-400 mx-auto mb-1" />
              <span className="text-xs font-medium text-stone-500">{dir} View</span>
              <p className="text-xs text-stone-400">Mar 15, 2024</p>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
        <Camera className="w-4 h-4" />
        Update Photos
      </button>
    </div>
  )
}

function PlotDocumentsScreen() {
  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Stamp className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <p className="font-semibold text-stone-900 text-sm">Clave Catastral</p>
            <p className="text-xs text-emerald-600">Verified</p>
          </div>
        </div>
        <div className="bg-stone-50 rounded-lg p-2">
          <p className="font-mono text-xs text-stone-700">HN-COP-0401-2024-00142</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <p className="font-semibold text-stone-900 text-sm">Productor en Posesion</p>
            <p className="text-xs text-amber-600">Pending verification</p>
          </div>
        </div>
        <p className="text-xs text-stone-500">Municipal attestation uploaded</p>
      </div>

      <button className="w-full bg-emerald-50 rounded-xl p-4 border-2 border-dashed border-emerald-300 text-emerald-700 font-semibold flex items-center justify-center gap-2">
        <Upload className="w-4 h-4" />
        Upload Document
      </button>
    </div>
  )
}

function PlotHarvestsScreen() {
  const harvests = [
    { date: "Mar 15, 2024", weight: "45 kg", buyer: "Coop El Sol" },
    { date: "Mar 08, 2024", weight: "52 kg", buyer: "Coop El Sol" },
    { date: "Feb 28, 2024", weight: "38 kg", buyer: "Coop El Sol" },
  ]

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-stone-700">Season Total</span>
          <span className="text-lg font-bold text-emerald-600">2,847 kg</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-500">Yield cap (2.4 ha)</span>
          <span className="text-stone-700">3,600 kg max</span>
        </div>
        <div className="w-full h-2 bg-stone-100 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: "79%" }} />
        </div>
      </div>

      <div className="space-y-3">
        {harvests.map((h, i) => (
          <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-stone-200 flex items-center justify-between">
            <div>
              <p className="font-semibold text-stone-900 text-sm">{h.weight}</p>
              <p className="text-xs text-stone-500">{h.date}</p>
            </div>
            <span className="text-xs text-stone-500">{h.buyer}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlotVoucherScreen() {
  return (
    <div className="p-4 space-y-4 text-center">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
        <div className="w-32 h-32 bg-stone-200 rounded-xl mx-auto mb-4 flex items-center justify-center">
          <QrCode className="w-16 h-16 text-stone-400" />
        </div>
        <h3 className="font-bold text-stone-900">Compliance Voucher</h3>
        <p className="text-xs text-stone-500 mt-1">Scan to verify EUDR compliance</p>
        <div className="mt-4 bg-emerald-50 rounded-lg p-2">
          <p className="text-xs font-mono text-emerald-700">HN-COP-2024-001-V</p>
        </div>
      </div>
      
      <div className="bg-stone-50 rounded-xl p-3 text-left">
        <p className="text-xs text-stone-600">
          This QR code is your digital proof of compliance. Share it with any buyer to verify your plot meets EUDR requirements.
        </p>
      </div>

      <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
        <Download className="w-4 h-4" />
        Save to Device
      </button>
    </div>
  )
}

// ============ HARVEST SCREENS ============

function HarvestScreen({ navigateTo }: { navigateTo: (s: Screen) => void }) {
  return (
    <div className="p-4 space-y-4">
      <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
        <div className="flex gap-3">
          <Scale className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-900 text-sm">Log a Harvest Delivery</p>
            <p className="text-xs text-emerald-700 mt-1">
              Record weight and generate a compliance receipt for your buyer.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigateTo("harvest-select")}
        className="w-full bg-emerald-600 text-white py-4 rounded-xl font-semibold shadow-lg shadow-emerald-200"
      >
        Start New Harvest Log
      </button>

      <div className="pt-4">
        <h3 className="text-sm font-semibold text-stone-700 mb-3">Recent Deliveries</h3>
        <div className="space-y-3">
          {[
            { plot: "Finca Central", weight: "45 kg", date: "Mar 15", status: "synced" },
            { plot: "Finca Sur", weight: "52 kg", date: "Mar 12", status: "synced" },
            { plot: "Finca Norte", weight: "38 kg", date: "Mar 08", status: "pending" },
          ].map((h, i) => (
            <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-stone-200 flex items-center justify-between">
              <div>
                <p className="font-semibold text-stone-900 text-sm">{h.weight}</p>
                <p className="text-xs text-stone-500">{h.plot} - {h.date}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                h.status === "synced" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}>
                {h.status === "synced" ? "Synced" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HarvestSelectScreen({ navigateTo }: { navigateTo: (s: Screen) => void }) {
  return (
    <div className="p-4 space-y-4">
      <p className="text-sm text-stone-600">Select the plot for this harvest:</p>
      
      {["Finca Central", "Finca Norte", "Finca Sur"].map((plot) => (
        <button
          key={plot}
          onClick={() => navigateTo("harvest-weigh")}
          className="w-full bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:border-emerald-300 transition-all text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TreeDeciduous className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="font-semibold text-stone-900 text-sm">{plot}</p>
              <p className="text-xs text-stone-500">Available capacity: 753 kg</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400" />
        </button>
      ))}
    </div>
  )
}

function HarvestWeighScreen({ navigateTo, weight, setWeight }: {
  navigateTo: (s: Screen) => void
  weight: string
  setWeight: (v: string) => void
}) {
  const numWeight = parseFloat(weight) || 0
  const yieldExceeded = numWeight > 753 // Simulated remaining capacity

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <label className="block text-sm font-medium text-stone-700 mb-2">Weight (kg)</label>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Enter weight"
          className="w-full px-4 py-4 rounded-xl border border-stone-200 text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {yieldExceeded && (
        <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900 text-sm">Yield Cap Warning</p>
              <p className="text-xs text-red-700 mt-1">
                This weight exceeds the remaining capacity for this plot. Transaction flagged for review.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-stone-50 rounded-xl p-3">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-stone-500">Finca Central capacity</span>
          <span className="text-stone-700">753 kg remaining</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-500">Max yield (1,500 kg/ha)</span>
          <span className="text-stone-700">3,600 kg total</span>
        </div>
      </div>

      <button
        onClick={() => navigateTo("harvest-complete")}
        disabled={!weight || numWeight <= 0}
        className={`w-full py-4 rounded-xl font-semibold transition-all ${
          weight && numWeight > 0
            ? yieldExceeded 
              ? "bg-amber-500 text-white" 
              : "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
            : "bg-stone-200 text-stone-400"
        }`}
      >
        {yieldExceeded ? "Submit with Warning" : "Record Delivery"}
      </button>
    </div>
  )
}

function HarvestCompleteScreen({ navigateTo }: { navigateTo: (s: Screen) => void }) {
  return (
    <div className="p-4 space-y-4 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
        <CheckCircle className="w-10 h-10 text-emerald-600" />
      </div>
      
      <div>
        <h2 className="text-xl font-bold text-stone-900">Harvest Logged!</h2>
        <p className="text-sm text-stone-600 mt-2">
          Digital receipt generated and saved locally.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <div className="w-24 h-24 bg-stone-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
          <QrCode className="w-12 h-12 text-stone-400" />
        </div>
        <p className="text-xs text-stone-500">Share this QR with your buyer</p>
      </div>

      <div className="space-y-3 pt-4">
        <button
          onClick={() => navigateTo("harvest")}
          className="w-full bg-emerald-600 text-white py-4 rounded-xl font-semibold"
        >
          Log Another Harvest
        </button>
        <button
          onClick={() => navigateTo("home")}
          className="w-full bg-stone-200 text-stone-700 py-4 rounded-xl font-semibold"
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}

// ============ DOCUMENTS SCREENS ============

function DocumentsScreen({ navigateTo }: { navigateTo: (s: Screen) => void }) {
  const categories = [
    { id: "identity", label: "Identity Documents", icon: Fingerprint, count: 2, color: "bg-blue-100 text-blue-700" },
    { id: "land", label: "Land Tenure", icon: FileCheck, count: 1, color: "bg-emerald-100 text-emerald-700" },
    { id: "fpic", label: "FPIC Consent", icon: Users, count: 3, color: "bg-purple-100 text-purple-700" },
    { id: "labor", label: "Labor Standards", icon: Hand, count: 1, color: "bg-amber-100 text-amber-700" },
  ]

  return (
    <div className="p-4 space-y-3">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => navigateTo(`documents-${cat.id}` as Screen)}
          className="w-full bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:border-emerald-300 transition-all text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${cat.color.split(" ")[0]} flex items-center justify-center`}>
              <cat.icon className={`w-5 h-5 ${cat.color.split(" ")[1]}`} />
            </div>
            <div>
              <p className="font-semibold text-stone-900 text-sm">{cat.label}</p>
              <p className="text-xs text-stone-500">{cat.count} document(s)</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400" />
        </button>
      ))}
    </div>
  )
}

function DocumentsIdentityScreen() {
  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <div className="flex items-center gap-3 mb-2">
          <FileImage className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-semibold text-stone-900 text-sm">National ID (DNI)</p>
            <p className="text-xs text-emerald-600">Verified</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <div className="flex items-center gap-3 mb-2">
          <FileImage className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-semibold text-stone-900 text-sm">IHCAFE Producer Card</p>
            <p className="text-xs text-emerald-600">Verified</p>
          </div>
        </div>
      </div>
      <button className="w-full bg-emerald-50 rounded-xl p-4 border-2 border-dashed border-emerald-300 text-emerald-700 font-semibold flex items-center justify-center gap-2">
        <ScanLine className="w-4 h-4" />
        Scan Document (OCR)
      </button>
    </div>
  )
}

function DocumentsLandScreen() {
  return (
    <div className="p-4 space-y-4">
      <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
        <p className="text-xs text-emerald-700">
          Upload your Clave Catastral, formal title, or customary land agreement. We support informal "Productor en Posesion" declarations.
        </p>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <div className="flex items-center gap-3">
          <Stamp className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="font-semibold text-stone-900 text-sm">Clave Catastral</p>
            <p className="text-xs text-emerald-600">OCR verified</p>
          </div>
        </div>
      </div>
      <button className="w-full bg-emerald-50 rounded-xl p-4 border-2 border-dashed border-emerald-300 text-emerald-700 font-semibold flex items-center justify-center gap-2">
        <Upload className="w-4 h-4" />
        Upload Land Document
      </button>
    </div>
  )
}

function DocumentsFPICScreen() {
  return (
    <div className="p-4 space-y-4">
      <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
        <p className="text-xs text-purple-700">
          Free, Prior, and Informed Consent documentation. Upload community assembly minutes, participatory mapping records, or social agreements.
        </p>
      </div>
      {["Community Assembly Minutes", "Participatory Mapping", "Social Agreement"].map((doc) => (
        <div key={doc} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-semibold text-stone-900 text-sm">{doc}</p>
              <p className="text-xs text-stone-500">Uploaded Feb 2024</p>
            </div>
          </div>
        </div>
      ))}
      <button className="w-full bg-purple-50 rounded-xl p-4 border-2 border-dashed border-purple-300 text-purple-700 font-semibold flex items-center justify-center gap-2">
        <Upload className="w-4 h-4" />
        Add FPIC Document
      </button>
    </div>
  )
}

function DocumentsLaborScreen() {
  return (
    <div className="p-4 space-y-4">
      <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
        <p className="text-xs text-amber-700">
          ILO labor standard attestations. Confirm no child labor, forced labor, or unsafe working conditions.
        </p>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <div className="flex items-center gap-3">
          <Hand className="w-5 h-5 text-amber-600" />
          <div>
            <p className="font-semibold text-stone-900 text-sm">Labor Standards Attestation</p>
            <p className="text-xs text-emerald-600">Signed Mar 2024</p>
          </div>
        </div>
      </div>
      <button className="w-full bg-amber-50 rounded-xl p-4 border-2 border-dashed border-amber-300 text-amber-700 font-semibold flex items-center justify-center gap-2">
        <Camera className="w-4 h-4" />
        Add Photo Evidence
      </button>
    </div>
  )
}

// ============ SETTINGS SCREEN ============

function SettingsScreen() {
  return (
    <div className="p-4 space-y-4">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
            <User className="w-7 h-7 text-emerald-700" />
          </div>
          <div>
            <p className="font-bold text-stone-900">Maria Santos</p>
            <p className="text-xs text-stone-500">maria.santos@email.com</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">Farmer - Honduras</p>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Languages className="w-5 h-5 text-stone-500" />
            <span className="font-medium text-stone-900 text-sm">Language</span>
          </div>
          <span className="text-sm text-emerald-600 font-medium">Español</span>
        </div>
      </div>

      {/* Sync Status */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Upload className="w-5 h-5 text-stone-500" />
            <span className="font-medium text-stone-900 text-sm">Sync Status</span>
          </div>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">3 pending</span>
        </div>
        <button className="w-full bg-emerald-50 text-emerald-700 py-2 rounded-xl text-sm font-semibold">
          Sync Now
        </button>
      </div>

      {/* Storage */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
        <div className="flex items-center gap-3 mb-3">
          <Smartphone className="w-5 h-5 text-stone-500" />
          <span className="font-medium text-stone-900 text-sm">Local Storage</span>
        </div>
        <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: "35%" }} />
        </div>
        <p className="text-xs text-stone-500 mt-2">142 MB / 500 MB used</p>
      </div>

      {/* Help */}
      <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-900 text-sm">Need Help?</p>
            <p className="text-xs text-emerald-700">Contact your local cooperative</p>
          </div>
        </div>
      </div>
    </div>
  )
}
