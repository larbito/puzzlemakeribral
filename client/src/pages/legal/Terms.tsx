import { PageLayout } from '@/components/layout/PageLayout';

export const Terms = () => {
  return (
    <PageLayout
      title="Terms of Service"
      description="Last updated: March 15, 2024"
    >
      <div className="prose prose-invert max-w-none">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using PuzzleCraft's services, you agree to be bound by these Terms of Service
          and all applicable laws and regulations. If you do not agree with any of these terms, you are
          prohibited from using or accessing our services.
        </p>

        <h2>2. Use License</h2>
        <p>
          Permission is granted to temporarily access and use PuzzleCraft's services for personal,
          non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and
          under this license you may not:
        </p>
        <ul>
          <li>Modify or copy the materials</li>
          <li>Use the materials for any commercial purpose</li>
          <li>Attempt to decompile or reverse engineer any software</li>
          <li>Remove any copyright or other proprietary notations</li>
          <li>Transfer the materials to another person</li>
        </ul>

        <h2>3. User Content</h2>
        <p>
          When you create or upload content using our services, you retain ownership of your intellectual
          property rights. However, you grant PuzzleCraft a license to use, store, and share your content
          as necessary to provide our services.
        </p>

        <h2>4. Account Terms</h2>
        <p>
          To access certain features of our platform, you must create an account. You are responsible for:
        </p>
        <ul>
          <li>Maintaining the security of your account</li>
          <li>All activities that occur under your account</li>
          <li>Ensuring your account information is accurate</li>
          <li>Notifying us of any unauthorized use</li>
        </ul>

        <h2>5. Payment Terms</h2>
        <p>
          Paid services are billed in advance on a subscription basis. Refunds are handled according to
          our refund policy. You are responsible for all applicable taxes and fees.
        </p>

        <h2>6. Termination</h2>
        <p>
          We may terminate or suspend your account and access to our services at any time, without prior
          notice or liability, for any reason, including breach of these Terms.
        </p>

        <h2>7. Contact Information</h2>
        <p>
          Questions about the Terms of Service should be sent to us at:
          <br />
          Email: legal@puzzlecraft.com
          <br />
          Address: 123 Craft Street, Design City, DC 12345
        </p>
      </div>
    </PageLayout>
  );
}; 