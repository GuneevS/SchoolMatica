import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, Calculator, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AssessmentFlexibilityGuide() {
  const examples = [
    {
      name: "Quick Quiz",
      totalMarks: 5,
      weight: 90,
      description: "Short quiz with high impact on grade",
    },
    {
      name: "Major Test",
      totalMarks: 100,
      weight: 10,
      description: "Comprehensive test with lower impact",
    },
    {
      name: "Project",
      totalMarks: 50,
      weight: 60,
      description: "Medium-length project, high value",
    },
  ];

  return (
    <Card className="border-2 border-amber-200 dark:border-amber-900">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
        <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
          <Lightbulb className="h-5 w-5" />
          Assessment Flexibility Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
          <Calculator className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <strong className="text-blue-900 dark:text-blue-100">Key Principle:</strong>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              The <strong>total marks</strong> and <strong>weight percentage</strong> are completely independent. 
              This gives you full flexibility to design assessments of any size while controlling their importance.
            </p>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-600" />
            Real-World Examples
          </h4>
          
          {examples.map((example, idx) => (
            <div key={idx} className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{example.name}</span>
                <div className="flex gap-2">
                  <Badge variant="outline">/{example.totalMarks} marks</Badge>
                  <Badge variant="secondary">{example.weight}%</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{example.description}</p>
              <div className="text-xs bg-muted/50 rounded p-2">
                <strong>If student scores {Math.floor(example.totalMarks * 0.8)}/{example.totalMarks}:</strong>
                <br />
                → 80% performance × {example.weight}% weight = <strong>{(80 * example.weight / 100).toFixed(1)}%</strong> contribution
              </div>
            </div>
          ))}
        </div>

        <Alert>
          <AlertDescription className="text-xs space-y-1">
            <p><strong>How it works:</strong></p>
            <ol className="list-decimal list-inside space-y-0.5 ml-2">
              <li>Convert student mark to percentage: (mark ÷ total) × 100</li>
              <li>Apply weight: percentage × (weight ÷ 100)</li>
              <li>Sum all weighted percentages for final grade</li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="text-xs text-muted-foreground bg-muted/30 rounded p-3">
          <strong>💡 Pro Tip:</strong> Use this flexibility to balance your assessment strategy:
          <ul className="list-disc list-inside mt-1 ml-2 space-y-0.5">
            <li>Frequent low-stakes quizzes (e.g., 5 marks, 5% each)</li>
            <li>Mid-term tests (e.g., 50 marks, 20% each)</li>
            <li>Final exam (e.g., 100 marks, 40%)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
