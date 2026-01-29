"use client";

import { useState } from "react";
import { ui } from "@/lib/uiStyles";

interface FAQItem {
  question: string;
  answer: string;
}

const faqSections = [
  {
    title: "Getting Started",
    items: [
      {
        question: "How do I set up my garden?",
        answer:
          "Start by going to Location Data to enter your ZIP code. This will automatically determine your hardiness zone and frost dates. Then, add your plants in the Plants section and create your garden beds in the Beds section.",
      },
      {
        question: "What is a hardiness zone?",
        answer:
          "USDA Hardiness Zones are geographic areas defined by the average annual minimum winter temperature. Your zone helps determine which plants will thrive in your area and when to plant them.",
      },
      {
        question: "How are frost dates calculated?",
        answer:
          "Frost dates are based on historical weather data for your ZIP code. The last spring frost date tells you when it's typically safe to plant frost-sensitive crops outdoors, while the first fall frost date helps you plan your harvest timing.",
      },
    ],
  },
  {
    title: "Plants & Seeds",
    items: [
      {
        question: "How do I add plants to my garden?",
        answer:
          "Go to the Plants page and click 'Add New Plant'. You can search our database for common vegetables and flowers, or add custom plants with your own specifications. Each plant can have details like spacing, planting depth, and days to maturity.",
      },
      {
        question: "What is the seed inventory for?",
        answer:
          "The Seed Inventory helps you track what seeds you have, their quantities, and expiration dates. You can also record where you purchased seeds and link them to specific plants in your garden.",
      },
      {
        question: "Can I track multiple varieties of the same plant?",
        answer:
          "Yes! When adding a plant, you can specify a variety name. For example, you might have 'Tomato - Cherokee Purple' and 'Tomato - San Marzano' as separate entries with different growing characteristics.",
      },
    ],
  },
  {
    title: "Garden Beds & Layout",
    items: [
      {
        question: "How do I create a garden bed?",
        answer:
          "Go to the Beds page and click 'Add New Bed'. Enter the dimensions (length and width in feet), give it a name, and optionally add notes about soil conditions or sun exposure.",
      },
      {
        question: "How does plant placement work?",
        answer:
          "Click on a bed to open the detail view. You can drag and drop plants onto the bed layout. The app calculates how many plants fit based on spacing requirements and bed dimensions.",
      },
      {
        question: "What is the Garden View?",
        answer:
          "The Garden View shows all your beds in a single layout view. You can arrange beds to match your actual garden layout, zoom in/out, and rotate the view. This helps you visualize your entire garden space.",
      },
    ],
  },
  {
    title: "Scheduling & Planting",
    items: [
      {
        question: "How does the Schedule page work?",
        answer:
          "The Schedule page shows a calendar of planting tasks based on your frost dates and each plant's requirements. It calculates ideal indoor sowing dates, transplant dates, and direct sowing dates.",
      },
      {
        question: "What does 'Plant Now' show?",
        answer:
          "The Plant Now page filters your schedule to show only tasks that are due within the current time window. It's a quick way to see what you should be planting this week.",
      },
      {
        question: "What is succession planting?",
        answer:
          "Succession planting means planting the same crop at intervals (typically 1-3 weeks apart) to ensure a continuous harvest throughout the season. Instead of harvesting all your lettuce at once, you'll have fresh lettuce available for months.",
      },
    ],
  },
  {
    title: "Journal & Tracking",
    items: [
      {
        question: "What should I record in the garden journal?",
        answer:
          "Use the journal to track observations, weather events, pest sightings, harvest yields, or anything else you want to remember. Many gardeners find it helpful to note what worked well and what to change next year.",
      },
      {
        question: "Can I track when plants were planted or harvested?",
        answer:
          "Yes! When viewing a bed, you can click on any placement to record planting dates, germination dates, transplant dates, and harvest information. This data helps you learn your garden's patterns over time.",
      },
    ],
  },
  {
    title: "Account & Data",
    items: [
      {
        question: "How do I export my garden data?",
        answer:
          "Go to the Account page and click 'Export My Data'. This downloads all your garden information as a JSON file that you can keep as a backup.",
      },
      {
        question: "How do I delete my account?",
        answer:
          "Go to the Account page and scroll to 'Delete Account'. This will permanently delete your account and all associated data. This action cannot be undone.",
      },
      {
        question: "Is my data backed up?",
        answer:
          "Your data is stored securely in our database and backed up regularly. However, we recommend periodically exporting your data as an additional backup.",
      },
    ],
  },
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-cream-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left py-4 flex items-center justify-between gap-4 hover:text-sage-dark transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-earth-deep">{item.question}</span>
        <svg
          className={`w-5 h-5 text-earth-warm flex-shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="pb-4 text-earth-warm text-sm leading-relaxed">
          {item.answer}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className={`${ui.card} ${ui.cardPad}`}>
        <h1 className="text-2xl font-display font-bold text-earth-deep">Help & FAQ</h1>
        <p className="text-earth-warm mt-2">
          Find answers to common questions about using Sow Plan.
        </p>
      </div>

      {faqSections.map((section) => (
        <div key={section.title} className={`${ui.card} ${ui.cardPad}`}>
          <h2 className="text-lg font-semibold text-earth-deep mb-2">
            {section.title}
          </h2>
          <div className="divide-y divide-cream-200">
            {section.items.map((item) => (
              <FAQAccordion key={item.question} item={item} />
            ))}
          </div>
        </div>
      ))}

      <div className={`${ui.card} ${ui.cardPad}`}>
        <h2 className="text-lg font-semibold text-earth-deep mb-2">
          Quick Tips
        </h2>
        <ul className="space-y-3 text-sm text-earth-warm">
          <li className="flex gap-2">
            <span className="text-sage-dark font-medium">Tip:</span>
            <span>
              Keep your frost dates updated each year as they can vary based on
              climate patterns.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-sage-dark font-medium">Tip:</span>
            <span>
              Use garden years to keep historical records of what you planted
              and how it performed.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-sage-dark font-medium">Tip:</span>
            <span>
              Record pest observations in your journal to track patterns and
              plan preventive measures.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-sage-dark font-medium">Tip:</span>
            <span>
              When planning bed layouts, consider companion planting - some plants
              grow better together!
            </span>
          </li>
        </ul>
      </div>

      <div className={`${ui.card} ${ui.cardPad} bg-cream-50`}>
        <h2 className="text-lg font-semibold text-earth-deep mb-2">
          Need More Help?
        </h2>
        <p className="text-earth-warm text-sm">
          If you can&apos;t find what you&apos;re looking for, please reach out through our
          feedback system. We&apos;re always happy to help and appreciate suggestions
          for improving the app.
        </p>
      </div>
    </div>
  );
}
