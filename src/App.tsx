// @ts-nocheck

import { Routes, Route } from 'react-router-dom'

import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { lightTheme, darkTheme } from './styles/theme'
import { store } from './state/store'
import { Provider } from 'react-redux'
import GlobalWrapper from './wrappers/GlobalWrapper'
import DownloadWrapper from './wrappers/DownloadWrapper'
import Notification from './components/common/Notification/Notification'
import { Mail } from './pages/Mail/Mail'

function App() {
  const themeColor = window._qdnTheme

  return (
    <Provider store={store}>
      <ThemeProvider theme={darkTheme}>
        <Notification />
        <DownloadWrapper>
          <GlobalWrapper>
            <CssBaseline />

            <Routes>
              <Route path="/" element={<Mail />} />
              <Route path="/to/:name" element={<Mail isFromTo />} />
            </Routes>
          </GlobalWrapper>
        </DownloadWrapper>
      </ThemeProvider>
    </Provider>
  )
}

export default App
