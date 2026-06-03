const ESI_STATUS_URL = "https://esi.evetech.net/latest/status/";

async function checkEsiStatus() {
  try {
    console.log(`Pinging ESI Server Status at: ${ESI_STATUS_URL}`);
    const response = await fetch(ESI_STATUS_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("ESI Server Status Response:");
     
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Failed to ping ESI Server Status:", error);
  }
}

checkEsiStatus();
