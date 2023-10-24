import React, { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, TableCell, TableRow, TableHead, TableBody, TableContainer, Paper, Table, CircularProgress } from '@material-ui/core';
import FetchOptionChain from './ApiCalls/FetchOptionChain';


function App() {
  const [data, setData] = useState(null);
  const [selectedTicker, setSelectedTicker] = useState("");
  const [selectedExpiration, setSelectedExpiration] = useState("");
  const [selectedStrike, setSelectedStrike] = useState("");
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    fetch('portfolio.json')
      .then(response => response.json())
      .then(jsonData => {
        setPortfolio(jsonData);
        
        // Fetch the option chain data for the entire portfolio
        return FetchOptionChain(jsonData);
      })
      .then(optionData => {
        setData(optionData);
        const firstTicker = Object.keys(optionData)[0];
        setSelectedTicker(firstTicker);
        setSelectedExpiration(optionData[firstTicker][0]?.monthly_expirations[0]);
        setSelectedStrike(optionData[firstTicker][0]?.strike);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching data:", err);
        setLoading(false);
      });
  }, []);



  if (loading || !data || !portfolio) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }


  const handleTickerChange = (e) => {
    const tickerData = data[e.target.value];
    
    if (tickerData && tickerData.length > 0) {
        setSelectedTicker(e.target.value);
        setSelectedExpiration(tickerData[0]?.monthly_expirations[0]);
        setSelectedStrike(tickerData[0]?.strike);
    } else {
        console.error("No data available for ticker:", e.target.value);
    }
};

  const handleExpirationChange = (e) => {
    setSelectedExpiration(e.target.value.split('-').join(''));
  };

  const handleStrikeChange = (e) => {
    setSelectedStrike(e.target.value);
  };

  const uniqueTickers = Object.keys(data);
  const expirationDates = [...new Set(data[selectedTicker]?.flatMap(item => item.monthly_expirations) || [])].sort();
  const formattedExpirationDates = expirationDates.map(date => ({ value: date, formatted: new Date(date.slice(0, 4), date.slice(4, 6) - 1, date.slice(6, 8)).toLocaleDateString() }));
  const strikePrices = data[selectedTicker]?.filter(item => item.monthly_expirations.includes(selectedExpiration)).map(item => item.strike) || [];

  const uniqueMonthlyExpirations = [...new Set(data[selectedTicker]?.flatMap(item => item.monthly_expirations) || [])].sort();
  const formattedMonthlyExpirations = uniqueMonthlyExpirations.map(date => ({ value: date, formatted: new Date(date.slice(0, 4), date.slice(4, 6) - 1, date.slice(6, 8)).toLocaleDateString() }));
  const uniqueStrikes = Array.from(new Set(data[selectedTicker]?.map(item => item.strike) || [])).sort((a, b) => a - b);

  const selectedStrikeIndex = uniqueStrikes.findIndex(strike => strike === selectedStrike);
  const startStrikeIndex = Math.max(0, selectedStrikeIndex - 5);
  const endStrikeIndex = Math.min(uniqueStrikes.length, selectedStrikeIndex + 4);
  const displayMetaData = data[selectedTicker]?.filter(item => uniqueStrikes.slice(startStrikeIndex, endStrikeIndex + 1).includes(item.strike)) || [];

  const tableRows = displayMetaData.map((item, rowIndex) => {
    const cells = formattedMonthlyExpirations.map((date, dateIndex) => {
      const expirationIndex = item.monthly_expirations.indexOf(date.value);
      const bid = expirationIndex !== -1 ? item.monthly_bids[expirationIndex] : '-';
      return <TableCell key={dateIndex}>{bid}</TableCell>;
    });

    return (
      <TableRow key={rowIndex}>
        <TableCell>{item.strike}</TableCell>
        {cells}
      </TableRow>
    );
  });

  return (
    <Box display="flex" flexDirection="column" alignItems="center" padding={2}>
      <Box width="30%" marginBottom={2}>
        <FormControl style={{ width: '25%', marginLeft: '10px' }}>
          <InputLabel>Select Ticker</InputLabel>
          <Select value={selectedTicker} onChange={handleTickerChange}>
            {portfolio.map(item => (
              <MenuItem
                key={item.ticker}
                value={item.ticker}
                disabled={item.quantity <= 100}
                title={item.quantity <= 100 ? "Quantity is less than or equal to 100" : ""}
              >
                {item.ticker} (Quantity: {item.quantity})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box width="70%" display="flex" justifyContent="space-around" marginBottom={20}>
        <FormControl style={{ width: '35%', marginRight: '10px', marginLeft: '10px' }}>
          <InputLabel>Select Expiration Date</InputLabel>
          <Select value={selectedExpiration} onChange={handleExpirationChange}>
            {formattedExpirationDates.map((date, index) => (
              <MenuItem key={index} value={date.value}>
                {date.formatted}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl style={{ width: '35%', marginLeft: '10px' }}>
          <InputLabel>Select Strike Price</InputLabel>
          <Select value={selectedStrike} onChange={handleStrikeChange}>
            {strikePrices.map((strike, index) => (
              <MenuItem key={index} value={strike}>
                {strike}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <TableContainer component={Paper} style={{ maxHeight: 340, maxWidth: '70%', margin: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Strike</TableCell>
              {formattedMonthlyExpirations.slice(0, 5).map((date, index) => (
                <TableCell key={index} style={{ fontWeight: 900 }}>{date.formatted}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayMetaData.map((item, rowIndex) => {
              const isInTheMoney = item.money_flag === 1;

              const cells = formattedMonthlyExpirations.slice(0, 5).map((date, dateIndex) => {
                const expirationIndex = item.monthly_expirations.indexOf(date.value);
                const bid = expirationIndex !== -1 ? item.monthly_bids[expirationIndex] : '-';
                const isSelected = selectedStrike === item.strike && selectedExpiration === date.value;
                return (
                  <TableCell
                    key={dateIndex}
                    style={isSelected ? { backgroundColor: '#e0f7e9' } : {}}
                  >
                    {bid}
                  </TableCell>
                );
              });

              return (
                <TableRow key={rowIndex}>
                  <TableCell
                    style={{ fontWeight: 900, backgroundColor: isInTheMoney ? '#e0f7e9' : '#ffd6d6' }}
                  >
                    {item.strike}
                  </TableCell>
                  {cells}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
export default App;

