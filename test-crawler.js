// Test script to create a crawler rule
const testCrawlerRule = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/crawler/rules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: "Cheap Chairs in KY",
        searchQuery: "chair",
        locations: [
          "Louisville - Intermodal Dr.",
          "Florence - Industrial Road", 
          "Elizabethtown - Peterson Drive"
        ],
        maxBidPrice: "10.00",
        maxTimeLeft: 5,
        checkInterval: 5,
        isActive: true
      })
    });

    const result = await response.json();
    console.log('Created crawler rule:', result);
  } catch (error) {
    console.error('Error creating crawler rule:', error);
  }
};

// Wait a moment for server to start, then test
setTimeout(testCrawlerRule, 3000);
