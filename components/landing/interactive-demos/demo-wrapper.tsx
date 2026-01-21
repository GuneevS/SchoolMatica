"use client";

import { useState, useEffect } from "react";
import { RotateCcw, Info, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DemoFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface DemoWrapperProps {
  /**
   * Unique identifier for this demo (used for localStorage)
   */
  demoId: string;

  /**
   * Title displayed in browser chrome
   */
  title: string;

  /**
   * URL displayed in browser address bar
   */
  demoUrl?: string;

  /**
   * Interactive demo content
   */
  children: React.ReactNode;

  /**
   * Feature highlights shown in sidebar
   */
  features?: DemoFeature[];

  /**
   * Callback when reset button is clicked
   */
  onReset?: () => void;

  /**
   * Initial zoom level (default: 1.0)
   */
  initialZoom?: number;

  /**
   * Optional demo instructions
   */
  instructions?: string;

  /**
   * Whether to show browser chrome (default: true)
   */
  showBrowserChrome?: boolean;

  /**
   * Whether to show feature highlights (default: true)
   */
  showFeatures?: boolean;
}

/**
 * DemoWrapper Component
 *
 * Provides a consistent wrapper for all landing page interactive demos.
 * Features:
 * - Browser chrome mockup with traffic lights and URL bar
 * - Feature highlights sidebar
 * - Reset functionality
 * - Zoom controls
 * - Guided tooltips
 * - Responsive layout
 *
 * @example
 * ```tsx
 * <DemoWrapper
 *   demoId="markbook-demo"
 *   title="SchoolMatica Markbook"
 *   demoUrl="app.schoolmatica.co.za/markbook"
 *   features={markbookFeatures}
 *   onReset={handleReset}
 * >
 *   <MarkbookGrid data={demoData} />
 * </DemoWrapper>
 * ```
 */
export function DemoWrapper({
  demoId,
  title,
  demoUrl = "app.schoolmatica.co.za",
  children,
  features = [],
  onReset,
  initialZoom = 1.0,
  instructions,
  showBrowserChrome = true,
  showFeatures = true,
}: DemoWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Check if user has interacted with this demo before
  useEffect(() => {
    if (typeof window !== "undefined") {
      const interacted = localStorage.getItem(`demo-${demoId}-interacted`);
      setHasInteracted(!!interacted);
      if (!interacted && instructions) {
        setShowInstructions(true);
      }
    }
  }, [demoId, instructions]);

  const handleInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      localStorage.setItem(`demo-${demoId}-interacted`, "true");
      setShowInstructions(false);
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
    // Clear interaction state to show instructions again
    localStorage.removeItem(`demo-${demoId}-interacted`);
    setHasInteracted(false);
    if (instructions) {
      setShowInstructions(true);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className={`relative ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
          : "w-full"
      }`}
      onClick={handleInteraction}
      onKeyDown={handleInteraction}
      role="region"
      aria-label={`Interactive demo: ${title}`}
    >
      <div
        className={`mx-auto ${
          isFullscreen ? "h-full p-8" : "max-w-6xl"
        } flex flex-col lg:flex-row gap-6`}
      >
        {/* Main Demo Area */}
        <div className="flex-1 flex flex-col">
          {/* Browser Chrome */}
          {showBrowserChrome && (
            <div className="bg-muted/50 rounded-t-lg border border-border p-3">
              <div className="flex items-center justify-between">
                {/* Traffic Lights */}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" aria-hidden="true" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" aria-hidden="true" />
                  <div className="w-3 h-3 rounded-full bg-green-500" aria-hidden="true" />
                </div>

                {/* Address Bar */}
                <div className="flex-1 mx-4 px-4 py-1.5 bg-background/60 rounded-md border border-border text-sm text-muted-foreground font-mono">
                  <span className="text-green-600 dark:text-green-400">🔒</span>{" "}
                  {demoUrl}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleFullscreen}
                          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                        >
                          {isFullscreen ? (
                            <Minimize2 className="w-4 h-4" />
                          ) : (
                            <Maximize2 className="w-4 h-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                      </TooltipContent>
                    </Tooltip>

                    {onReset && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleReset}
                            aria-label="Reset demo to initial state"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reset Demo</TooltipContent>
                      </Tooltip>
                    )}

                    {instructions && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowInstructions(!showInstructions)}
                            aria-label="Toggle instructions"
                          >
                            <Info className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Instructions</TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>
                </div>
              </div>
            </div>
          )}

          {/* Demo Content */}
          <div
            className={`relative flex-1 bg-background border border-t-0 ${
              showBrowserChrome ? "rounded-b-lg" : "rounded-lg"
            } overflow-hidden shadow-ambient`}
            style={{ transform: `scale(${initialZoom})`, transformOrigin: "top left" }}
          >
            {/* Instructions Overlay */}
            {showInstructions && instructions && (
              <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-10 flex items-center justify-center p-8">
                <div className="max-w-md space-y-4 text-center">
                  <h3 className="text-xl font-semibold">How to Use This Demo</h3>
                  <p className="text-muted-foreground">{instructions}</p>
                  <Button
                    onClick={() => setShowInstructions(false)}
                    aria-label="Close instructions"
                  >
                    Got it!
                  </Button>
                </div>
              </div>
            )}

            {/* First Interaction Hint */}
            {!hasInteracted && !showInstructions && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 animate-bounce">
                <div className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium shadow-lg">
                  👆 Click anywhere to start exploring
                </div>
              </div>
            )}

            {children}
          </div>
        </div>

        {/* Feature Highlights Sidebar */}
        {showFeatures && features.length > 0 && (
          <div className="lg:w-72 space-y-4">
            <div className="glass-panel p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-primary">✨</span>
                Key Features
              </h3>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex gap-3"
                    style={{
                      animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                    }}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {feature.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-1">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Demo Info */}
            <div className="glass-panel p-4 rounded-lg text-xs text-muted-foreground">
              <p>
                This is a live demo with real SchoolMatica components. All data
                is demo data and not connected to a database.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcut Hint */}
      {isFullscreen && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-background/80 px-3 py-1.5 rounded-full border border-border">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">Esc</kbd> to exit
        </div>
      )}
    </div>
  );
}

// Fade in up animation keyframe
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
if (typeof document !== "undefined") {
  document.head.appendChild(style);
}
