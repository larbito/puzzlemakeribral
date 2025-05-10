import { PageLayout } from '@/components/layout/PageLayout';

export const Privacy = () => {
  return (
    <PageLayout
      title="Privacy Policy"
      description="Last updated: March 15, 2024"
    >
      <div className="prose prose-invert max-w-none">
        <h2>1. Information We Collect</h2>
        <p>
          We collect information that you provide directly to us, including when you create an account,
          make a purchase, or contact us for support. This may include:
        </p>
        <ul>
          <li>Name and contact information</li>
          <li>Payment information</li>
          <li>Account credentials</li>
          <li>Design and content preferences</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>
          We use the information we collect to:
        </p>
        <ul>
          <li>Provide and improve our services</li>
          <li>Process your transactions</li>
          <li>Send you updates and marketing communications</li>
          <li>Respond to your requests and support needs</li>
          <li>Maintain the security of our platform</li>
        </ul>

        <h2>3. Information Sharing</h2>
        <p>
          We do not sell your personal information. We may share your information with:
        </p>
        <ul>
          <li>Service providers who assist in our operations</li>
          <li>Print-on-demand partners to fulfill your orders</li>
          <li>Law enforcement when required by law</li>
        </ul>

        <h2>4. Your Rights</h2>
        <p>
          You have the right to:
        </p>
        <ul>
          <li>Access your personal information</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of your information</li>
          <li>Opt-out of marketing communications</li>
        </ul>

        <h2>5. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at:
          <br />
          Email: privacy@puzzlecraft.com
          <br />
          Address: 123 Craft Street, Design City, DC 12345
        </p>
      </div>
    </PageLayout>
  );
}; 