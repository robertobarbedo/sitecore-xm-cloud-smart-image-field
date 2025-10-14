"use client";

import { useEffect, useState } from "react";
import { useMarketplaceClient } from "@/src/utils/hooks/useMarketplaceClient";
import { ApplicationContext } from "@sitecore-marketplace-sdk/client";

interface AppContextProps {
  onContextLoaded?: (context: ApplicationContext) => void;
}

export function AppContext({ onContextLoaded }: AppContextProps) {
  const { client, isInitialized, error } = useMarketplaceClient();
  const [appContext, setAppContext] = useState<ApplicationContext>();

  useEffect(() => {
    if (!error && isInitialized && client) {
      // Make a query to retrieve the application context
      client.query("application.context")
        .then((res) => {
          setAppContext(res.data);
          if (res.data && onContextLoaded) {
            onContextLoaded(res.data);
          }
        })
        .catch((error) => {
          console.error("Error retrieving application.context:", error);
        });
    } else if (error) {
      console.error("Error initializing Marketplace client:", error);
    }
  }, [client, error, isInitialized, onContextLoaded]);

  if (!isInitialized) {
    return <p>Initializing extension...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>Error: {String(error)}</p>;
  }

  return (
    <div className="application-context">
      <h1>Welcome to {appContext?.name}</h1>
      <p>This is a custom field extension.</p>
      
      <div>
        <h3>Application Context:</h3>
        <ul className="context-details">
          <li><strong>Name:</strong> {appContext?.name}</li>
          <li><strong>ID:</strong> {appContext?.id}</li>
          <li><strong>Icon URL:</strong> {appContext?.iconUrl}</li>
          <li><strong>Installation ID:</strong> {appContext?.installationId}</li>
          <li><strong>State:</strong> {appContext?.state}</li>
          <li><strong>Type:</strong> {appContext?.type}</li>
          <li><strong>URL:</strong> {appContext?.url}</li>
        </ul>
      </div>
    </div>
  );
}
