import ActivityTracker from "@/components/ActivityTracker";

export default function StudyPage() {
  return (
    <ActivityTracker
      type="study"
      icon="📚"
      title="Study"
      color="#5b7cfa"
      defaultUnit="min"
      unitOptions={["min", "hours", "pages", "chapters", "problems"]}
    />
  );
}
