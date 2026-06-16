import type { Metadata } from "next";
import LegalDoc, { type Block } from "../../components/LegalDoc";

export const metadata: Metadata = {
  title: "Terms & Conditions · PocketJobs",
  description: "The Terms and Conditions of Use governing your use of the PocketJobs platform.",
};

const blocks: Block[] = [
  { p: "PLEASE READ THESE TERMS AND CONDITIONS CAREFULLY BEFORE USING THE POCKETJOBS PLATFORM. BY REGISTERING AN ACCOUNT, ACCESSING, OR USING THE PLATFORM IN ANY WAY, YOU CONFIRM THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE LEGALLY BOUND BY THESE TERMS. IF YOU DO NOT AGREE, YOU MUST NOT USE THE PLATFORM." },

  { h2: "1. About PocketJobs" },
  { p: 'PocketJobs is a digital service marketplace and employment platform owned and operated by PocketJobs ZW, a business based in Harare, Zimbabwe. PocketJobs connects individuals and organisations seeking services or employment opportunities ("Clients" or "Employers") with skilled individuals offering services or seeking work ("Service Providers" or "Job Seekers").' },
  { p: 'The Platform is accessible via our mobile application, available on Google Play and the Apple App Store, as well as through our website. These Terms and Conditions ("Terms") govern your use of all PocketJobs products and services. Operator: PocketJobs (Pvt) Ltd · Contact: info@pocketjobs.co · Harare, Zimbabwe.' },

  { h2: "2. Definitions" },
  { ul: [
    '"Platform" means the PocketJobs mobile application, website, and all related services operated by PocketJobs (Pvt) Ltd.',
    '"User" means any individual or entity that accesses or uses the Platform, including Clients, Employers, Service Providers, Job Seekers, and visitors.',
    '"Client" means a User who posts a request for services or hires a Service Provider through the Platform.',
    '"Service Provider" means a User who offers services or seeks short-term, flexible, or employment opportunities through the Platform.',
    '"Quick Job" means a short-term, task-based service engagement facilitated through the Platform.',
    '"Browse and Book" means the feature allowing Clients to discover and directly book listed Service Providers.',
    '"Listing" means a profile, service offering, or job opportunity posted by a User on the Platform.',
    '"Transaction" means any payment or financial exchange facilitated through the Platform, including payments processed via EcoCash or Pesepay.',
    '"Content" means any text, images, reviews, ratings, messages, or other material submitted to the Platform by a User.',
    '"Subscription" means a recurring paid plan offering enhanced Platform features to Users.',
    '"Boost" means a paid feature allowing a Listing to appear with increased prominence on the Platform.',
    '"Verification Badge" means the indicator shown on a Service Provider\'s profile confirming that their identity has been verified by PocketJobs.',
    '"Dispute" means a formal complaint raised by one User against another through the Platform\'s dispute resolution system.',
    '"We," "us," or "our" refers to PocketJobs (Pvt) Ltd.',
  ] },

  { h2: "3. Eligibility and Account Requirements" },
  { p: "To use the Platform, you must meet all of the following requirements:" },
  { ul: [
    "You must be at least 18 years of age.",
    "You must be legally capable of entering into binding contracts under the laws of Zimbabwe.",
    "You must not have been previously suspended or permanently banned from the Platform.",
    "You must not be located in a jurisdiction where use of the Platform is prohibited by law.",
    "If registering on behalf of a business or organisation, you must have the authority to bind that entity to these Terms.",
  ] },
  { p: "By using the Platform, you represent and warrant that all of the above eligibility criteria are met. PocketJobs reserves the right to verify eligibility at any time and to terminate accounts that do not comply." },

  { h2: "4. Account Registration and Security" },
  { h3: "4.1 Creating an Account" },
  { p: "To access most features of the Platform, you are required to register and create an account. When registering, you agree to provide accurate, current, and complete information; keep your account information updated at all times; use your real identity and not impersonate any other person or entity; and create only one account unless expressly permitted by PocketJobs." },
  { h3: "4.2 Account Security" },
  { p: "You are solely responsible for maintaining the confidentiality of your account credentials, including your password and any linked mobile money PIN. You agree to keep your login credentials secure and not share them, notify us immediately at support@pocketjobs.co of any unauthorised access, and log out after each session on shared devices. PocketJobs will not be liable for any loss or damage arising from your failure to safeguard your account credentials." },
  { h3: "4.3 Account Verification" },
  { p: "PocketJobs offers an optional Verification Badge programme for Service Providers. Verification involves submitting a government-issued identity document. Verified accounts receive a badge on their profile, which may increase trust and engagement from Clients. Verification does not constitute an endorsement by PocketJobs of the quality, legality, or reliability of the User's services." },

  { h2: "5. How the Platform Works" },
  { h3: "5.1 Role of PocketJobs" },
  { p: "PocketJobs is a marketplace platform. We facilitate connections between Users but are not a party to any service agreement, employment contract, or transaction entered into between Users. PocketJobs does not employ Service Providers or Job Seekers, control the quality, legality, or delivery of services, guarantee that any job, booking, or service engagement will be completed, or act as an employer, agent, staffing agency, or labour broker. Any agreement reached between Users is solely between those Users." },
  { h3: "5.2 Quick Jobs" },
  { p: "The Quick Jobs feature allows Clients to post short-term tasks or service requests, which Service Providers may apply for or accept. Quick Jobs are task-based engagements that do not create an employment relationship between the Client and the Service Provider." },
  { h3: "5.3 Browse and Book" },
  { p: "Browse and Book allows Clients to view Service Provider profiles and book them directly for services based on the information listed in their profile. It is the Service Provider's responsibility to ensure their profile information, pricing, and availability are accurate and current." },
  { h3: "5.4 Employment Listings" },
  { p: "Employers may post longer-term employment opportunities on the Platform. Such listings must comply with applicable Zimbabwean labour law and must not discriminate on grounds prohibited by law, including race, gender, religion, or disability. PocketJobs does not guarantee placement and does not take responsibility for the employment decisions of Employers." },

  { h2: "6. User Obligations and Conduct" },
  { h3: "6.1 General Obligations" },
  { p: "All Users agree to use the Platform lawfully, ethically, and in accordance with these Terms, including: complying with all applicable laws and regulations of Zimbabwe; treating other Users with respect and professionalism; providing accurate information in profiles, listings, and communications; honouring commitments made to other Users; and promptly communicating any changes to availability, pricing, or capacity." },
  { h3: "6.2 Prohibited Conduct" },
  { p: "The following conduct is strictly prohibited on the Platform:" },
  { ul: [
    "Posting false, misleading, fraudulent, or deceptive content or listings",
    "Impersonating any person, business, or entity",
    "Harassing, threatening, defaming, or abusing other Users",
    "Discrimination against any User based on race, gender, age, religion, disability, or any other protected characteristic",
    "Soliciting or receiving payments outside the Platform to circumvent our payment infrastructure, except where cash payment has been pre-arranged and disclosed within the Platform booking",
    "Posting content that is obscene, offensive, hateful, or otherwise objectionable",
    "Uploading viruses, malware, or any code designed to harm the Platform or its Users",
    "Scraping, crawling, or extracting Platform data without written permission",
    "Creating multiple accounts to evade suspension or circumvent Platform policies",
    "Offering or soliciting bribes, kickbacks, or unlawful payments",
    "Engaging in any activity that disrupts or interferes with the Platform's operation",
    "Posting spam, unsolicited advertisements, or promotional content outside designated areas",
  ] },
  { h3: "6.3 Service Provider Obligations" },
  { ul: [
    "Only offer services they are genuinely qualified and legally permitted to provide",
    "Hold all licences, certifications, or permits required by Zimbabwean law to offer their stated services",
    "Disclose any material limitations or restrictions on their ability to deliver a booked service",
    "Comply with applicable health, safety, and workplace regulations when performing services",
    "Not subcontract any booked job to another person without the prior written consent of the Client",
  ] },
  { h3: "6.4 Client Obligations" },
  { ul: [
    "Provide accurate and sufficient information about the services or work they require",
    "Ensure that any worksite or location provided is safe and compliant with applicable legal requirements",
    "Pay agreed amounts on time and in full through the Platform's payment system",
    "Not attempt to change agreed payment terms after a booking has been confirmed",
  ] },

  { h2: "7. Payments, Fees, and Transactions" },
  { h3: "7.1 Payment Methods" },
  { p: "Payments on the Platform are processed through EcoCash and Pesepay. Users must have a valid and active EcoCash or Pesepay account to complete transactions. PocketJobs does not store full payment credentials on its servers." },
  { h3: "7.2 Platform Fees" },
  { p: "PocketJobs may charge fees for certain Platform features, including subscription fees for enhanced User plans, boost fees for promoting Listings, and verification fees for the identity verification programme. All fees are displayed clearly on the Platform before any purchase is made. Fees are non-refundable unless stated otherwise or required by applicable law." },
  { h3: "7.3 Transactions Between Users" },
  { p: "Payment amounts for services are agreed between the Client and the Service Provider. PocketJobs facilitates the transaction but is not responsible for ensuring that agreed amounts are fair, appropriate, or in line with market rates. Once a transaction is initiated, it is subject to the terms of our payment partners, EcoCash and Pesepay." },
  { h3: "7.4 Disputed Transactions" },
  { p: "If you believe a transaction was processed incorrectly or fraudulently, you must report it to us within 14 days at support@pocketjobs.co. Transaction disputes involving payment processing errors should also be raised directly with EcoCash or Pesepay. PocketJobs will cooperate in good faith to resolve disputes but cannot guarantee refunds where a transaction has been legitimately completed." },
  { h3: "7.5 Taxes" },
  { p: "Users are solely responsible for determining and meeting their own tax obligations arising from income or transactions conducted through the Platform. PocketJobs does not withhold or remit taxes on behalf of Users." },

  { h2: "8. Subscriptions, Boosts, and Paid Features" },
  { h3: "8.1 Subscriptions" },
  { p: "PocketJobs offers optional subscription plans that provide access to premium features. By subscribing, you authorise us to charge your chosen payment method on a recurring basis at the selected frequency. You may cancel at any time through your account settings; cancellation takes effect at the end of the current billing period. No refunds are issued for unused portions of a subscription period, unless required by law." },
  { h3: "8.2 In-App Purchases" },
  { p: "Purchases made through the Google Play Store or Apple App Store are also subject to the respective store's purchase policies. In the event of a conflict between these Terms and the store's policies regarding in-app purchases, the store's policies shall govern that specific transaction." },
  { h3: "8.3 Refund Policy" },
  { p: "Except as required by applicable law or the policies of Google Play or Apple App Store, all purchases of Subscriptions, Boosts, and Verification services are final and non-refundable. If you believe you are entitled to a refund, contact us at support@pocketjobs.co within 14 days of the charge and we will assess your request." },

  { h2: "9. Ratings, Reviews, and Reputation" },
  { p: "After the completion of a service engagement or job, Users may leave ratings and written reviews for one another. By submitting a rating or review, you agree that it is honest, fair, and based on your genuine experience; that you will not use reviews to harass, defame, or extort other Users; that you will not solicit, incentivise, or purchase fake reviews; and that you will not threaten negative reviews as a means of obtaining discounts or other benefits." },
  { p: "PocketJobs reserves the right to remove any review that violates these Terms or our Community Guidelines, including reviews that are false, abusive, discriminatory, or in breach of any law. A User's reputation score is based on the aggregate of verified reviews from completed engagements and is a guide only, not an endorsement by PocketJobs." },

  { h2: "10. Dispute Resolution Between Users" },
  { h3: "10.1 Platform Dispute Process" },
  { p: "If you have a dispute with another User, you should: (1) first attempt to resolve the issue directly through the in-app chat; (2) if unsuccessful, raise a formal Dispute through the Platform's dispute reporting tool within 7 days of the issue arising; (3) provide all relevant evidence including messages, payment records, and photographs within 5 business days; (4) a PocketJobs support team member will review and issue a determination within 10 business days." },
  { h3: "10.2 Three-Strike Policy" },
  { ul: [
    "First strike: formal warning issued to the User's account",
    "Second strike: temporary suspension of the User's account",
    "Third strike: permanent account termination",
  ] },
  { p: "Certain serious violations, including fraud, criminal conduct, harassment, or threats, may result in immediate permanent termination without prior warning." },
  { h3: "10.3 Limitations of Dispute Process" },
  { p: "PocketJobs acts as a facilitator and not an arbitrator in disputes between Users. Our determinations are not legally binding and do not prevent either party from seeking legal recourse through the courts of Zimbabwe. We are not liable for any losses arising from disputes between Users." },

  { h2: "11. Intellectual Property" },
  { h3: "11.1 PocketJobs Intellectual Property" },
  { p: "All content, features, branding, design, code, trademarks, logos, and materials that form part of the Platform are the exclusive property of PocketJobs (Pvt) Ltd or its licensors and are protected by applicable intellectual property laws. You are granted a limited, non-exclusive, non-transferable, revocable licence to use the Platform for its intended purpose. This licence does not permit you to copy, reproduce, modify, distribute, publicly display, or create derivative works from any part of the Platform without our prior written consent." },
  { h3: "11.2 User Content" },
  { p: "You retain ownership of the Content you submit to the Platform. By submitting Content, you grant PocketJobs (Pvt) Ltd a worldwide, royalty-free, non-exclusive licence to use, display, reproduce, and distribute that Content solely for the purpose of operating and promoting the Platform. You represent and warrant that you own or have the necessary rights to the Content you submit, and that it does not infringe the intellectual property rights of any third party." },

  { h2: "12. Content Standards and Moderation" },
  { p: "All Content submitted to the Platform must comply with the following standards:" },
  { ul: [
    "Content must be accurate, relevant, and not misleading",
    "Content must not contain hateful, discriminatory, obscene, or sexually explicit material",
    "Content must not promote illegal activity, violence, or self-harm",
    "Content must not infringe the intellectual property, privacy, or other rights of any third party",
    "Profile photographs must be a genuine representation of the User and must not be offensive or inappropriate",
  ] },
  { p: "PocketJobs reserves the right to remove or modify any Content that violates these standards or our Community Guidelines, at our sole discretion and without prior notice. Repeated violations may result in account suspension or termination." },

  { h2: "13. Privacy" },
  { p: "Your use of the Platform is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Our Privacy Policy explains how we collect, use, store, and protect your personal information, and sets out your rights as a data subject. By using the Platform, you consent to the processing of your personal data in accordance with our Privacy Policy." },

  { h2: "14. Third-Party Services and Links" },
  { p: "The Platform integrates with or may link to third-party services, including EcoCash, Pesepay, Google Maps, and social login providers. These third-party services are governed by their own terms of service and privacy policies, over which PocketJobs has no control. PocketJobs is not responsible for the availability, accuracy, content, or practices of any third-party service; your use of them is entirely at your own risk. In-app purchases processed through the Google Play Store or the Apple App Store are also subject to the terms of Google LLC and Apple Inc. respectively." },

  { h2: "15. Disclaimers and Limitation of Liability" },
  { h3: "15.1 No Warranty" },
  { p: 'THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR UNINTERRUPTED SERVICE. PocketJobs does not warrant that the Platform will be available or error-free, that any profile/listing/review is accurate, that any Service Provider is qualified or fit, or that any job listing is genuine or will result in employment.' },
  { h3: "15.2 Limitation of Liability" },
  { p: "TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, POCKETJOBS (PVT) LTD AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR any indirect, incidental, consequential, special, or punitive damages; any loss of income, revenue, profits, business, data, or goodwill; any loss arising from the conduct of other Users; any damage to property or personal injury arising from services arranged through the Platform; or any loss arising from unauthorised account access where you failed to maintain reasonable security. Where liability cannot be fully excluded by law, our total aggregate liability shall not exceed the amount you paid to PocketJobs (Pvt) Ltd in the 30 days preceding the claim." },
  { h3: "15.3 Indemnification" },
  { p: "You agree to indemnify, defend, and hold harmless PocketJobs (Pvt) Ltd and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable legal fees) arising out of or in connection with your use of the Platform, your violation of these Terms, your violation of any applicable law or third-party rights, any Content you submit, or any dispute between you and another User." },

  { h2: "16. Account Suspension and Termination" },
  { h3: "16.1 Termination by You" },
  { p: 'You may close your account at any time by selecting "Delete Account" in the Platform settings or by emailing support@pocketjobs.co. Termination does not relieve you of any obligations incurred prior to termination, including outstanding payments.' },
  { h3: "16.2 Termination by PocketJobs" },
  { p: "PocketJobs reserves the right to suspend or permanently terminate your account, with or without prior notice, if you violate these Terms, our Community Guidelines, or any applicable law; engage in fraudulent, abusive, or harmful conduct; receive a third strike under our three-strike policy; we are required to do so by law; or we determine that your continued access poses a risk to other Users or the Platform." },
  { h3: "16.3 Effect of Termination" },
  { p: "Upon termination, your right to access and use the Platform ceases immediately. We may retain certain information as required by law or for legitimate business purposes. Sections of these Terms that by their nature should survive termination (including but not limited to Sections 11, 13, 15, 18, and 21) shall continue to apply." },

  { h2: "17. Modifications to the Platform and Terms" },
  { h3: "17.1 Changes to the Platform" },
  { p: "PocketJobs reserves the right to modify, update, suspend, or discontinue any part of the Platform at any time, with or without notice. We will endeavour to notify Users of significant changes affecting their use of the Platform." },
  { h3: "17.2 Changes to These Terms" },
  { p: "We may update these Terms from time to time. When we make material changes, we will update the date at the top of these Terms, notify registered Users via in-app notification or email at least 30 days before the new Terms take effect, and for significant changes require Users to re-accept the Terms. Your continued use after the effective date constitutes acceptance. If you do not agree, you must stop using the Platform and close your account." },

  { h2: "18. App Store Compliance" },
  { h3: "18.1 Google Play" },
  { ul: [
    "Users may request deletion of their account and all associated data at any time, through in-app settings or by emailing support@pocketjobs.co",
    "In-app purchases are processed in accordance with Google Play's billing policies where applicable",
    "The Platform does not collect user data beyond what is disclosed in our Privacy Policy and the Data Safety section of the Google Play listing",
    "The Platform does not contain deceptive, manipulative, or misleading features",
    "All permissions requested by the app are disclosed and necessary for Platform functionality",
  ] },
  { h3: "18.2 Apple App Store" },
  { ul: [
    "In-app purchases are available through Apple's in-app purchase system where required, subject to Apple's standard transaction terms",
    "PocketJobs respects Apple's App Tracking Transparency framework and requests explicit consent before cross-app tracking",
    "Users may delete their account through the Platform (Section 16.1), consistent with Apple's account-deletion requirement",
    "The Platform does not include content, features, or functionality that violates Apple's content guidelines",
  ] },
  { h3: "18.3 General App Store Terms" },
  { p: "PocketJobs (Pvt) Ltd, not Google LLC or Apple Inc., is solely responsible for the Platform and its content. Google LLC and Apple Inc. have no obligation to provide maintenance, support, or warranty services. Any product liability, consumer protection, intellectual property infringement, or other claims relating to the Platform are the responsibility of PocketJobs (Pvt) Ltd." },

  { h2: "19. Force Majeure" },
  { p: "PocketJobs shall not be liable for any failure or delay in performing its obligations under these Terms where such failure or delay is caused by circumstances beyond our reasonable control, including acts of God, natural disasters, war, civil unrest, strikes, government action, telecommunications failure, or internet disruption. In such circumstances, our obligations will be suspended for the duration of the event, and we will notify Users as soon as reasonably practicable." },

  { h2: "20. Entire Agreement and Severability" },
  { p: "These Terms, together with our Privacy Policy and any additional terms applicable to specific features, constitute the entire agreement between you and PocketJobs (Pvt) Ltd with respect to your use of the Platform and supersede all prior agreements, representations, and understandings. If any provision is found to be invalid, unlawful, or unenforceable, that provision shall be severed and the remaining Terms shall continue in full force and effect. Any failure by PocketJobs to enforce any right or provision shall not constitute a waiver of that right or provision." },

  { h2: "21. Governing Law and Jurisdiction" },
  { p: "These Terms are governed by and construed in accordance with the laws of Zimbabwe. Any dispute arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of Zimbabwe. If you are accessing the Platform from outside Zimbabwe, you do so at your own initiative and are responsible for compliance with local laws to the extent they apply." },

  { h2: "22. Contact Information" },
  { p: "If you have any questions, concerns, or feedback regarding these Terms or the Platform, please contact us at info@pocketjobs.co (Operator: PocketJobs (Pvt) Ltd · Harare, Zimbabwe). We aim to respond to all inquiries within 5 business days. For urgent legal or compliance matters, please mark your subject line \"URGENT: Legal Inquiry.\"" },
  { p: "By creating an account or using the PocketJobs Platform, you confirm that you have read, understood, and agreed to these Terms and Conditions of Use. PocketJobs ZW — Work made simple. Opportunities made possible." },
];

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms & Conditions"
      effective="June 13, 2026"
      version="1.0"
      intro="These Terms and Conditions of Use govern your access to and use of the PocketJobs platform, including our mobile application and website."
      blocks={blocks}
    />
  );
}
