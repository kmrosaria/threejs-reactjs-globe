import './App.css';
import Home from './components/Home';

function App() {
  return (
    <div
      className="App"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
    >
      <Home />
    </div>
  );
}

export default App;
