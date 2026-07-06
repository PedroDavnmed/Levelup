import { Dumbbell } from "lucide-react";
import ActivityTracker from "@/components/ActivityTracker";

export default function TrainingPage() {
  return (
    <ActivityTracker
      type="training"
      icon={<Dumbbell size={22} aria-hidden />}
      title="Training"
      color="#3DD68C"
      defaultUnit="min"
      unitOptions={["min", "reps", "sets", "km", "kg"]}
    />
  );
}
