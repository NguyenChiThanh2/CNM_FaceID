// src/components/Loading.jsx
import React from 'react';
import '../css/style.css';

const Loading = ({ message = "Đang tải dữ liệu..." }) => {
  return (
    <div 
      className="loading-container d-flex justify-content-center align-items-center vh-100"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}
    >
      <div className="text-center">
        {/* Animated Gradient Spinner */}
        <div className="gradient-spinner">
          <div className="spinner-ring spinner-ring-1"></div>
          <div className="spinner-ring spinner-ring-2"></div>
          <div className="spinner-ring spinner-ring-3"></div>
          <div className="spinner-center"></div>
        </div>
        
        {/* Loading Text */}
        <div className="loading-content mt-4">
          <h4 
            className="loading-text mb-3 fw-bold"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
          >
            {message}
          </h4>
          
          {/* Pulsing Dots */}
          <div className="pulsing-dots">
            <span className="dot dot-1"></span>
            <span className="dot dot-2"></span>
            <span className="dot dot-3"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;