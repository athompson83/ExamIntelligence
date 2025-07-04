import { Button } from "@/components/ui/button";
import { PlusCircle, Puzzle, Brain, Eye } from "lucide-react";
import { useLocation } from "wouter";

export function QuickActions() {
  const [, setLocation] = useLocation();

  const actions = [
    {
      label: "Create Item Bank",
      icon: PlusCircle,
      onClick: () => setLocation("/item-banks"),
      className: "bg-primary hover:bg-primary/90 text-primary-foreground",
    },
    {
      label: "Build Quiz",
      icon: Puzzle,
      onClick: () => setLocation("/quiz-builder"),
      className: "bg-secondary hover:bg-secondary/90 text-secondary-foreground",
    },
    {
      label: "AI Generate",
      icon: Brain,
      onClick: () => setLocation("/ai-resources"),
      className: "bg-accent hover:bg-accent/90 text-accent-foreground",
    },
    {
      label: "Monitor Exams",
      icon: Eye,
      onClick: () => setLocation("/live-exams"),
      className: "bg-purple-600 hover:bg-purple-700 text-white",
    },
  ];

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Button
          key={action.label}
          onClick={action.onClick}
          className={`p-4 h-auto flex items-center justify-center space-x-2 transition-colors duration-200 ${action.className}`}
        >
          <action.icon className="h-5 w-5" />
          <span>{action.label}</span>
        </Button>
      ))}
    </div>
  );
}
