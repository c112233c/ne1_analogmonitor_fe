import { BrowserRouter, Routes, Route } from "react-router-dom";
import AnalogComparePage from "./pages/AnalogComparePage";
import AnalogDetailPage from "./pages/AnalogDetailPage";
import AnalogPage from "./pages/AnalogPage";
import NavBar from "./components/NavBar";

export default function App() {
    return (
        <BrowserRouter>
            <NavBar />

            <Routes>
                <Route path="/analog" element={<AnalogPage />} />
                <Route path="/analog/detail" element={<AnalogDetailPage />} />
                <Route path="/analog/compare" element={<AnalogComparePage />} />
                <Route path="*" element={<AnalogPage />} />
            </Routes>
        </BrowserRouter>
    );
}
