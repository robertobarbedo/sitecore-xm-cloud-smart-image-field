"use client";

import { useMarketplaceClient } from "@/src/utils/hooks/useMarketplaceClient";
import { LibraryManager } from "./components/LibraryManager";

function AdminPage() {
  const { client, error, isInitialized } = useMarketplaceClient();

  // Show loading state while initializing client
  if (!isInitialized) {
    return (
      <div className="loading-container">
        <div>Initializing Sitecore client...</div>
        <style jsx>{`
          .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: #717171;
            font-size: 0.875rem;
            background-color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
          }
        `}</style>
      </div>
    );
  }

  // Show error if client failed to initialize
  if (error) {
    return (
      <div className="error-container">
        <div>Client Error: {String(error)}</div>
        <style jsx>{`
          .error-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: #D92739;
            font-size: 0.875rem;
            padding: 1.25rem;
            text-align: center;
            background-color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
          }
        `}</style>
      </div>
    );
  }

  // Show main library management interface
  if (client) {
    return <LibraryManager client={client} />;
  }

  // Fallback - should not reach here
  return (
    <div className="error-container">
      <div>Unable to initialize the application</div>
      <style jsx>{`
        .error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          color: #D92739;
          font-size: 0.875rem;
          padding: 1.25rem;
          text-align: center;
          background-color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        }
      `}</style>
    </div>
  );
}

export default AdminPage;
