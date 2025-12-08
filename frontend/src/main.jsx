import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('🚀 Starting React app...');

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Root element not found!</div>';
} else {
  console.log('✅ Root element found');
  try {
    console.log('📦 Creating root...');
    const root = createRoot(rootElement);
    console.log('🎨 Rendering App...');
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('✅ App rendered successfully');
  } catch (error) {
    console.error('❌ Error rendering app:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; background: #fee; border: 2px solid #f00; margin: 20px;">
        <h1 style="color: #c00;">Error loading application</h1>
        <p><strong>Error:</strong> ${error.message}</p>
        <pre style="background: #fff; padding: 10px; overflow: auto;">${error.stack}</pre>
      </div>
    `;
  }
}
