"use client";

import { useEffect, useState } from "react";
import { useMarketplaceClient } from "@/src/utils/hooks/useMarketplaceClient";
import { ApplicationContext } from "@sitecore-marketplace-sdk/client";

interface ItemField {
  name: string;
  value: string;
}

interface ItemInfo {
  itemId: string;
  name: string;
  path: string;
  fields: {
    nodes: ItemField[];
  };
}

interface ItemInfoComponentProps {
  itemId?: string;
}

export function ItemInfo({ itemId = "{AC5FDC0C-F33B-4524-B6F7-AA2E42CF857A}" }: ItemInfoComponentProps) {
  const { client, isInitialized, error } = useMarketplaceClient();
  const [itemInfo, setItemInfo] = useState<ItemInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [appContext, setAppContext] = useState<ApplicationContext | null>(null);

  // First, get the application context
  useEffect(() => {
    if (!error && isInitialized && client && !appContext) {
      console.log("Getting application context...");
      client.query("application.context")
        .then((res) => {
          console.log("Application context retrieved:", res.data);
          setAppContext(res.data as ApplicationContext);
        })
        .catch((error) => {
          console.error("Error retrieving application context:", error);
          setQueryError(`Failed to retrieve application context: ${error.message || String(error)}`);
        });
    }
  }, [client, error, isInitialized, appContext]);

  // Then, make the GraphQL query using the application context
  useEffect(() => {
    if (!error && isInitialized && client && appContext) {
      setLoading(true);
      setQueryError(null);
      
      // Get the Sitecore Context ID from the application context
      const sitecoreContextId = (appContext as any).resourceAccess?.[0]?.context?.preview;
      
      // Check if the Sitecore Context ID is available
      if (!sitecoreContextId) {
        setQueryError("Sitecore Context ID not found in application context. Make sure your app is configured to use XM Cloud APIs.");
        setLoading(false);
        return;
      }

      // GraphQL query to retrieve item details
      const graphqlQuery = {
        query: `
          query {
            item(
              where: {
                database: "master",
                itemId: "${itemId}"
              }
            ) {
              itemId
              name
              path
              fields(ownFields: true, excludeStandardFields: true) {
                nodes {
                  name
                  value
                }
              }
            }
          }
        `
      };
      
      console.log("Executing GraphQL query:", graphqlQuery.query);
      console.log("Using Sitecore Context ID:", sitecoreContextId);
      
      // Make the GraphQL query using the correct SDK method
      client.mutate("xmc.authoring.graphql", {
        params: {
          query: {
            sitecoreContextId,
          },
          body: graphqlQuery,
        },
      })
        .then((response) => {
          console.log("GraphQL query response:", response);
          
          // Extract item data from the response
          const itemData = (response as any)?.data?.data?.item;
          
          if (itemData && itemData.name && itemData.itemId) {
            setItemInfo({
              itemId: itemData.itemId,
              name: itemData.name,
              path: itemData.path,
              fields: itemData.fields || { nodes: [] }
            });
          } else {
            setQueryError(`Item not found with ID: ${itemId}`);
          }
        })
        .catch((error) => {
          console.error("Error executing GraphQL query:", error);
          setQueryError(`Failed to retrieve item: ${error.message || String(error)}`);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [client, error, isInitialized, appContext, itemId]);

  if (!isInitialized) {
    return <p>Initializing Sitecore client...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>Client Error: {String(error)}</p>;
  }

  if (loading) {
    return <p>Loading item information...</p>;
  }

  if (queryError) {
    return <p style={{ color: "red" }}>Query Error: {queryError}</p>;
  }

  if (!itemInfo) {
    return <p>No item information available</p>;
  }

  return (
    <div className="item-info">
      <h3>Item Information</h3>
      <div className="item-details">
        <div className="item-field">
          <strong>Name:</strong> {itemInfo.name}
        </div>
        <div className="item-field">
          <strong>Item ID:</strong> {itemInfo.itemId}
        </div>
        <div className="item-field">
          <strong>Path:</strong> {itemInfo.path}
        </div>
        
        {itemInfo.fields.nodes.length > 0 && (
          <div className="item-field">
            <strong>Fields:</strong>
            <div className="fields-list">
              {itemInfo.fields.nodes.map((field, index) => (
                <div key={index} className="field-item">
                  <span className="field-name">{field.name}:</span>
                  <span className="field-value">{field.value || '(empty)'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .item-info {
          margin: 20px 0;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background-color: #f9f9f9;
        }
        
        .item-details {
          margin-top: 10px;
        }
        
        .item-field {
          margin: 8px 0;
          padding: 5px 0;
        }
        
        .item-field strong {
          display: inline-block;
          min-width: 120px;
          color: #333;
        }
        
        .fields-list {
          margin-top: 10px;
          padding-left: 20px;
        }
        
        .field-item {
          margin: 5px 0;
          padding: 3px 0;
          border-bottom: 1px solid #eee;
        }
        
        .field-name {
          font-weight: bold;
          color: #555;
          margin-right: 10px;
        }
        
        .field-value {
          color: #666;
          font-family: monospace;
          background-color: #f0f0f0;
          padding: 2px 6px;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}