import { prisma } from "@/lib/prisma";
import { GradingForm } from "@/components/settings/grading-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function GradingSettingsPage() {
  const config = await prisma.gradingConfig.findFirst();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Grading bands</CardTitle>
        </CardHeader>
        <CardContent>
          <GradingForm config={config} />
        </CardContent>
      </Card>
    </div>
  );
}
