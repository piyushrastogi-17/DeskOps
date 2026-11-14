
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("Connecting to backend...");
  const [error, setError] = useState("");

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/health`
        );

        if (!response.ok) {
          throw new Error("Backend request failed");
        }

        const data = await response.json();
        setMessage(data.message);
      } catch {
        setError("Unable to connect to the backend.");
      }
    };

    checkBackend();
  }, []);

  return (
    <div className="app">
      <h1>DeskOps</h1>
      <p>Facilities Management Service Desk</p>

      <div className="status">
        <h2>Backend Connection</h2>
        {error ? (
          <p className="error">{error}</p>
        ) : (
          <p className="success">{message}</p>
        )}
      </div>
    </div>
  );
}

export default App;
