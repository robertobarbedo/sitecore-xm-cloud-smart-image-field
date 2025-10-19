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
            color: #666;
            font-size: 14px;
            background-color: #ffffff;
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
            color: #d32f2f;
            font-size: 14px;
            padding: 20px;
            text-align: center;
            background-color: #ffffff;
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
          color: #d32f2f;
          font-size: 14px;
          padding: 20px;
          text-align: center;
          background-color: #ffffff;
        }
      `}</style>
    </div>
  );
}

export default AdminPage;
