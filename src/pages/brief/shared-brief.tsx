import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { type Brief } from "@shared/schema";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function SharedBrief() {
  const [, params] = useRoute<{ shareId: string }>("/share/:shareId");
  const shareId = params?.shareId;

  const { data: brief, isLoading, error } = useQuery<Brief>({
    queryKey: [`/api/briefs/share/${shareId}`],
    enabled: !!shareId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Brief Not Found</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              This brief may have been removed or is not publicly shared.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-primary">{brief.projectName}</h1>
          <p className="text-muted-foreground">
            Creative Brief Concepts
          </p>
        </div>

        <div className="grid gap-6">
          {brief.concepts.map((concept, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{concept.title}</CardTitle>
                <CardDescription>{concept.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="elements">
                    <AccordionTrigger>Visual Elements</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {Object.entries(concept.elements).map(([key, value]) => (
                          <div key={key}>
                            <h4 className="font-medium capitalize">{key}</h4>
                            <p className="text-sm text-muted-foreground">{value}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="rationale">
                    <AccordionTrigger>Design Rationale</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {Object.entries(concept.rationale).map(([key, value]) => (
                          <div key={key}>
                            <h4 className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
                            <p className="text-sm text-muted-foreground">{value}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
