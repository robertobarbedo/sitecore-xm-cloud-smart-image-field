"use client";

import { useEffect, useState } from "react";
import { useMarketplaceClient } from "@/src/utils/hooks/useMarketplaceClient";
import { ApplicationContext } from "@sitecore-marketplace-sdk/client";
import { ItemInfo } from "./ItemInfo";

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
    return (
      <div className="application-context">
        <p>Initializing extension...</p>
        <style jsx>{`
          .application-context {
            padding: 1rem;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
          }
          .application-context p {
            color: #717171;
            font-size: 0.8125rem;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="application-context">
        <p style={{ color: "#d32f2f" }}>Error: {String(error)}</p>
        <style jsx>{`
          .application-context {
            padding: 1rem;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
          }
          .application-context p {
            font-size: 0.8125rem;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="application-context">
      <div className="context-section">
        <h3>Application Context</h3>
        <div className="context-details">
          <div className="detail-item">
            <span className="detail-label">Name:</span>
            <span className="detail-value">{appContext?.name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">ID:</span>
            <span className="detail-value">{appContext?.id}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Installation ID:</span>
            <span className="detail-value">{appContext?.installationId}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">State:</span>
            <span className="detail-value">{appContext?.state}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Type:</span>
            <span className="detail-value">{appContext?.type}</span>
          </div>
        </div>
      </div>
      <div>
        <ItemInfo itemId="EE42AE9C7EEB40F69EE91C700DDF660A" />
      </div>
      
      <style jsx>{`
        .application-context {
          padding: 1rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        }
        
        .context-section h3 {
          color: #3B3B3B;
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0 0 0.75rem 0;
        }
        
        .context-details {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }
        
        .detail-item {
          font-size: 0.8125rem;
        }
        
        .detail-label {
          display: block;
          color: #717171;
          font-weight: 400;
          margin-bottom: 0.25rem;
        }
        
        .detail-value {
          color: #3B3B3B;
          word-break: break-all;
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}
