import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Welcome } from "@/pages/Welcome";
import { AcessoPaciente } from "@/pages/AcessoPaciente";
import { PainelPaciente } from "@/pages/PainelPaciente";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/p/:token" element={<AcessoPaciente />} />
          <Route path="/p/:token/painel" element={<PainelPaciente />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
