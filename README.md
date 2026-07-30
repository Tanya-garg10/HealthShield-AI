<div align="center">
  <h1>🛡️ HealthShield AI</h1>
  <p>AI-Powered Health Insurance Claim Verification System</p>
  
  ![License](https://img.shields.io/badge/license-MIT-blue.svg)
  ![React](https://img.shields.io/badge/React-19.0.1-61DAFB)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6)
  ![Node](https://img.shields.io/badge/Node.js-18+-green)
</div>

## 📋 Overview

HealthShield AI is an intelligent health insurance claim verification system that leverages artificial intelligence to analyze, validate, and process insurance claims efficiently. The system provides real-time insights, trend analysis, and comprehensive verification reports to streamline the claims processing workflow.

## ✨ Features

- **AI-Powered Claim Analysis**: Utilizes Google Gemini AI for intelligent claim verification
- **Interactive Dashboard**: Real-time visualization of claim trends and statistics
- **Trending Radar**: Advanced radar charts to visualize claim patterns and anomalies
- **Verification Reports**: Detailed PDF reports for claim analysis and audit trails
- **History Tracking**: Complete audit trail of all processed claims
- **Responsive Design**: Modern, mobile-friendly interface built with React and Tailwind CSS
- **Real-time Updates**: Live data processing and status updates

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4
- **Backend**: Express.js, Node.js
- **AI Integration**: Google Gemini AI SDK
- **Charts**: Recharts for data visualization
- **PDF Generation**: jsPDF, html2canvas
- **Build Tools**: Vite, esbuild
- **Icons**: Lucide React

## 📦 Installation

### Prerequisites

- Node.js 18 or higher
- npm or bun package manager
- Google Gemini API Key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Tanya-garg10/HealthShield-AI.git
   cd HealthShield-AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🛠️ Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm start` - Start the production server
- `npm run lint` - Run TypeScript type checking
- `npm run clean` - Clean build artifacts

## 📁 Project Structure

```
healthshield/
├── src/
│   ├── components/       # React components
│   │   ├── ClaimTrendChart.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── HistoryDrawer.tsx
│   │   ├── InputPanel.tsx
│   │   ├── TrendingRadar.tsx
│   │   └── VerificationReportCard.tsx
│   ├── data/            # Sample data and mocks
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   └── types.ts         # TypeScript type definitions
├── server.ts            # Express server setup
├── package.json         # Project dependencies
└── tsconfig.json        # TypeScript configuration
```

## 🔧 Configuration

### Environment Variables

- `GEMINI_API_KEY`: Your Google Gemini API key for AI processing
- `PORT`: Server port (default: 3000)

## 📊 Features in Detail

### Claim Analysis
- Automatic verification of health insurance claims
- AI-powered fraud detection
- Pattern recognition and anomaly detection

### Data Visualization
- Interactive trend charts for claim analysis
- Radar charts for multi-dimensional data representation
- Real-time dashboard updates

### Reporting
- Generate comprehensive PDF reports
- Export verification summaries
- Audit trail for compliance

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Tanya Garg** - Initial work

## 🙏 Acknowledgments

- Google Gemini AI for the powerful AI capabilities
- React community for the amazing frontend framework
- Recharts for the beautiful charting library

## 📞 Support

For support, please open an issue in the GitHub repository or contact the maintainers.

---

<div align="center">
  <p>Built with ❤️ for better healthcare claim processing</p>
</div>
