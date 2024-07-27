import "./App.css";
import React from "react";
import Scene from "./Scence";

const App = () => {
  return (
    <div className="App">
      <header className="App-header">
        <div id="canvas-container">
          <Scene />
        </div>
      </header>
    </div>
  );
};

export default App;
