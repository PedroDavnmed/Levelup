import ActivityTracker from "@/components/ActivityTracker";

export default function TrainingPage() {
  return (
    <ActivityTracker
      type="training"
      icon="💪"
      title="Training"
      color="#7fd1ae"
      defaultUnit="min"
      unitOptions={["min", "reps", "sets", "km", "kg"]}
    />
  );
}
