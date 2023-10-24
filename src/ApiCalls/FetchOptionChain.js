const FetchOptionChain = (portfolioData) => {
    return fetch("http://localhost:5001/get-option-chain", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ portfolio: portfolioData })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .catch(error => {
      console.error("Error fetching data:", error);
      throw error;
    });
  }
  
  export default FetchOptionChain;
  