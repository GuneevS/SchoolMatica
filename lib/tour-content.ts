import type { TourStep } from "@/lib/stores/tour-store";

export const dashboardTour: TourStep[] = [
  {
    target: "[data-tour='summary-stats']",
    title: "📊 Quick Overview",
    content:
      "These cards give you an instant snapshot of your school's performance. Hover over the info icons for detailed explanations of each metric.",
    placement: "bottom",
  },
  {
    target: "[data-tour='performance-chart']",
    title: "📈 Visual Analytics",
    content:
      "This chart shows class performance at a glance. Quickly identify which classes are excelling and which need attention.",
    placement: "top",
  },
  {
    target: "[data-tour='class-table']",
    title: "📋 Detailed Breakdown",
    content:
      "View all your classes with key metrics. Click on any row to dive into the markbook for that class.",
    placement: "top",
  },
  {
    target: "[data-tour='recent-plans']",
    title: "🗂️ Recent Activity",
    content:
      "Stay updated with the latest assessment plans. Color-coded badges show the status of each plan at a glance.",
    placement: "left",
  },
  {
    target: "[data-tour='help-button']",
    title: "💡 Need Help?",
    content:
      "Click this button anytime for contextual help and guidance. Every page has specific tips tailored to what you're doing.",
    placement: "left",
  },
];

export const assessmentPlansTour: TourStep[] = [
  {
    target: "[data-tour='create-plan']",
    title: "✨ Create Your First Plan",
    content:
      "Start by creating an assessment plan. You can build from scratch or use a curriculum template to save time.",
    placement: "bottom",
  },
  {
    target: "[data-tour='plans-table']",
    title: "📚 Your Assessment Plans",
    content:
      "All your plans are listed here with their current status. Click 'Open' to edit weights, add assessments, or view details.",
    placement: "top",
  },
  {
    target: "[data-tour='tour-button']",
    title: "🧭 Take a Tour Anytime",
    content:
      "You can restart this tour at any time by clicking the 'Take a Tour' button. It's always here to help you navigate.",
    placement: "bottom",
  },
];

export const markbookTour: TourStep[] = [
  {
    target: "[data-tour='plan-switcher']",
    title: "🔄 Switch Plans",
    content:
      "If you have multiple assessment plans for this class, use this dropdown to switch between them.",
    placement: "bottom",
  },
  {
    target: "[data-tour='add-student']",
    title: "👥 Add Students",
    content:
      "Click here to add new students to this class. They'll immediately appear in the markbook grid.",
    placement: "bottom",
  },
  {
    target: "[data-tour='summary-stats']",
    title: "📊 Performance Summary",
    content:
      "These cards show class averages and distribution. Use them to gauge overall performance and identify trends.",
    placement: "bottom",
  },
  {
    target: "[data-tour='distribution-chart']",
    title: "📈 Level Distribution",
    content:
      "This chart shows how many students fall into each achievement level. A balanced distribution indicates fair assessment difficulty.",
    placement: "top",
  },
  {
    target: "[data-tour='markbook-grid']",
    title: "✏️ Enter Marks",
    content:
      "Click any cell to enter marks. Press Tab to move quickly between cells. Use 'A' for absent students. All calculations happen automatically!",
    placement: "top",
  },
];

export const registrationsTour: TourStep[] = [
  {
    target: "[data-tour='status-tabs']",
    title: "🏷️ Filter by Status",
    content:
      "Use these tabs to filter registrations by their current state. Focus on what needs your attention right now.",
    placement: "bottom",
  },
  {
    target: "[data-tour='capture-registration']",
    title: "📝 Capture New Learners",
    content:
      "Click here to register a new learner. Fill in their details, guardian information, and assign them to a class.",
    placement: "bottom",
  },
  {
    target: "[data-tour='registrations-list']",
    title: "📋 Review Applications",
    content:
      "All registrations appear here. Expand each one to review details, assign classes, add notes, and approve or reject.",
    placement: "top",
  },
];

