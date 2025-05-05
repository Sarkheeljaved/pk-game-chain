import { BrowserRouter, Routes, Route } from "react-router";
import FlipCardDemo from "./pages/FlipCardDemo";
function App() {
  return (
    <div style={{ width: "100%" }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<FlipCardDemo />} />
        </Routes>
      </BrowserRouter>
      {/* <Main/> */}
    </div>
  );
}

export default App;
