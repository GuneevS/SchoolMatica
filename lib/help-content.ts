import type { HelpContent } from "@/lib/stores/help-store";

export const dashboardHelp: HelpContent = {
  title: "Dashboard Overview",
  description: "Your central hub for monitoring school performance and managing assessments.",
  sections: [
    {
      heading: "Understanding the Dashboard",
      content:
        "The dashboard provides a real-time snapshot of your school's assessment data, including class performance, pending approvals, and recent activity.",
      tips: [
        "Check the 'At Risk' count to identify students who need intervention (below 40%)",
        "Monitor 'Pending Plans' to ensure timely approval of assessment plans",
        "Review 'Open Threads' regularly to address moderation queries",
      ],
    },
    {
      heading: "Class Performance Cards",
      content:
        "Each card shows a class summary including total students, average SBA percentage, and assessment plan status.",
      tips: [
        "Click on any class card to view the detailed markbook",
        "Green indicators show healthy performance (above 50%)",
        "Red indicators highlight classes needing attention",
      ],
    },
    {
      heading: "Recent Activity",
      content:
        "Track recent assessment plans, open moderation threads, and audit logs to stay informed about changes and approvals.",
      tips: [
        "Use the audit log to trace who made changes and when",
        "Click on plan names to view or edit assessment details",
        "Resolve moderation threads promptly to unblock teachers",
      ],
    },
  ],
  quickActions: [
    { label: "Switch Role: Use the dropdown in the header to change between Teacher, HOD, and SMT views", action: "role" },
    { label: "Create Class: Navigate to Classes page to add a new class group", action: "class" },
    { label: "View Reports: Click on any class card to see detailed performance data", action: "report" },
  ],
};

export const assessmentPlansHelp: HelpContent = {
  title: "Assessment Plans",
  description: "Create, manage, and approve assessment plans with weighted tasks for each class.",
  sections: [
    {
      heading: "Creating an Assessment Plan",
      content:
        "Assessment plans define the structure of assessments for a class, including tasks, weights, and terms. You can create plans from scratch or use curriculum templates.",
      tips: [
        "Use curriculum templates to quickly set up standard assessment structures",
        "Ensure total weight adds up to 100% before submitting for approval",
        "Assign tasks to the correct term (T1, T2, T3, T4) for accurate reporting",
      ],
    },
    {
      heading: "Drag & Drop Reordering",
      content:
        "Click and drag the grip icon to reorder assessments. The sequence determines how tasks appear in the markbook.",
      tips: [
        "Group related assessments together for easier marking",
        "Place high-stakes assessments (PATs, exams) at the end of each term",
        "Reordering automatically recalculates weights",
      ],
    },
    {
      heading: "Approval Workflow",
      content:
        "Plans move through Draft → Pending Approval → Approved → Locked states. Only HOD and SMT can approve and lock plans.",
      tips: [
        "Teachers create plans in Draft status",
        "Submit for approval when ready (sends to HOD/SMT)",
        "Locked plans cannot be edited but ensure data integrity for reporting",
      ],
    },
    {
      heading: "Moderation & Documents",
      content:
        "Attach rubrics, memoranda, and other documents to plans. Use moderation threads to discuss assessment quality and fairness.",
      tips: [
        "Upload marking rubrics before assessments are written",
        "Use moderation threads to flag concerns or request changes",
        "HOD/SMT can approve or request changes to uploaded documents",
      ],
    },
  ],
  quickActions: [
    { label: "Create Plan: Click 'Create plan' and select a template or start from scratch", action: "create" },
    { label: "Edit Weights: Adjust raw weights and the system auto-normalizes to 100%", action: "edit" },
    { label: "Add Document: Upload rubrics, memos, or exemplars for moderation", action: "upload" },
  ],
};

