import { ui } from "@/lib/uiStyles";

export const metadata = {
  title: "Terms of Service - Sowplan",
  description: "Terms of Service for Sowplan application",
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className={`${ui.card} ${ui.cardPad} space-y-6`}>
        <div>
          <h1 className="text-2xl font-bold text-earth-deep">Terms of Service</h1>
          <p className="text-sm text-earth-warm mt-1">Last updated: January 2026</p>
        </div>

        <div className="prose prose-earth prose-sm max-w-none">
          <h2 className="text-lg font-semibold text-earth-deep mt-6">1. Acceptance of Terms</h2>
          <p className="text-earth-deep">
            By accessing or using Sowplan, operated by Unfiltered Investments LLC (&quot;the Service&quot;,
            &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you agree to be bound by these Terms of Service. If you do
            not agree to these terms, please do not use the Service.
          </p>

          <h2 className="text-lg font-semibold text-earth-deep mt-6">2. Description of Service</h2>
          <p className="text-earth-deep">
            Sowplan is a web application that helps users plan, organize, and track their
            gardening activities. Features include:
          </p>
          <ul className="list-disc pl-5 text-earth-deep space-y-1">
            <li>Plant database and management</li>
            <li>Garden bed layout design</li>
            <li>Planting schedule calculations</li>
            <li>Seed inventory tracking</li>
            <li>Garden journal</li>
            <li>Location-based frost date information</li>
          </ul>

          <h2 className="text-lg font-semibold text-earth-deep mt-6">3. User Accounts</h2>
          <p className="text-earth-deep">
            To use the Service, you must create an account. You are responsible for:
          </p>
          <ul className="list-disc pl-5 text-earth-deep space-y-1">
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized use of your account</li>
          </ul>
          <p className="text-earth-deep mt-2">
            You must be at least 13 years old to create an account and use the Service.
          </p>

          <h2 className="text-lg font-semibold text-earth-deep mt-6">4. Acceptable Use</h2>
          <p className="text-earth-deep">
            You agree not to:
          </p>
          <ul className="list-disc pl-5 text-earth-deep space-y-1">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Interfere with or disrupt the Service or its servers</li>
            <li>Upload malicious code or content</li>
            <li>Scrape, harvest, or collect data from the Service without permission</li>
            <li>Impersonate others or misrepresent your affiliation</li>
          </ul>

          <h2 className="text-lg font-semibold text-earth-deep mt-6">5. User Content</h2>
          <p className="text-earth-deep">
            You retain ownership of any content you create within the Service (garden plans, journal
            entries, notes, etc.). By using the Service, you grant us a limited license to store
            and process this content solely to provide the Service to you.
          </p>

          <h2 className="text-lg font-semibold text-earth-deep mt-6">6. Third-Party Services</h2>
          <p className="text-earth-deep">
            The Service may integrate with third-party APIs for plant information and other features.
            We are not responsible for the accuracy, availability, or content provided by these
            third-party services.
          </p>

          <h2 className="text-lg font-semibold text-earth-deep mt-6">7. Disclaimer of Warranties</h2>
          <p className="text-earth-deep">
            The Service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee:
          </p>
          <ul className="list-disc pl-5 text-earth-deep space-y-1">
            <li>The accuracy of planting schedules or frost date calculations</li>
            <li>That the Service will be uninterrupted or error-free</li>
            <li>That plant information from external sources is accurate</li>
            <li>Specific gardening outcomes or results</li>
          </ul>
          <p className="text-earth-deep mt-2">
            Gardening advice and schedules provided are for informational purposes only. Always
            consider your local conditions and consult local gardening resources.
          </p>

          <h2 className="text-lg font-semibold text-earth-deep mt-6">8. Limitation of Liability</h2>
          <p className="text-earth-deep">
            To the maximum extent permitted by law, we shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages arising from your use of
            the Service, including but not limited to loss of crops, garden damage, or missed
            planting windows.
          </p>

          <h2 className="text-lg font-semibold text-earth-deep mt-6">9. Modifications to Service</h2>
          <p className="text-earth-deep">
            We reserve the right to modify, suspend, or discontinue any part of the Service at
            any time. We will make reasonable efforts to notify users of significant changes.
          </p>

          <h2 className="text-lg font-semibold text-earth-deep mt-6">10. Account Termination</h2>
          <p className="text-earth-deep">
            We may terminate or suspend your account if you violate these Terms. You may also
            delete your account at any time through the Account settings page.
          </p>

          <h2 className="text-lg font-semibold text-earth-deep mt-6">11. Changes to Terms</h2>
          <p className="text-earth-deep">
            We may update these Terms from time to time. Continued use of the Service after
            changes constitutes acceptance of the new Terms. We will notify users of material
            changes via the application.
          </p>

          <h2 className="text-lg font-semibold text-earth-deep mt-6">12. Governing Law</h2>
          <p className="text-earth-deep">
            These Terms shall be governed by and construed in accordance with applicable laws,
            without regard to conflict of law provisions.
          </p>

          <h2 className="text-lg font-semibold text-earth-deep mt-6">13. Contact</h2>
          <p className="text-earth-deep">
            If you have questions about these Terms, please contact us through the application&apos;s
            feedback system.
          </p>
        </div>
      </div>
    </div>
  );
}
