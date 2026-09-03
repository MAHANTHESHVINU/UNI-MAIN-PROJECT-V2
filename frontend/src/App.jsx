import React, { useMemo, useState, Suspense } from "react";
import "./App.css";
import ScannerCore from "./components/ScannerCore";
import RadialReticle from "./components/RadialReticle";
import ForensicConsole from "./components/ForensicConsole";
import AgentFlow from "./components/AgentFlow";
import InspectorModal from "./components/InspectorModal";
import OfficeScene from "./components/OfficeScene";
import TerminalScreen from "./components/TerminalScreen";
import StudioHUD from "./components/StudioHUD";
import { Sun, Moon, Maximize2, ShieldAlert } from "./components/Icons";

const API_URL = "http://127.0.0.1:8000";

function getViolations(result) {
  if (!result) return [];

  if (Array.isArray(result.compliance_results)) {
    return result.compliance_results;
  }

  if (
    result.compliance_results &&
    Array.isArray(result.compliance_results.violations)
  ) {
    return result.compliance_results.violations;
  }

  if (Array.isArray(result.violations)) {
    return result.violations;
  }

  if (Array.isArray(result.results)) {
    return result.results;
  }

  return [];
}

function normalizeViolation(item, index) {
  if (typeof item === "string") {
    return {
      id: index + 1,
      title: "Compliance Violation",
      description: item,
      severity: "HIGH",
    };
  }

  return {
    id: index + 1,
    title:
      item?.title ||
      item?.type ||
      item?.category ||
      item?.rule ||
      `Violation ${index + 1}`,
    description:
      item?.description ||
      item?.reason ||
      item?.details ||
      item?.message ||
      JSON.stringify(item),
    severity: String(item?.severity || item?.risk || "HIGH").toUpperCase(),
    timestamp: item?.timestamp || item?.time || item?.start_time || null,
  };
}

export default function App() {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [selectedViolation, setSelectedViolation] = useState(null);

  // Experience Mode ('studio' = 3D room; 'industrial' = Aevion Swiss style)
  const [experienceMode, setExperienceMode] = useState("studio");
  const [theme, setTheme] = useState("light");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [targetView, setTargetView] = useState("terminal");

  const violations = useMemo(() => {
    return getViolations(result).map(normalizeViolation);
  }, [result]);

  async function startAudit() {
    if (!videoUrl.trim()) {
      setError("Enter a valid video URL first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setSelectedViolation(null);

    try {
      const response = await fetch(`${API_URL}/audit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          video_url: videoUrl.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Audit failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("NEXUS COMPLY RESULT:", data);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(
        err?.message ||
          "Unable to connect to the NEXUS COMPLY backend. Ensure FastAPI is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetAudit() {
    setResult(null);
    setError("");
    setSelectedViolation(null);
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className={`app-root ${theme === 'light' ? 'theme-light' : 'theme-dark'}`}>
      {experienceMode === "industrial" ? (
        /* ==================================================================
           AEVION-INSPIRED INDUSTRIAL SWISS TECH EXPERIENCE (drone.riotters.com)
           ================================================================== */
        <div className="industrial-app-container">
          {/* Top Industrial Navbar */}
          <header className="swiss-nav">
            <div className="nav-brand-group">
              <div className="nav-brand-symbol">
                <span></span>
                <span></span>
              </div>
              <div className="nav-brand-titles">
                <span className="brand-primary">nexus comply</span>
                <span className="brand-dot-sep"></span>
                <span className="brand-desc">Autonomous Video Compliance</span>
              </div>
            </div>

            <div className="nav-center-badge">
              <span className="status-bullet"></span>
              <span className="mono-status">KERNEL: LANGGRAPH 0.2 // READY</span>
            </div>

            <div className="nav-actions">
              <button
                className="btn-pill-mode"
                onClick={() => setExperienceMode("studio")}
                title="Switch to 3D Virtual Studio Room"
              >
                3D STUDIO ROOM
              </button>

              <button
                className="nav-icon-btn"
                onClick={toggleTheme}
                title="Toggle Theme"
              >
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </button>

              <button
                className="nav-icon-btn"
                onClick={toggleFullscreen}
                title="Toggle Fullscreen"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </header>

          {/* Hero Section with 3D LiDAR Gimbal & Dome Reticle */}
          <section className="swiss-hero-section">
            <div className="hero-typography-block">
              <div className="hero-pill-badge">
                <span>[ TECH DEMO // FORENSIC AI ]</span>
              </div>
              <h1 className="hero-giant-title">
                Autonomous video
                <br />
                compliance inspection.
              </h1>
              <p className="hero-subtext">
                Multi-modal frame parsing and regulatory verification at 240,000 points per second.
                Precision evidence that protects digital media across global FTC, FCC, and SEC mandates.
              </p>
            </div>

            {/* 3D Core with Radial Reticle */}
            <div className="hero-scanner-stage">
              <Suspense fallback={<div className="core-loader">INITIALIZING LIDAR OPTICS...</div>}>
                <ScannerCore isScanning={loading} />
              </Suspense>
              <RadialReticle loading={loading} result={result} />
            </div>

            {/* Forensic Control Station */}
            <div className="hero-console-mount">
              <ForensicConsole
                videoUrl={videoUrl}
                setVideoUrl={setVideoUrl}
                loading={loading}
                error={error}
                result={result}
                violations={violations}
                onStartAudit={startAudit}
                onResetAudit={resetAudit}
                onOpenInspector={() => setShowDetailModal(true)}
              />
            </div>
          </section>

          {/* Multi-Agent Pipeline Architecture */}
          <AgentFlow loading={loading} result={result} />

          {/* Swiss Footer */}
          <footer className="swiss-footer">
            <div className="footer-left">
              <span>NEXUS COMPLY &bull; AUTONOMOUS REGULATORY INTELLIGENCE</span>
            </div>
            <div className="footer-right">
              <span>DESIGNED TO INDUSTRY STANDARDS // ZERO LATENCY PIPELINE</span>
            </div>
          </footer>
        </div>
      ) : (
        /* ==================================================================
           3D STUDIO ROOM EXPERIENCE (Graffico Office style)
           ================================================================== */
        <div className="studio-experience-wrap">
          <Suspense fallback={<div className="studio-loader">INITIALIZING 3D ENVIRONMENT...</div>}>
            <OfficeScene
              targetView={targetView}
              setTargetView={setTargetView}
              auditState={{ loading, result, error }}
              theme={theme}
            >
              <TerminalScreen
                videoUrl={videoUrl}
                setVideoUrl={setVideoUrl}
                loading={loading}
                error={error}
                result={result}
                violations={violations}
                onStartAudit={startAudit}
                onOpenInspector={() => setShowDetailModal(true)}
                onFocusView={setTargetView}
              />
            </OfficeScene>
          </Suspense>

          <StudioHUD
            targetView={targetView}
            setTargetView={setTargetView}
            auditState={{ loading, result, error }}
            onResetAudit={resetAudit}
            showDetailModal={showDetailModal}
            setShowDetailModal={setShowDetailModal}
            theme={theme}
            setTheme={setTheme}
          />

          <button
            className="mode-switcher-btn"
            onClick={() => setExperienceMode("industrial")}
            title="Switch to Industrial Swiss View"
          >
            INDUSTRIAL SWISS VIEW
          </button>
        </div>
      )}

      {/* Forensic Violation Inspector Modal */}
      <InspectorModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        result={result}
        violations={violations}
        selectedViolation={selectedViolation}
        setSelectedViolation={setSelectedViolation}
        theme={theme}
      />
    </div>
  );
}