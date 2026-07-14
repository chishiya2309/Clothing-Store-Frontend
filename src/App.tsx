import Router from '@/router'
import NetworkStatusBridge from './components/NetworkStatusBridge'

export default function App() {
  return (
    <>
      <NetworkStatusBridge />
      <Router />
    </>
  )
}
