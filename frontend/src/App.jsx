import React, { useMemo, useState, Suspense } from "react";
import "./App.css";
import OfficeScene from "./components/OfficeScene";
import TerminalScreen from "./components/TerminalScreen";
import StudioHUD from "./components/StudioHUD";
import InspectorModal from "./components/InspectorModal";

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

  // 3D Studio State
  const [targetView, setTargetView] = useState("terminal");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [studioMode, setStudioMode] = useState(true);

  const violations = useMemo(() => {
    return getViolations(result).map(normalizeViolation);
  }, [result]);

  async function startAudit() {
    if (!videoUrl.trim()) {
      setError("Enter a video URL first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setSelectedViolation(null);
    setTargetView("terminal");

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
    setTargetView("terminal");
  }

  return (
    <div className="nexus-studio-app">
      {/* 3D STUDIO EXPERIENCE (Graffico Office Style) */}
      {studioMode ? (
        <div className="studio-experience-wrap">
          {/* 3D Scene Viewport */}
          <Suspense fallback={<div className="studio-loader">INITIALIZING 3D ENVIRONMENT...</div>}>
            <OfficeScene
              targetView={targetView}
              setTargetView={setTargetView}
              auditState={{ loading, result, error }}
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

          {/* HUD Overlay */}
          <StudioHUD
            targetView={targetView}
            setTargetView={setTargetView}
            auditState={{ loading, result, error }}
            onResetAudit={resetAudit}
            showDetailModal={showDetailModal}
            setShowDetailModal={setShowDetailModal}
          />

          {/* Toggle View Mode in Studio */}
          <button
            className="mode-switcher-btn"
            onClick={() => setStudioMode(false)}
            title="Switch to 2D Dashboard View"
          >
            2D DASHBOARD
          </button>
        </div>
      ) : (
        /* CLASSIC 2D DASHBOARD VIEW */
        <div className="classic-dashboard-wrap">
          <header className="topbar">
            <div className="brand">
              <div className="brand-mark">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div>
                <div className="brand-name">NEXUS</div>
                <div className="brand-sub">COMPLY</div>
              </div>
            </div>

            <div className="nav-center">
              <span className="nav-active">AI AUDIT</span>
              <button
                className="mode-switcher-btn-inline"
                onClick={() => setStudioMode(true)}
              >
                ENTER 3D STUDIO
              </button>
            </div>

            <div className="system-status">
              <span className="status-dot"></span>
              BACKEND: {API_URL}
            </div>
          </header>

          <main className="dashboard-content">
            <div className="classic-terminal-container">
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
            </div>
          </main>
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
      />
    </div>
  );
}