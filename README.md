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

- **AI-Powered Claim Analysis**: Utilizes Groq API (Llama 3.3 70B) for intelligent claim verification
- **Interactive Dashboard**: Real-time visualization of claim trends and statistics
- **Trending Radar**: Advanced radar charts to visualize claim patterns and anomalies
- **Verification Reports**: Detailed PDF reports for claim analysis and audit trails
- **History Tracking**: Complete audit trail of all processed claims
- **Responsive Design**: Modern, mobile-friendly interface built with React and Tailwind CSS
- **Real-time Updates**: Live data processing and status updates

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4
- **Backend**: Express.js, Node.js
- **AI Integration**: Groq API (Llama 3.3 70B)
- **Charts**: Recharts for data visualization
- **PDF Generation**: jsPDF, html2canvas
- **Build Tools**: Vite, esbuild
- **Icons**: Lucide React

## 📦 Installation

### Prerequisites

- Node.js 18 or higher
- npm or bun package manager
- Groq API Key (Get free from https://console.groq.com/keys)

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
   GROQ_API_KEY=your_groq_api_key_here
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

- `GROQ_API_KEY`: Your Groq API key for AI processing (Get free from https://console.groq.com/keys)
- `PORT`: Server port (default: 3000)

## 🌐 Deployment

### Option 1: Vercel (Recommended for Frontend)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**
   ```bash
   vercel
   ```

3. **Set Environment Variables**
   - Go to your Vercel project settings
   - Add `GROQ_API_KEY` in environment variables

### Option 2: Railway (Full-Stack)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize and Deploy**
   ```bash
   railway init
   railway up
   ```

4. **Add Environment Variables**
   ```bash
   railway variables set GROQ_API_KEY=your_api_key
   railway variables set PORT=3000
   ```

### Option 3: Render (Full-Stack)

1. **Create a `render.yaml` file**
   ```yaml
   services:
     - type: web
       name: healthshield-ai
       env: node
       buildCommand: npm run build
       startCommand: npm start
       envVars:
         - key: GROQ_API_KEY
           sync: false
         - key: PORT
           value: 3000
   ```

2. **Connect your GitHub repository to Render**
3. **Deploy automatically from your main branch**

### Option 4: Docker Deployment

1. **Create a `Dockerfile`**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and run Docker container**
   ```bash
   docker build -t healthshield-ai .
   docker run -p 3000:3000 -e GROQ_API_KEY=your_key healthshield-ai
   ```

3. **Deploy to Docker Hub or any cloud provider**

### Option 5: VPS/Cloud Server

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Upload files to your server**
   ```bash
   scp -r dist user@your-server:/var/www/healthshield
   ```

3. **Install dependencies on server**
   ```bash
   cd /var/www/healthshield
   npm install --production
   ```

4. **Use PM2 to run the application**
   ```bash
   npm install -g pm2
   pm2 start dist/server.cjs --name healthshield
   pm2 startup
   pm2 save
   ```

5. **Set up Nginx reverse proxy (optional)**

### Environment Variables Setup

For all deployment methods, make sure to set:
- `GROQ_API_KEY`: Your Groq API key (Get free from https://console.groq.com/keys)
- `PORT`: The port your application will run on (default: 3000)

### Pre-Deployment Checklist

- [ ] Set all required environment variables
- [ ] Test the build locally (`npm run build`)
- [ ] Verify API keys are valid
- [ ] Check database connections (if applicable)
- [ ] Test the production build locally
- [ ] Configure domain/DNS settings
- [ ] Set up SSL/HTTPS (recommended)

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

## 👥 Author

- **Tanya Garg** 

## 🙏 Acknowledgments

- Groq for the powerful and fast AI API
- React community for the amazing frontend framework
- Recharts for the beautiful charting library

## 📞 Support

For support, please open an issue in the GitHub repository or contact the maintainers.


<div align="center">
  <p>Built with ❤️ for better healthcare claim processing</p>
</div>
