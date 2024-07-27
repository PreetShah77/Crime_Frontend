import React, { useEffect, useState} from "react";
import "./styles/App.css";

function App() {
  const [solvedCount, setSolvedCount] = useState(0);
  const [unsolvedCount, setUnsolvedCount] = useState(0);

  useEffect(() => {
    fetch('http://8okf4vjhsldv9fnacs4gf6iano.ingress.hurricane.akash.pub/api/reports')
      .then(response => response.json())
      .then(data => {
        const solved = data.filter(report => report.status === 'solved').length;
        const unsolved = data.filter(report => report.status === 'active').length;
        animateCounter(setSolvedCount, solved);
        animateCounter(setUnsolvedCount, unsolved);
      })
      .catch(error => console.error('Error fetching reports:', error));
  }, []);

  const animateCounter = (setter, target) => {
    let count = 0;
    const step = target / 100; // Adjust the step value to control the speed

    const updateCounter = () => {
      count += step;
      if (count < target) {
        setter(Math.ceil(count));
        requestAnimationFrame(updateCounter);
      } else {
        setter(target);
      }
    };

    requestAnimationFrame(updateCounter);
  };
  return (
    <div className="app">
      {/* <video autoPlay loop muted className="background-video">
        <source src="/india.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video> */}
      <div className="video-overlay"></div>
      <div className="content">
        <h1>Crime Watch</h1>
        <p>
          An app to help citizens report crimes promptly and accurately. 
          It provides real-time updates on crime incidents, secure authentication for users, 
          interactive maps for visualizing crime hotspots, and powerful search tools for efficient data retrieval.
        </p>
        <div className="counters">
        <div className="counter">
            <span className="counter-number" id="unsolvedCounter">{unsolvedCount}</span>
            <span className="counter-label">Cases Unsolved</span>
          </div>
          <div className="counter">
            <span className="counter-number" id="solvedCounter">{solvedCount}</span>
            <span className="counter-label">Cases Solved</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;