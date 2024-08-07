import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import '../styles/Dashboard.css';
import { useUser } from "@clerk/clerk-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Filters = ({ typeFilter, setTypeFilter, startDate, setStartDate, crimeTypes, severityFilter, setSeverityFilter }) => {
  return (
    <div className="filters-container">
      <div class="filters-right">
      <select
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
        className="filter-select"
      >
        <option value="">All Types</option>
        {Object.keys(crimeTypes).map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
      </div>
      <select
        value={severityFilter}
        onChange={(e) => setSeverityFilter(e.target.value)}
        className="filter-select"
      >
        <option value="">All Severities</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>
      <div class="filters-left">
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="filter-date"
      />
      </div>
    </div>
  );
};

const Dashboard = ({ user }) => {
  const { user: userdata } = useUser();
  const [crimes, setCrimes] = useState([]);
  const [view, setView] = useState('dashboard');
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [adminLocation, setAdminLocation] = useState(null);
  const [solvedCrimes, setSolvedCrimes] = useState([]);
  const [unsolvedCrimes, setUnsolvedCrimes] = useState([]);

  useEffect(() => {
    fetch('http://8okf4vjhsldv9fnacs4gf6iano.ingress.hurricane.akash.pub/api/reports')
      .then(response => response.json())
      .then(data => {
        console.log('Fetched data:', data);
        const solved = data.filter(crime => crime.status === 'solved');
        const unsolved = data.filter(crime => crime.status === 'active');
        console.log('Solved crimes:', solved);
        console.log('Unsolved crimes:', unsolved);
        setSolvedCrimes(solved);
        setUnsolvedCrimes(unsolved);
      })
      .catch(error => {
        console.error('Error fetching reports:', error);
      });
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAdminLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

  useEffect(() => {
    if (adminLocation) {
      fetchCrimes();
    }
  }, [adminLocation, typeFilter, startDate, severityFilter]);

  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const fetchCrimes = async () => {
    if (!adminLocation) return;

    try {
      const response = await axios.get('http://8okf4vjhsldv9fnacs4gf6iano.ingress.hurricane.akash.pub/api/police_dashboard', {
        params: { 
          type: typeFilter, 
          startDate, 
          severity: severityFilter,
          latitude: adminLocation.latitude,
          longitude: adminLocation.longitude
        },
      });
      setCrimes(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSolveCase = async (id) => {
    if (window.confirm("Are you sure you want to mark this case as solved?")) {
      try {
        const solvedBy = userdata.username;
        console.log(`Solved by: ${solvedBy}`);
        await axios.put(`http://8okf4vjhsldv9fnacs4gf6iano.ingress.hurricane.akash.pub/api/solve_case/${id}`, { solvedBy });
        fetchCrimes();
      } catch (error) {
        console.error('Error solving case:', error);
      }
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const openGoogleMaps = (latitude, longitude) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  const filteredCrimes = crimes
    .filter((crime) => {
      const crimeDate = new Date(crime.timestamp);
      return (
        (!typeFilter || crime.type === typeFilter) &&
        (!startDate || crimeDate >= new Date(startDate)) &&
        (!severityFilter || crime.severity === severityFilter)
      );
    })
    .sort((a, b) => {
      if (a.type === "SOS" && b.type !== "SOS") return -1;
      if (b.type === "SOS" && a.type !== "SOS") return 1;
      
      if (sortBy) {
        if (sortOrder === 'asc') {
          return a[sortBy] > b[sortBy] ? 1 : -1;
        } else {
          return a[sortBy] < b[sortBy] ? 1 : -1;
        }
      }
      return 0;
    });

  const crimeTypes = filteredCrimes.reduce((acc, crime) => {
    acc[crime.type] = (acc[crime.type] || 0) + 1;
    return acc;
  }, {});

  const solvedCrimesCount = new Array(12).fill(0);
  solvedCrimes.forEach(crime => {
    const month = new Date(crime.timestamp).getMonth();
    solvedCrimesCount[month]++;
  });

  const unsolvedCrimesCount = new Array(12).fill(0);
  unsolvedCrimes.forEach(crime => {
    const month = new Date(crime.timestamp).getMonth();
    unsolvedCrimesCount[month]++;
  });

  console.log('Solved crimes count:', solvedCrimesCount);
  console.log('Unsolved crimes count:', unsolvedCrimesCount);

  const severityDistribution = filteredCrimes.reduce((acc, crime) => {
    acc[crime.severity] = (acc[crime.severity] || 0) + 1;
    return acc;
  }, {});

  const crimeData = {
    labels: Object.keys(crimeTypes),
    datasets: [
      {
        label: 'Number of Crimes',
        data: Object.values(crimeTypes),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const pieData = {
    labels: Object.keys(crimeTypes),
    datasets: [
      {
        label: 'Crime Distribution',
        data: Object.values(crimeTypes),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
      },
    ],
  };

  const statusOverTimeData = {
    labels: labels,
    datasets: [
      {
        label: 'Solved Crimes',
        data: solvedCrimesCount,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Unsolved Crimes',
        data: unsolvedCrimesCount,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const severityData = {
    labels: Object.keys(severityDistribution),
    datasets: [
      {
        label: 'Severity Distribution',
        data: Object.values(severityDistribution),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
      },
    ],
  };

  const downloadReports = async () => {
    try {
      const response = await axios.get('http://8okf4vjhsldv9fnacs4gf6iano.ingress.hurricane.akash.pub/api/download_crimes', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'crime_reports.xlsx');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Error downloading reports:', error);
    }
  };
  
  return (
    <div className="dashboard-container">
      <div className="buttons-container">
        <button onClick={() => setView('dashboard')}>Dashboard</button>
        <button onClick={() => setView('reported-crimes')}>Reported Crimes</button>
      </div>
      <div className="content-container">
        {view === 'dashboard' && (
          <>
            <h1>Crime Dashboard</h1>
            <div className="search-filter-wrapper">
              <Filters
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                startDate={startDate}
                setStartDate={setStartDate}
                crimeTypes={crimeTypes}
                severityFilter={severityFilter}
                setSeverityFilter={setSeverityFilter}
              />
            </div>
            <div className="stats-container">
              <div className="chart-container">
                <h2>Crime Statistics</h2>
                <div className="chart-wrapper">
                  <Bar data={crimeData} options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    }
                  }} />
                </div>
              </div>
              <div className="chart-container">
                <h2>Crime Distribution</h2>
                <div className="chart-wrapper">
                  <Pie data={pieData} options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          boxWidth: 10,
                          font: {
                            size: 10
                          }
                        }
                      }
                    }
                  }} />
                </div>
              </div>
              <div className="chart-container">
  <h2>Solved vs Unsolved Crimes Over Time</h2>
  <div className="chart-wrapper">
    <Bar 
      data={statusOverTimeData} 
      options={{ 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          }
        },
        scales: {
          x: {
            stacked: false,
          },
          y: {
            stacked: false,
            beginAtZero: true
          }
        }
      }} 
    />
  </div>
</div>
                
              <div className="chart-container">
                <h2>Crime Severity Distribution</h2>
                <div className="chart-wrapper">
                  <Pie data={severityData} options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          boxWidth: 10,
                          font: {
                            size: 10
                          }
                        }
                      }
                    }
                  }} />
                </div>
              </div>
            </div>
          </>
        )}
        {view === 'reported-crimes' && (
          <>
            <h1>Reported Crimes</h1>
            <div className="search-filter-wrapper">
              <Filters
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                startDate={startDate}
                setStartDate={setStartDate}
                crimeTypes={crimeTypes}
                severityFilter={severityFilter}
                setSeverityFilter={setSeverityFilter}
              />
            </div>
            <div className="buttons-container">
              <button onClick={downloadReports} className="download-button">Download Reports</button>
            </div>
            <div className="crime-table-container">
              <table className="crime-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('id')}>ID</th>
                    <th onClick={() => handleSort('type')}>Type</th>
                    <th onClick={() => handleSort('description')}>Description</th>
                    <th onClick={() => handleSort('timestamp')}>Timestamp</th>
                    <th onClick={() => handleSort('anonymous')}>Anonymous</th>
                    <th onClick={() => handleSort('user_info')}>User Info</th>
                    <th onClick={() => handleSort('media_url')}>Media URL</th>
                    <th onClick={() => handleSort('severity')}>Severity</th>
                    <th onClick={() => handleSort('status')}>Status</th>
                    <th onClick={() => handleSort('area')}>Area</th>
                    <th onClick={() => handleSort('solved_by')}>Solved By</th>
                    <th>Actions</th>
                    <th>Get There</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCrimes.map((crime) => (
                    <tr key={crime.id}>
                      <td>{crime.id}</td>
                      <td>{crime.type}</td>
                      <td>{crime.description}</td>
                      <td>{new Date(crime.timestamp).toLocaleString()}</td>
                      <td>{crime.anonymous ? 'Yes' : 'No'}</td>
                      <td>{crime.user_info || 'N/A'}</td>
                      <td>{crime.media_url ? <a href={crime.media_url} target="_blank" rel="noopener noreferrer">View</a> : 'N/A'}</td>
                      <td>{crime.severity}</td>
                      <td>{crime.status}</td>
                      <td>{crime.area}</td>
                      <td>{crime.solved_by || 'N/A'}</td>
                      <td>
                        {crime.status !== 'solved' && (
                          <button onClick={() => handleSolveCase(crime.id)} className="solve-button">Mark as Solved</button>
                        )}
                      </td>
                      <td>
                        {crime.latitude && crime.longitude && (
                          <button onClick={() => openGoogleMaps(crime.latitude, crime.longitude)} className="get-there-button">Get There</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;