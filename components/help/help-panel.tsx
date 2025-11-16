"use client";

import { useEffect } from "react";
import { X, Lightbulb, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useHelpStore, type HelpContent } from "@/lib/stores/help-store";
import { cn } from "@/lib/utils";

interface HelpPanelProps {
  page: string;
  content: HelpContent;
}

export function HelpPanel({ page, content }: HelpPanelProps) {
  const { isOpen, setOpen, setPage } = useHelpStore();

  useEffect(() => {
    setPage(page, content);
  }, [page, content, setPage]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-full max-w-md transform border-l bg-background shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Help & Tips</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {/* Page Title */}
              <div>
                <h3 className="text-xl font-bold">{content.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{content.description}</p>
              </div>

              <Separator />

              {/* Sections */}
              {content.sections.map((section, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <CardTitle className="text-base">{section.heading}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{section.content}</p>
                    {section.tips && section.tips.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Lightbulb className="h-4 w-4 text-amber-500" />
                          <span>Tips</span>
                        </div>
                        <ul className="space-y-1 pl-6">
                          {section.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="text-sm text-muted-foreground">
                              • {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Quick Actions */}
              {content.quickActions && content.quickActions.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold">Quick Actions</h4>
                    </div>
                    <div className="space-y-2">
                      {content.quickActions.map((action, index) => (
                        <Badge key={index} variant="secondary" className="w-full justify-start p-3 text-left">
                          <span className="text-sm">{action.label}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}

function HelpCircle({ className }: { className?: string }) {
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
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

