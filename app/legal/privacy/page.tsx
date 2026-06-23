import type { Metadata } from "next";
import LegalDoc, { type Block } from "../../components/LegalDoc";

export const metadata: Metadata = {
  title: "Privacy Policy · PocketJobs",
  description: "How PocketJobs collects, uses, stores, shares, protects, and deletes your personal information.",
};

const blocks: Block[] = [
  { h2: "1. Introduction and Overview" },
  { p: 'Welcome to PocketJobs. PocketJobs ("we," "us," "our," or "the Platform") is a digital service marketplace and employment platform operated and owned by PocketJobs ZW, based in Harare, Zimbabwe. We connect individuals seeking services and employment opportunities with skilled providers and employers across Zimbabwe.' },
  { p: 'This Privacy Policy explains how we collect, use, store, share, protect, and delete personal information when you use our mobile application, website, and related services (collectively, "the Platform"). It applies to all users, including job seekers, service providers, employers, clients, and visitors.' },
  { p: "By accessing or using PocketJobs, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree with any part of this policy, please do not use our Platform." },
  { p: "This policy has been designed to comply with applicable data protection principles, including those consistent with the Google Play Developer Program Policies, Apple App Store Review Guidelines, and internationally recognised data protection standards." },

  { h2: "2. Data Controller and Contact Information" },
  { p: "The data controller responsible for your personal information is PocketJobs ZW (Platform name: PocketJobs), operating in Zimbabwe. Email: info@pocketjobs.co. Tagline: Work made simple. Opportunities made possible." },
  { p: "For any questions, concerns, or requests regarding your personal data, please contact us at support@pocketjobs.co. We will respond to all data-related inquiries within 30 days of receipt." },

  { h2: "3. Information We Collect" },
  { p: "We collect personal information that you provide directly, information generated through your use of the Platform, and, where applicable, information from third parties. We only collect data that is necessary and proportionate to the services we provide." },
  { h3: "3.1 Information You Provide Directly" },
  { p: "When you register, create a profile, post a job, apply for work, or communicate on the Platform, we may collect:" },
  { ul: [
    "Full name and preferred display name",
    "Email address and phone number",
    "Physical address or general location (city or suburb level)",
    "Profile photograph or avatar image",
    "Professional skills, qualifications, work history, and service descriptions",
    "Government issued identification documents (for verified provider accounts, submitted voluntarily)",
    "EcoCash or Pesepay mobile money details (used solely for payment processing and not stored on our servers)",
    "User-generated content including messages, reviews, ratings, and dispute submissions",
    "Responses to optional surveys or feedback forms",
  ] },
  { h3: "3.2 Information Collected Automatically" },
  { ul: [
    "Device information including device type, operating system, and unique device identifiers",
    "IP address and general geographic location derived from it",
    "App usage data, including pages visited, features used, and session duration",
    "Crash reports and performance diagnostics",
    "Log data including access times, browser or app version, and referring URLs",
  ] },
  { h3: "3.3 Information from Third Parties" },
  { ul: [
    "Payment processors (EcoCash and Pesepay) confirming transaction status, such as success or failure, without transmitting full financial details to us",
    "Social login providers (where applicable), such as Google, providing your name and email address upon your authorisation",
  ] },

  { h2: "4. How We Use Your Information" },
  { h3: "4.1 Platform Operations" },
  { ul: [
    "Creating, verifying, and maintaining your account",
    "Facilitating connections between clients and service providers or employers and job seekers",
    "Processing payments and confirming transaction outcomes",
    "Enabling in-app chat and communication between matched users",
    "Sending notifications about bookings, job matches, messages, and platform updates",
    "Providing customer support and resolving disputes",
  ] },
  { h3: "4.2 Safety and Trust" },
  { ul: [
    "Verifying the identity of service providers who opt into the verification programme",
    "Detecting, investigating, and preventing fraudulent, abusive, or illegal activity",
    "Enforcing our Terms of Service and Community Guidelines, including our three-strike dispute resolution policy",
    "Maintaining the integrity and security of the Platform",
  ] },
  { h3: "4.3 Platform Improvement" },
  { ul: [
    "Analysing usage patterns to improve features and user experience",
    "Conducting research and development to build new functionality",
    "Monitoring platform performance and fixing bugs",
  ] },
  { h3: "4.4 Communications" },
  { ul: [
    "Sending transactional emails and SMS notifications related to your account and bookings",
    "Sending service announcements, policy updates, and important notices",
    "With your explicit consent, sending marketing or promotional communications (you may opt out at any time)",
  ] },
  { h3: "4.5 Legal Compliance" },
  { ul: [
    "Complying with applicable laws, regulations, and legal processes",
    "Responding to lawful requests from government authorities",
    "Protecting the rights and safety of PocketJobs, our users, and the public",
  ] },

  { h2: "5. Legal Basis for Processing" },
  { p: "We process your personal data on the following legal bases:" },
  { ul: [
    "Contractual necessity: to fulfil our obligations when you use our Platform, such as creating an account, facilitating bookings, and processing payments",
    "Legitimate interests: to operate and improve our Platform, prevent fraud, and ensure platform safety, provided these interests do not override your fundamental rights",
    "Legal obligation: to comply with applicable laws and respond to lawful government requests",
    "Consent: for optional features such as marketing communications, identity verification uploads, and location services, where you have given us your explicit agreement",
  ] },
  { p: "Where processing is based on consent, you have the right to withdraw your consent at any time without affecting the lawfulness of processing carried out prior to withdrawal." },

  { h2: "6. How We Share Your Information" },
  { p: "We do not sell your personal data. We do not share your information for advertising purposes. We share your data only in the following limited circumstances:" },
  { h3: "6.1 With Other Users" },
  { p: "Certain profile information is shared between matched users to facilitate the service relationship. For example, service providers may see a client's name, general location, and job description; clients may see a provider's name, profile photo, service description, ratings, and verification status. Sensitive details such as full physical addresses and mobile money numbers are never shared with other users directly through the Platform." },
  { h3: "6.2 With Service Providers and Partners" },
  { p: "We may share data with trusted third-party service providers who assist us in operating the Platform, including payment processors (EcoCash and Pesepay), cloud hosting and storage providers, analytics and crash reporting tools, and customer support tools. All third-party partners are contractually obligated to handle your data in accordance with this Privacy Policy and to implement appropriate security measures." },
  { h3: "6.3 Business Transfers" },
  { p: "If PocketJobs is involved in a merger, acquisition, restructuring, or asset sale, your information may be transferred as part of that transaction. We will notify you via email or prominent in-app notice prior to your information becoming subject to a different privacy policy." },
  { h3: "6.4 Legal Requirements" },
  { p: "We may disclose your information if required to do so by law or in good faith belief that such disclosure is necessary to comply with a legal obligation, protect the rights or safety of PocketJobs or its users, prevent fraud, or respond to a government request." },

  { h2: "7. Data Retention" },
  { p: "We retain your personal information only for as long as necessary to fulfil the purposes described in this Privacy Policy, unless a longer retention period is required by law." },
  { ul: [
    "Active account data is retained for the duration of your account",
    "Transaction records are retained for a minimum of five years for financial compliance purposes",
    "Dispute and safety records are retained for a minimum of three years",
    "Communication logs (in-app messages) are retained for up to two years from the date of the last message",
    "Verification documents are deleted within 90 days of verification completion unless retention is required by law",
    "Data from deleted accounts is anonymised or purged within 90 days of account deletion, except where retention is legally required",
  ] },
  { p: "You may request deletion of your data at any time, subject to our legal retention obligations. See Section 10 for information on exercising this right." },

  { h2: "8. Data Security" },
  { p: "We take the security of your personal data seriously and implement appropriate technical and organisational measures to protect it against unauthorised access, alteration, disclosure, or destruction. Our security practices include:" },
  { ul: [
    "Encryption of data in transit using industry-standard TLS (Transport Layer Security) protocols",
    "Encryption of sensitive data at rest",
    "Secure, access-controlled server infrastructure",
    "Regular security reviews and vulnerability assessments",
    "Restricted internal access to personal data on a need-to-know basis",
    "Logging and monitoring of access to sensitive systems",
  ] },
  { p: "While we strive to protect your data, no method of transmission over the internet or method of electronic storage is 100% secure. In the event of a data breach that is likely to result in a risk to your rights and freedoms, we will notify affected users without undue delay and take immediate remedial action." },

  { h2: "9. Payment Information and Financial Data" },
  { p: "PocketJobs facilitates payments through EcoCash and Pesepay. We do not store your full EcoCash PIN, Pesepay login credentials, or complete payment card details on our servers. All payment transactions are processed directly through the secure infrastructure of our payment partners. PocketJobs receives only transaction confirmation data (e.g., success or failure status and a transaction reference number). For information on how EcoCash and Pesepay handle your financial data, please refer to their respective privacy policies." },

  { h2: "10. Your Privacy Rights" },
  { p: "Regardless of your location, we respect the following user rights with respect to your personal data:" },
  { ul: [
    "Right to Access: request a copy of the personal information we hold about you; we will provide it within 30 days of a verified request.",
    "Right to Correction: request that we correct inaccurate or incomplete information. Many corrections can be made directly through your in-app profile settings.",
    "Right to Deletion: request deletion of your account and personal data, processed within 90 days, subject to legal retention obligations.",
    "Right to Withdraw Consent: where processing is based on consent, withdraw it at any time through your account settings or by contacting us.",
    "Right to Opt Out of Marketing: opt out at any time via the unsubscribe link, your notification preferences, or by contacting us.",
    "Right to Data Portability: request a copy of your data in a structured, commonly used, machine-readable format.",
    "Right to Object: object to certain processing activities, including processing based on legitimate interests; we respond within 30 days.",
  ] },
  { p: "To exercise any of these rights, please contact us at pocketjobszw@outlook.com. We may require you to verify your identity before processing your request." },

  { h2: "11. Children's Privacy" },
  { p: "PocketJobs is intended for use by individuals who are 18 years of age or older. We do not knowingly collect, process, or store personal information from individuals under the age of 18. If we become aware that we have inadvertently collected personal information from a person under 18 without verifiable parental consent, we will take immediate steps to delete that information from our systems. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately at support@pocketjobs.co." },

  { h2: "12. Location Data" },
  { p: "PocketJobs may request access to your device's location to help connect you with nearby service providers or relevant job opportunities within Zimbabwe." },
  { ul: [
    "Location access is optional and requires your explicit permission through your device's operating system settings",
    "We collect general location data (city or suburb level) to facilitate matching; we do not track your precise real-time GPS location continuously",
    "You may revoke location permissions at any time through your device settings, though this may limit certain platform features",
    "Location data is not shared with advertisers or used for any purpose other than facilitating service matching",
  ] },

  { h2: "13. Cookies and Tracking Technologies" },
  { p: "Our website and mobile application may use cookies and similar tracking technologies to enhance your experience, remember your preferences, and analyse platform usage. Types we may use include essential cookies (required for the Platform to function, such as maintaining your login session), performance cookies (anonymised usage data to help us improve), and functional cookies (remembering your preferences and settings). We do not use advertising or targeting cookies. You may control cookie preferences through your browser or device settings; disabling essential cookies may affect Platform functionality." },

  { h2: "14. International Data Transfers" },
  { p: "PocketJobs is based in Zimbabwe and primarily processes data within Zimbabwe. Where we use third-party service providers whose infrastructure is located outside Zimbabwe (such as cloud storage or analytics services), your data may be transferred to and processed in other countries. In such cases, we take steps to ensure adequate safeguards are in place, including contractual obligations requiring service providers to maintain data protection standards consistent with this policy." },

  { h2: "15. Third-Party Links and Services" },
  { p: "The Platform may contain links to third-party websites, applications, or services. This Privacy Policy does not apply to those third parties. We encourage you to review the privacy policies of any third-party services you access through our Platform. We are not responsible for the privacy practices or content of third-party platforms, including EcoCash, Pesepay, or social media platforms." },

  { h2: "16. Dispute Resolution and Data in Disputes" },
  { p: "When a dispute is raised on the Platform, relevant communications, transaction records, and evidence submitted by both parties may be reviewed by the PocketJobs support team for the purpose of resolving the dispute fairly. Dispute data is handled confidentially and is not shared with any party beyond those directly involved in the dispute. Records are retained in accordance with our data retention schedule outlined in Section 7." },

  { h2: "17. Changes to This Privacy Policy" },
  { p: "We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. When we make material changes, we will update the date at the top of this policy, notify registered users via in-app notification or email at least 30 days before the changes take effect, and for significant changes may require you to re-accept the policy before continuing to use the Platform. Your continued use after the effective date of any changes constitutes acceptance of the updated Privacy Policy." },

  { h2: "18. App Store Compliance" },
  { p: "This Privacy Policy has been designed to comply with the requirements of both the Google Play Developer Program Policies and the Apple App Store Review Guidelines." },
  { h3: "18.1 Google Play Compliance" },
  { ul: [
    "We disclose all data types collected by the Platform in the Data Safety section of our Google Play Store listing",
    "We provide this Privacy Policy at a stable, publicly accessible URL",
    "We handle all user data in accordance with our stated privacy practices",
    "We do not collect data beyond what is disclosed and necessary for Platform functionality",
    "Users can request account and data deletion through in-app settings or by emailing support@pocketjobs.co",
  ] },
  { h3: "18.2 Apple App Store Compliance" },
  { ul: [
    "We provide a Privacy Nutrition Label in our App Store listing disclosing data used to track users, data linked to users, and data not linked to users",
    "We request only those device permissions that are necessary for the Platform to function",
    "We do not use data collected for purposes other than those disclosed in this Privacy Policy",
    "We support Apple's App Tracking Transparency framework and request explicit permission before engaging in cross-app tracking",
    "Users may contact us at support@pocketjobs.co to request deletion of their account and associated data",
  ] },

  { h2: "19. Account and Data Deletion" },
  { p: 'You can permanently delete your account and personal data at any time, directly in the app: open your Profile or Account screen and select "Delete account" (available to customers, service providers, and corporate users). You can also email support@pocketjobs.co with the subject "Account Deletion Request" from your registered email address.' },
  { p: "Deletion takes effect immediately and signs you out of all devices. Because PocketJobs handles payments and two-sided reviews, we use a delete-and-anonymise approach so the other party's records and our financial and legal obligations remain intact:" },
  { h3: "19.1 Permanently removed" },
  { ul: [
    "Your saved addresses, saved/favourite providers, and blocked-user list",
    "Your notification preferences and stored notifications",
    "For providers: your portfolio images, listed services, availability/time-off, and public listing (you no longer appear in search results)",
    "Your open job posts are closed and any pending bids are withdrawn",
  ] },
  { h3: "19.2 Anonymised" },
  { ul: [
    'Your name is replaced with "Deleted user", and your email address, phone number, profile photo, location, and login identifiers are cleared',
    "Your account is deactivated and all active sessions are revoked immediately",
  ] },
  { h3: "19.3 Retained but de-identified" },
  { p: 'The following are kept because the other party to a transaction, and applicable financial and legal rules, rely on them. Wherever they appear, your name shows as "Deleted user":' },
  { ul: [
    "Wallet and payment transaction records (kept for financial compliance — see Section 7)",
    "Completed bookings and job history shared with the other party",
    "Reviews and ratings you gave or received",
  ] },
  { p: "Any remaining provider wallet balance is forfeited on deletion, as wallet top-ups are non-refundable platform credit. Retained records are isolated, are not used for any other purpose, and are purged on the schedule described in Section 7. We will confirm completion by email where an email address is on file." },

  { h2: "20. Security Incident Notification" },
  { p: "In the event of a data security incident that may affect your personal information, PocketJobs commits to containing and assessing the breach within 72 hours of discovery, notifying affected users without undue delay where the breach poses a risk to their rights and freedoms, providing clear information on the nature of the breach and the data affected, and advising users on steps they can take to protect themselves." },

  { h2: "21. Governing Law" },
  { p: "This Privacy Policy is governed by the laws of Zimbabwe. Any disputes arising in connection with this Privacy Policy shall be subject to the jurisdiction of the courts of Zimbabwe. Where you are located in a jurisdiction with stronger data protection rights than those provided herein, we will endeavour to respect those rights to the extent practicable." },

  { h2: "22. Contact Us" },
  { p: "If you have any questions, concerns, or requests relating to this Privacy Policy or the way we handle your personal data, contact us at info@pocketjobs.co (Website: pocketjobs.co · Harare, Zimbabwe). We respond within 30 days of receiving your message. For urgent data protection matters, please mark your subject line \"URGENT: Privacy Request.\"" },
  { p: "By using the PocketJobs Platform, you acknowledge that you have read, understood, and agreed to this Privacy Policy. PocketJobs (Pvt) Ltd — Work made simple. Opportunities made possible." },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      effective="June 13, 2026"
      version="1.0"
      intro="This Privacy Policy explains how PocketJobs collects, uses, stores, shares, protects, and deletes your personal information when you use our mobile application, website, and related services."
      blocks={blocks}
    />
  );
}
