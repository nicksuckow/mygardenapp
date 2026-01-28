import { ui } from "@/lib/uiStyles";

export const metadata = {
  title: "Privacy Policy - Sowplan",
  description: "Privacy Policy for Sowplan application",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className={`${ui.card} ${ui.cardPad} space-y-6`}>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="text-sm text-slate-500 mt-1">Last updated: January 2026</p>
        </div>

        <div className="prose prose-slate prose-sm max-w-none">
          <h2 className="text-lg font-semibold text-slate-900 mt-6">1. Introduction</h2>
          <p className="text-slate-700">
            Sowplan is operated by Unfiltered Investments LLC ("we", "our", or "us"). We are
            committed to protecting your privacy. This Privacy Policy explains how we collect,
            use, and safeguard your information when you use our garden planning application.
          </p>

          <h2 className="text-lg font-semibold text-slate-900 mt-6">2. Information We Collect</h2>

          <h3 className="text-base font-medium text-slate-800 mt-4">Account Information</h3>
          <p className="text-slate-700">
            When you create an account, we collect:
          </p>
          <ul className="list-disc pl-5 text-slate-700 space-y-1">
            <li>Email address</li>
            <li>Name (optional)</li>
            <li>Password (stored securely using industry-standard encryption)</li>
          </ul>

          <h3 className="text-base font-medium text-slate-800 mt-4">Garden Data</h3>
          <p className="text-slate-700">
            To provide our services, we store the garden-related data you enter:
          </p>
          <ul className="list-disc pl-5 text-slate-700 space-y-1">
            <li>Plant information and preferences</li>
            <li>Garden bed layouts and configurations</li>
            <li>Planting schedules and dates</li>
            <li>Seed inventory</li>
            <li>Journal entries and notes</li>
            <li>Location data (ZIP code, hardiness zone, frost dates)</li>
          </ul>

          <h3 className="text-base font-medium text-slate-800 mt-4">Automatically Collected Information</h3>
          <p className="text-slate-700">
            We may automatically collect certain information when you use the app, including:
          </p>
          <ul className="list-disc pl-5 text-slate-700 space-y-1">
            <li>Device type and browser information</li>
            <li>IP address (for security and rate limiting)</li>
            <li>Usage patterns and feature interactions</li>
          </ul>

          <h2 className="text-lg font-semibold text-slate-900 mt-6">3. How We Use Your Information</h2>
          <p className="text-slate-700">
            We use your information to:
          </p>
          <ul className="list-disc pl-5 text-slate-700 space-y-1">
            <li>Provide and maintain our garden planning services</li>
            <li>Calculate planting schedules based on your location and frost dates</li>
            <li>Send important account-related communications</li>
            <li>Improve and optimize our application</li>
            <li>Protect against unauthorized access and abuse</li>
          </ul>

          <h2 className="text-lg font-semibold text-slate-900 mt-6">4. Data Sharing</h2>
          <p className="text-slate-700">
            We do not sell your personal information. We may share data with:
          </p>
          <ul className="list-disc pl-5 text-slate-700 space-y-1">
            <li>Service providers who assist in operating our application (e.g., hosting, database services)</li>
            <li>Third-party APIs for plant information lookup (your search queries only, not personal data)</li>
            <li>Legal authorities when required by law</li>
          </ul>

          <h2 className="text-lg font-semibold text-slate-900 mt-6">5. Data Security</h2>
          <p className="text-slate-700">
            We implement appropriate security measures to protect your data:
          </p>
          <ul className="list-disc pl-5 text-slate-700 space-y-1">
            <li>Passwords are hashed using bcrypt encryption</li>
            <li>All data transmission is encrypted via HTTPS</li>
            <li>Rate limiting protects against abuse</li>
            <li>Regular security reviews and updates</li>
          </ul>

          <h2 className="text-lg font-semibold text-slate-900 mt-6">6. Your Rights</h2>
          <p className="text-slate-700">
            You have the right to:
          </p>
          <ul className="list-disc pl-5 text-slate-700 space-y-1">
            <li><strong>Access your data:</strong> Export all your data at any time from Account Settings</li>
            <li><strong>Delete your data:</strong> Permanently delete your account and all associated data from Account Settings</li>
            <li><strong>Update your information:</strong> Edit your profile and garden data at any time</li>
          </ul>

          <h2 className="text-lg font-semibold text-slate-900 mt-6">7. Data Retention</h2>
          <p className="text-slate-700">
            We retain your data for as long as your account is active. When you delete your account,
            all associated data is permanently removed from our systems.
          </p>

          <h2 className="text-lg font-semibold text-slate-900 mt-6">8. Children's Privacy</h2>
          <p className="text-slate-700">
            Our service is not intended for users under the age of 13. We do not knowingly
            collect information from children under 13.
          </p>

          <h2 className="text-lg font-semibold text-slate-900 mt-6">9. Changes to This Policy</h2>
          <p className="text-slate-700">
            We may update this Privacy Policy from time to time. We will notify you of any
            changes by posting the new policy on this page and updating the "Last updated" date.
          </p>

          <h2 className="text-lg font-semibold text-slate-900 mt-6">10. Contact Us</h2>
          <p className="text-slate-700">
            If you have questions about this Privacy Policy, please contact us through the
            application's feedback system.
          </p>
        </div>
      </div>
    </div>
  );
}