export const markbookHelp: HelpContent = {
  title: "Markbook & Grading",
  description: "Capture student marks, track performance, and calculate SBA percentages in a spreadsheet-like interface.",
  sections: [
    {
      heading: "Entering Marks",
      content:
        "Click any cell to enter a raw mark. The system automatically calculates percentages, SBA totals, and levels based on the grading configuration.",
      tips: [
        "Press Tab to move to the next cell quickly",
        "Use 'A' or 'Absent' to mark a student as absent (mark is excluded from calculations)",
        "Marks are auto-saved when you move to another cell",
      ],
    },
    {
      heading: "Understanding Calculations",
      content:
        "SBA % is the weighted average of all assessments. Term % includes SBA, PAT, and exam components. Level is mapped from the percentage using the grading config.",
      tips: [
        "Hover over calculated cells to see the breakdown",
        "Absent marks are excluded from averages (not counted as zero)",
        "Levels update automatically when you change marks",
      ],
    },
    {
      heading: "Mark Distribution Chart",
      content:
        "The chart shows how many students fall into each level band, helping you identify trends and outliers.",
      tips: [
        "A balanced distribution suggests fair assessment difficulty",
        "Too many Level 1s may indicate assessments are too hard",
        "Too many Level 7s may indicate assessments are too easy",
      ],
    },
    {
      heading: "Adding Students",
      content:
        "Use the 'Add student' button to enroll new learners in the class. Students appear as new rows in the markbook.",
      tips: [
        "Ensure admission numbers are unique",
        "New students inherit the class's assessment plan",
        "Historical marks can be imported via bulk upload (future feature)",
      ],
    },
  ],
  quickActions: [
    { label: "Quick Entry: Click a cell, type the mark, press Tab to move to the next", action: "entry" },
    { label: "Mark Absent: Type 'A' or check the absent checkbox for a student", action: "absent" },
    { label: "View Summary: Scroll right to see SBA %, Term %, and Level columns", action: "summary" },
  ],
};

export const registrationsHelp: HelpContent = {
  title: "Learner Registrations",
  description: "Manage new learner applications, assign classes, and approve or reject registrations.",
  sections: [
    {
      heading: "Capturing Registrations",
      content:
        "Use the 'Capture registration' form to record learner and guardian details. Registrations start in 'Submitted' status.",
      tips: [
        "Collect all required information before submitting",
        "Attach supporting documents (birth certificate, reports) if available",
        "Preferred class can be changed later during review",
      ],
    },
    {
      heading: "Review Workflow",
      content:
        "HOD and SMT can move registrations through Submitted → In Review → Approved/Rejected states. Approved registrations create student records.",
      tips: [
        "Assign a class before approving to ensure the student is placed correctly",
        "Add decision notes to explain approval or rejection reasons",
        "Rejected registrations can be appealed and resubmitted",
      ],
    },
    {
      heading: "Filtering & Search",
      content:
        "Use the status tabs to filter registrations by their current state. This helps you focus on pending actions.",
      tips: [
        "Check 'Submitted' daily to avoid delays in processing",
        "Use 'In Review' for registrations requiring additional verification",
        "Archive 'Approved' and 'Rejected' registrations after processing",
      ],
    },
  ],
  quickActions: [
    { label: "Capture New: Click 'Capture registration' to add a new learner application", action: "capture" },
    { label: "Assign Class: Select a class from the dropdown before approving", action: "assign" },
    { label: "Approve/Reject: Use the action buttons after reviewing all details", action: "decide" },
  ],
};

export const settingsHelp: HelpContent = {
  title: "Settings & Configuration",
  description: "Adjust grading scales, manage subjects, and configure school-wide settings.",
  sections: [
    {
      heading: "Grading Configuration",
      content:
        "Define level bands (1-7) with minimum percentages and descriptors for each curriculum phase (Foundation, Intermediate, Senior).",
      tips: [
        "Ensure bands do not overlap (e.g., Level 4: 50-59%, Level 5: 60-69%)",
        "Use descriptors that align with CAPS requirements",
        "Changes apply to all future calculations but do not retroactively change existing levels",
      ],
    },
    {
      heading: "Subject Management",
      content:
        "Add subjects, assign phases, and link them to classes. Subjects determine which grading scale is used.",
      tips: [
        "Foundation Phase: Grades R-3",
        "Intermediate Phase: Grades 4-6",
        "Senior Phase: Grades 7-9",
        "FET Phase: Grades 10-12",
      ],
    },
  ],
  quickActions: [
    { label: "Edit Grading: Navigate to Settings → Grading to adjust level bands", action: "grading" },
    { label: "Add Subject: Use the Subjects page to create new subject offerings", action: "subject" },
  ],
};

