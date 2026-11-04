import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './theme.css'
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import App from './App.jsx'
import './styles/modulos.css'
import './accessibility.css'
//**Unicamente se importa el archivo index.css para aplicar estilos globales a la aplicación. 
// Los demás archivos CSS importados son parte de la biblioteca PrimeReact, que proporciona 
// componentes y estilos predefinidos para construir interfaces de usuario en React. */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
