
import { useState, useMemo, useCallback, useEffect } from "react";
import { Assessment } from "@prisma/client";

// Extended type for UI
export interface WeightedAssessment extends Assessment {
    percentageOfTerm: number;
}

// Term weights type - maps term (T1, T2, etc.) to percentage
export type TermWeights = Record<string, number>;

export function useWeightingLogic(
    initialAssessments: Assessment[],
    initialTermWeights?: TermWeights | null
) {
    const [assessments, setAssessments] = useState(initialAssessments);
    const [termWeights, setTermWeights] = useState<TermWeights>(() => {
        if (initialTermWeights && Object.keys(initialTermWeights).length > 0) {
            return initialTermWeights;
        }
        // Default: equal distribution across detected terms
        const terms = [...new Set(initialAssessments.map(a => a.term))];
        const equalWeight = terms.length > 0 ? 100 / terms.length : 25;
        return Object.fromEntries(terms.map(t => [t, equalWeight]));
    });
    const [hasChanges, setHasChanges] = useState(false);

    // Sync with external changes to initialAssessments
    useEffect(() => {
        setAssessments(initialAssessments);
    }, [initialAssessments]);

    // Sync with external changes to termWeights
    useEffect(() => {
        if (initialTermWeights && Object.keys(initialTermWeights).length > 0) {
            setTermWeights(initialTermWeights);
        }
    }, [initialTermWeights]);

    // Group assessments by term
    const assessmentsByTerm = useMemo(() => {
        const grouped: Record<string, Assessment[]> = {};
        assessments.forEach((a) => {
            if (!grouped[a.term]) grouped[a.term] = [];
            grouped[a.term].push(a);
        });
        return grouped;
    }, [assessments]);

    // Calculate current total weights per term (sum of raw weights)
    const totalsByTerm = useMemo(() => {
        const totals: Record<string, number> = {};
        Object.entries(assessmentsByTerm).forEach(([term, termAssessments]) => {
            totals[term] = termAssessments.reduce((sum, a) => sum + (a.rawWeight || 0), 0);
        });
        return totals;
    }, [assessmentsByTerm]);

    // Calculate term weight total for validation
    const termWeightTotal = useMemo(() => {
        return Object.values(termWeights).reduce((sum, w) => sum + w, 0);
    }, [termWeights]);

    // Check if term weights are valid (sum to 100%)
    const isTermWeightsValid = useMemo(() => {
        return Math.abs(termWeightTotal - 100) < 0.01;
    }, [termWeightTotal]);

    // Calculate effective weight for each assessment (considering term weights)
    const effectiveWeights = useMemo(() => {
        const result: Record<string, { inTermPercent: number; effectiveFinalPercent: number }> = {};
        
        assessments.forEach((assessment) => {
            const termTotal = totalsByTerm[assessment.term] || 0;
            const termWeight = termWeights[assessment.term] || 0;
            
            // Percentage within the term
            const inTermPercent = termTotal > 0 
                ? (assessment.rawWeight / termTotal) * 100 
                : 0;
            
            // Effective contribution to final grade
            const effectiveFinalPercent = (inTermPercent * termWeight) / 100;
            
            result[assessment.id] = {
                inTermPercent: Number(inTermPercent.toFixed(2)),
                effectiveFinalPercent: Number(effectiveFinalPercent.toFixed(2)),
            };
        });
        
        return result;
    }, [assessments, totalsByTerm, termWeights]);

    // Update a single assessment's raw weight
    const updateWeight = useCallback((id: string, newRawWeight: number) => {
        setAssessments((prev) =>
            prev.map((a) => (a.id === id ? { ...a, rawWeight: newRawWeight } : a))
        );
        setHasChanges(true);
    }, []);

    // Update weight by percentage within a term
    // Uses a stable calculation that doesn't create recursive issues
    const updateWeightPercentage = useCallback(
        (id: string, targetPercentage: number, term: string) => {
            const termAssessments = assessments.filter(a => a.term === term);
            const otherAssessments = termAssessments.filter(a => a.id !== id);
            
            // If this is the only assessment, it must be 100%
            if (otherAssessments.length === 0) {
                // Single assessment in term - set raw to a sensible default
                updateWeight(id, 100);
                return;
            }
            
            // Clamp percentage to valid range (0-99.9% to prevent division issues)
            const safePercent = Math.min(Math.max(targetPercentage, 0.1), 99.9);
            
            // Calculate the raw weight of all OTHER assessments in this term
            const otherRawTotal = otherAssessments.reduce((sum, a) => sum + (a.rawWeight || 0), 0);
            
            // Formula: If we want X% and others total Y raw,
            // then our raw weight = (X / (100 - X)) * Y
            const newRaw = (safePercent / (100 - safePercent)) * otherRawTotal;
            
            updateWeight(id, Number(newRaw.toFixed(2)));
        },
        [assessments, updateWeight]
    );

    // Update term weight
    const updateTermWeight = useCallback((term: string, weight: number) => {
        setTermWeights((prev) => ({ ...prev, [term]: weight }));
        setHasChanges(true);
    }, []);

    // Auto-balance term weights to sum to 100%
    const balanceTermWeights = useCallback(() => {
        const terms = Object.keys(termWeights);
        if (terms.length === 0) return;
        
        const currentTotal = Object.values(termWeights).reduce((sum, w) => sum + w, 0);
        if (currentTotal === 0) {
            // Distribute equally
            const equalWeight = 100 / terms.length;
            setTermWeights(Object.fromEntries(terms.map(t => [t, equalWeight])));
        } else {
            // Scale proportionally
            const scaleFactor = 100 / currentTotal;
            setTermWeights((prev) => 
                Object.fromEntries(
                    Object.entries(prev).map(([t, w]) => [t, Number((w * scaleFactor).toFixed(2))])
                )
            );
        }
        setHasChanges(true);
    }, [termWeights]);

    // Reset changes flag (call after successful save)
    const markSaved = useCallback(() => {
        setHasChanges(false);
    }, []);

    return {
        assessments,
        termWeights,
        totalsByTerm,
        termWeightTotal,
        isTermWeightsValid,
        effectiveWeights,
        hasChanges,
        updateWeight,
        updateWeightPercentage,
        updateTermWeight,
        balanceTermWeights,
        markSaved,
    };
}
