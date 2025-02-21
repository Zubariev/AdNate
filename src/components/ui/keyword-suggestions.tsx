import { Button } from "@/components/ui/button";

interface KeywordSuggestionsProps {
  keywords: string[];
  onSelect: (keyword: string) => void;
}

export function KeywordSuggestions({ keywords, onSelect }: KeywordSuggestionsProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {keywords.map((keyword) => (
        <Button
          key={keyword}
          variant="outline"
          size="sm"
          className="text-xs px-2 py-0 h-6 bg-muted/50 hover:bg-muted"
          onClick={() => onSelect(keyword)}
        >
          {keyword}
        </Button>
      ))}
    </div>
  );
}
