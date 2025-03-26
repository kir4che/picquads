import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <main>
      <article className="max-w-3xl px-6 py-8 mx-auto space-y-8 bg-white rounded-lg shadow-sm sm:px-10">
        <header className="pb-6 space-y-4 border-b border-violet-100">
          <h1 className="text-4xl font-bold text-violet-900">Privacy Policy</h1>
          <p className="text-sm text-violet-600">
            Effective Date: March 26, 2025
          </p>
          <p className="text-base leading-relaxed">
            We value your privacy and are committed to protecting it. This Privacy Policy explains how we handle your data when you use our online photo booth service.
          </p>
        </header>
        <section className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-violet-900">Data Collection and Storage</h2>
            <p className="leading-relaxed">
              We do not track, collect, or store any personal data. All photos taken using our service are processed locally on your device and are not uploaded, saved, or stored on any servers.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-violet-900">Cookies and Trackers</h2>
            <p className="leading-relaxed">
              Our website does not use cookies, analytics tools, or any other tracking mechanisms.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-violet-900">Third-Party Services</h2>
            <p className="leading-relaxed">
              We do not integrate with or share data with any third-party services.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-violet-900">Security</h2>
            <p className="leading-relaxed">
              Since we do not collect or store any data, there is no risk of unauthorized access or data breaches.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-violet-900">Contact</h2>
            <p className="leading-relaxed">
              If you have any questions about our privacy policy, please contact us via:
            </p>
            <p className="pt-2">
              Email:
              <Link 
                to="mailto:mollydcxxiii@gmail.com" 
                className="ml-2 font-medium underline rounded text-violet-700 hover:text-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                tabIndex={0}
                aria-label="Send email to mollydcxxiii@gmail.com"
              >
                mollydcxxiii@gmail.com
              </Link>
            </p>
          </div>
        </section>
      </article>
    </main>
  );
};

export default PrivacyPolicy; 