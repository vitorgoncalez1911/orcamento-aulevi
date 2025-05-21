// PWA Frontend com interface conversacional estilo chat (modo rápido de orçamento)
<img src="/logo-aulevi.png" alt="Logo Aulevi" className="w-48 mb-4" />

import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function carregarImagemBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

const steps = [
  { id: "tipo", question: "Qual o tipo de obra?", options: ["Casa 1 pav", "Casa 2 pav", "Galpão", "Galpão + escritório"] },
  { id: "area", question: "Qual a metragem quadrada da construção?" },
  { id: "padrao", question: "Qual o padrão construtivo?", options: ["Popular", "Médio", "Alto", "Não se aplica"] },
  { id: "fachada", question: "Fachada diferenciada?", options: ["Sim", "Não"] },
  { id: "projeto", question: "Projeto estrutural incluso?", options: ["Sim", "Não"] },
];

export default function ChatOrcamento() {
  const [respostas, setRespostas] = useState({});
  const [passo, setPasso] = useState(0);
  const [input, setInput] = useState("");
  const [concluido, setConcluido] = useState(false);
  const [mensagens, setMensagens] = useState([
    { autor: "bot", texto: steps[0].question }
  ]);
  const [pdfData, setPdfData] = useState(null);
  const inputRef = useRef(null);
  useEffect(() => {
    if (steps[passo] && !steps[passo].options && inputRef.current) {
      inputRef.current.focus();
    }
  }, [passo]);
  const formatarMoeda = (valor) =>
    valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleResposta = (resposta) => {
    const chave = steps[passo].id;
    const novasRespostas = { ...respostas, [chave]: resposta };
    setMensagens([...mensagens, { autor: "user", texto: resposta }]);

    if (passo + 1 < steps.length) {
      setTimeout(() => {
        setMensagens(prev => [...prev, { autor: "bot", texto: steps[passo + 1].question }]);
      }, 300);
      setRespostas(novasRespostas);
      setPasso(passo + 1);
    } else {
      setRespostas(novasRespostas);
      setConcluido(true);
      gerarOrcamento(novasRespostas);
    }
    setInput("");
  };

  const reiniciar = () => {
    setRespostas({});
    setPasso(0);
    setInput("");
    setConcluido(false);
    setMensagens([{ autor: "bot", texto: steps[0].question }]);
  };

  const gerarOrcamento = async (dados) => {
      try {
        // Carrega a logo
        const logoBase64 = await carregarImagemBase64("/logo-aulevi.png");

        // Gerar número sequencial com base no localStorage
        const ultimo = localStorage.getItem("aulevidoc_last") || 0;
        const novo = Number(ultimo) + 1;
        localStorage.setItem("aulevidoc_last", novo);
        const codigoOrcamento = `OF${String(novo).padStart(3, "0")}`;
        
        // Data atual formatada
        const dataAtual = new Date().toLocaleDateString("pt-BR");
    

      const fatores_tipo = {
        "Casa 1 pav": 26.5,
        "Casa 2 pav": 34.5,
        "Galpão": 18.0,
        "Galpão + escritório": 25.0
      };
      const fatores_padrao_perfil = {
        "Popular": 0.0,
        "Médio": 1.5,
        "Alto": 3.0,
        "Não se aplica": 0.0
      };
      const fatores_fachada = {
        "Sim": 2.5,
        "Não": 0.0
      };
      const fatores_parafuso_extra = {
        "Popular": 0.0,
        "Médio": 5.75,
        "Alto": 11.5,
        "Não se aplica": 0.0
      };
      const fatores_parabolt = {
        "Casa 1 pav": 0.90,
        "Casa 2 pav": 0.45,
        "Galpão": 0.45,
        "Galpão + escritório": 0.60
      };
      const fatores_manta = {
        "Casa 1 pav": 0.70,
        "Casa 2 pav": 0.35,
        "Galpão": 0.35,
        "Galpão + escritório": 0.50
      };

      const area = parseFloat(dados.area);
      const perfil = Math.round((fatores_tipo[dados.tipo] + fatores_padrao_perfil[dados.padrao] + fatores_fachada[dados.fachada]) * area);
      const parafuso = Math.round(((75 + fatores_parafuso_extra[dados.padrao]) * area) / 500) * 500;
      const parabolt = Math.ceil(fatores_parabolt[dados.tipo] * area);
      const manta = Math.round(fatores_manta[dados.tipo] * area / 10) * 10;
      const projeto_valor = dados.projeto === "Não" ? 0 : Math.max(2000, Math.round(area * 30));

      let ancorador = 60;
      if (area <= 30) ancorador = 8;
      else if (area <= 60) ancorador = 16;
      else if (area <= 150) ancorador = 24;
      else if (area <= 250) ancorador = 36;
      else if (area <= 350) ancorador = 45;

      const precos = {
        "L095089E275": 13.00,
        "APAR4.8X019BRPH": 0.25,
        "APBO1/2X4": 4.30,
        "AMAN20CM10M": 69.79,
        "AANC189X49X5/16": 27.00,
        "PROJ": projeto_valor
      };

      const itens = [
        { codigo: "L095089E275", descricao: "LSF 0,95X89 ZAR230Z275", un: "kg", qtd: perfil },
        { codigo: "APAR4.8X019BRPH", descricao: "Parafuso 4.8x19", un: "un", qtd: parafuso },
        { codigo: "APBO1/2X4", descricao: "Parabolt 1/2 x 4", un: "un", qtd: parabolt },
        { codigo: "AMAN20CM10M", descricao: "Manta asfáltica", un: "m", qtd: manta },
        { codigo: "AANC189X49X5/16", descricao: "Ancorador 3 mm", un: "un", qtd: ancorador },
        { codigo: "PROJ", descricao: "Projeto estrutural", un: "R$", qtd: 1 }
      ];

      const total_produtos = itens.reduce((acc, item) => acc + item.qtd * precos[item.codigo], 0);
      const valor_m2 = total_produtos / area;

      const pdfRows = itens.map(item => ([
        item.codigo,
        item.un,
        item.qtd,
        formatarMoeda(precos[item.codigo]),
        formatarMoeda(item.qtd * precos[item.codigo])
      ]));

      const doc = new jsPDF();
doc.addImage(logoBase64, "PNG", 14, 10, 40, 12);
doc.setFontSize(16);
doc.setTextColor(40);
doc.text("ORÇAMENTO ESTIMATIVO LSF", 63, 18); // ao lado da logo
doc.setDrawColor(100);
doc.setFontSize(12);
doc.setFont("helvetica", "bold");
doc.line(14, 26, 196, 26); // linha superior
doc.text(`Orçamento Nº ${codigoOrcamento}`, 14, 32);
doc.text(`Data: ${dataAtual}`, 196, 32, { align: "right" });
doc.line(14, 35, 196, 35); // linha inferior

      autoTable(doc, {
        head: [["Código", "Unidade", "Qtd", "R$ Unitário", "R$ Total"]],
        body: pdfRows,
        startY: 50
      });
      doc.text(`Total: ${formatarMoeda(total_produtos)}`, 14, doc.lastAutoTable.finalY + 10);
      doc.text(`Valor por m²: ${formatarMoeda(valor_m2)}`, 14, doc.lastAutoTable.finalY + 20);

      let y = doc.lastAutoTable.finalY + 35;
doc.setFont("helvetica", "bold");
doc.line(14, 129, 196, 129); // linha acima do resumo das informações fornecidas
doc.line(14, 185, 196, 185); // linha abaixo do resumo das informações fornecidas
doc.text("Resumo das informações fornecidas:", 14, y);
doc.setFont("helvetica", "normal");
y += 8;
doc.text(`• Tipo da obra: ${dados.tipo}`, 14, y);
y += 7;
doc.text(`• Área: ${dados.area} m²`, 14, y);
y += 7;
doc.text(`• Padrão construtivo: ${dados.padrao}`, 14, y);
y += 7;
doc.text(`• Fachada diferenciada: ${dados.fachada}`, 14, y);
y += 7;
doc.text(`• Projeto estrutural incluso: ${dados.projeto}`, 14, y);

      // Rodapé com aviso
const paginaAltura = doc.internal.pageSize.height;
doc.setFontSize(9);
doc.setTextColor(120);
doc.text(
  "Este orçamento é uma simulação estimativa e os valores apresentados são referenciais. Consulte um representante para validação.",
  14,
  paginaAltura - 10
);

      
      setPdfData(doc);

      setMensagens(prev => [
        ...prev,
        {
          autor: "bot",
          html: (
            <>
              <p className="font-semibold mt-4">Orçamento gerado com sucesso.</p>
              <p>Total da obra: <strong>{formatarMoeda(total_produtos)}</strong></p>
              <p>Valor por m²: <strong>{formatarMoeda(valor_m2)}</strong></p>
              <button className="mt-2 bg-blue-500 text-white px-4 py-2 rounded" onClick={() => doc.save(`orcamento-aulevi-${codigoOrcamento}.pdf`)}>
                📄 Baixar PDF
              </button>
            </>
          )
        },
        { autor: "bot", texto: "Deseja fazer um novo orçamento?" }
      ]);
    } catch (err) {
      console.error("Erro ao calcular orçamento:", err);
      setMensagens(prev => [...prev, { autor: "bot", texto: `Erro ao gerar o orçamento: ${err.message}` }]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-xl shadow-md border border-gray-200 font-sans">
      <div className="flex items-center justify-start mb-6 space-x-32">
  <img src="/logo-aulevi.png" alt="Logo Aulevi" className="w-32" />
  <h1 className="text-2xl font-semibold text-gray-700">SIMULADOR LSF</h1>
</div>
      <div className="h-[70vh] overflow-y-auto p-4 space-y-4">
        {mensagens.map((msg, i) => (
          <div key={i} className={`text-sm mb-2 ${msg.autor === "bot" ? "text-left" : "text-right"}`}>
            {msg.html ? (
              <div className="overflow-auto">{msg.html}</div>
            ) : (
              <span className={`inline-block px-3 py-2 rounded-xl ${msg.autor === "bot" ? "bg-gray-200" : "bg-orange-500 text-white"}`}>
                {msg.texto}
              </span>
            )}
          </div>
        ))}
      </div>

      {!concluido && (
        <div className="mt-4 flex items-center space-x-2 flex-wrap gap-2">
          {steps[passo].options ? (
            steps[passo].options.map((opt, i) => (
              <button key={i} onClick={() => handleResposta(opt)} className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded shadow">
                {opt}
              </button>
            ))
          ) : (
            <>
              <input
  ref={inputRef}
  value={input}
  onChange={(e) => setInput(e.target.value)}
  placeholder="Digite sua resposta"
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      handleResposta(input);
    }
  }}
  className="flex-1 border px-3 py-2 rounded"
/>
              <button
                onClick={() => handleResposta(input)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded shadow"
              >
                Enviar
              </button>
            </>
          )}
        </div>
      )}

      {concluido && (
        <div className="mt-4 text-center">
          <p className="text-green-600 font-semibold mb-2">🎉 Orçamento gerado com sucesso!</p>
          <button onClick={reiniciar} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded shadow">
            Fazer novo orçamento
          </button>
        </div>
      )}
    </div>
  );
}
