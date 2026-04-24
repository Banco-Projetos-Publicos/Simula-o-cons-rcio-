/**
 * ============================================================
 *  SIMULADOR DE ARBITRAGEM: CONSÓRCIO vs. FINANCIAMENTO BANCÁRIO
 *  Motor Quant — Cálculo do ágio ótimo de cota contemplada
 * ============================================================
 */
import { useState, useEffect, useCallback } from "react";

// ── Formatadores ──────────────────────────────────────────────
const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(v ?? 0);

// ── Motor Matemático ─────────────────────────────────────────

/** Tabela Price — trata taxa zero para evitar divisão por zero */
function calcPrestacaoBanco(pv, i, n) {
  if (n <= 0) return 0;
  if (i === 0) return pv / n;   // caso degenerado: juros zero
  const fator = Math.pow(1 + i, n);
  return pv * (i * fator) / (fator - 1);
}

/** Executa os 5 passos na ordem exata especificada na arquitetura */
function calcularArbitragem(inp) {
  const { valorBem, taxaBancoMes, prazoBanco, capitalInvestido,
          parcelasRestantes, valorParcelaConsorcio, taxaTransferencia, margemSeguranca } = inp;

  // Passo 1 — Custo Bancário
  const prestacaoBanco = calcPrestacaoBanco(valorBem, taxaBancoMes, prazoBanco);
  const custoTotalBanco = prestacaoBanco * prazoBanco;

  // Passo 2 — Saldo Devedor
  const saldoDevedor = parcelasRestantes * valorParcelaConsorcio;

  // Passo 3 — Spread Bruto
  const spreadBruto = custoTotalBanco - saldoDevedor;

  // Passo 4 — Precificação do Ágio
  const vantagemComprador    = spreadBruto * margemSeguranca;
  const tetoDesembolso       = custoTotalBanco - vantagemComprador;
  const valorVendaCota       = tetoDesembolso - saldoDevedor;
  const agioBruto            = valorVendaCota - capitalInvestido;

  // Passo 5 — Impostos e Lucro Líquido
  const impostoRenda  = agioBruto > 0 ? agioBruto * 0.15 : 0;
  const lucroLiquido  = agioBruto - taxaTransferencia - impostoRenda;

  const roiPct          = capitalInvestido > 0 ? (lucroLiquido / capitalInvestido) * 100 : 0;
  const agioPctCarta    = valorBem > 0 ? (valorVendaCota / valorBem) * 100 : 0;
  const margemLiquida   = valorVendaCota > 0 ? (lucroLiquido / valorVendaCota) * 100 : 0;

  return { prestacaoBanco, custoTotalBanco, saldoDevedor, spreadBruto, vantagemComprador,
           tetoDesembolso, valorVendaCota, agioBruto, impostoRenda, lucroLiquido,
           roiPct, agioPctCarta, margemLiquida, isLucro: lucroLiquido > 0 };
}

// ── Sub-componentes ───────────────────────────────────────────

function NumInput({ label, value, onChange, prefix, suffix, step = "0.01", min = "0", hint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.28rem", marginBottom: "0.1rem" }}>
      <label style={{ fontSize: "0.74rem", color: "#7a9ab8", fontWeight: 500 }}>{label}</label>
      {hint && <span style={{ fontSize: "0.64rem", color: "#3d5a70" }}>{hint}</span>}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {prefix && <span style={{ position:"absolute", left:"0.7rem", fontSize:"0.78rem", color:"#3d6080", fontFamily:"monospace", pointerEvents:"none" }}>{prefix}</span>}
        <input type="number" value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step} min={min}
          style={{ width:"100%", boxSizing:"border-box", background:"#0c1624", border:"1px solid #1a2a3e", borderRadius:"6px",
                   color:"#c0d0e8", fontSize:"0.88rem", fontFamily:"'Courier New',monospace",
                   padding:`0.5rem ${suffix?"2.8rem":"0.8rem"} 0.5rem ${prefix?"2.4rem":"0.8rem"}`,
                   outline:"none" }} />
        {suffix && <span style={{ position:"absolute", right:"0.7rem", fontSize:"0.78rem", color:"#3d6080", fontFamily:"monospace", pointerEvents:"none" }}>{suffix}</span>}
      </div>
    </div>
  );
}

function KpiCard({ title, value, sub, accent, large }) {
  return (
    <div style={{ background:"#0b1523", border:`1px solid ${accent}40`, borderRadius:"9px", padding:"0.9rem 1rem" }}>
      <div style={{ fontSize:"0.62rem", color:"#4a6a88", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:"0.4rem" }}>{title}</div>
      <div style={{ fontFamily:"'Courier New',monospace", fontSize: large?"1.55rem":"1.15rem", fontWeight:700, color: accent, letterSpacing:"-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize:"0.64rem", color:"#3a5878", marginTop:"0.25rem", fontFamily:"monospace" }}>{sub}</div>}
    </div>
  );
}

function FluxoRow({ label, value, positive, bold }) {
  const color = bold ? "#dce8f8" : positive ? "#00d496" : "#ff6070";
  const sign  = bold ? "" : positive ? "+" : "−";
  return (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"0.45rem 0",
                  borderBottom: bold ? "none" : "1px solid #0f1a28" }}>
      <span style={{ fontSize:"0.78rem", color: bold ? "#9ab0cc" : "#5a7a98" }}>{label}</span>
      <span style={{ fontFamily:"'Courier New',monospace", fontSize: bold?"1.25rem":"0.82rem",
                     fontWeight: bold?700:600, color }}>{sign} {fmt(Math.abs(value))}</span>
    </div>
  );
}

// ── App Principal ─────────────────────────────────────────────
export default function App() {
  const [valorBem,              setValorBem]              = useState(100000);
  const [taxaBancoMesPct,       setTaxaBancoMesPct]       = useState(1.8);
  const [prazoBanco,            setPrazoBanco]            = useState(60);
  const [capitalInvestido,      setCapitalInvestido]      = useState(25000);
  const [parcelasRestantes,     setParcelasRestantes]     = useState(48);
  const [valorParcelaConsorcio, setValorParcelaConsorcio] = useState(1200);
  const [taxaTransferencia,     setTaxaTransferencia]     = useState(800);
  const [margemSegurancaPct,    setMargemSegurancaPct]    = useState(20);
  const [r, setR] = useState(null);

  const recalc = useCallback(() => {
    setR(calcularArbitragem({
      valorBem, taxaBancoMes: taxaBancoMesPct / 100, prazoBanco,
      capitalInvestido, parcelasRestantes, valorParcelaConsorcio,
      taxaTransferencia, margemSeguranca: margemSegurancaPct / 100,
    }));
  }, [valorBem, taxaBancoMesPct, prazoBanco, capitalInvestido,
      parcelasRestantes, valorParcelaConsorcio, taxaTransferencia, margemSegurancaPct]);

  useEffect(() => { recalc(); }, [recalc]);

  const accent   = r?.isLucro ? "#00e5a0" : "#ff5c6e";
  const bgAccent = r?.isLucro ? "rgba(0,229,160,0.07)" : "rgba(255,92,110,0.07)";

  const sectionTitle = (n, txt) => (
    <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", margin:"0.8rem 0 0.6rem" }}>
      <span style={{ background:"#122030", border:"1px solid #1e3d5a", color:"#4fc3f7", fontFamily:"monospace",
                     fontSize:"0.7rem", fontWeight:700, width:"1.5rem", height:"1.5rem", borderRadius:"4px",
                     display:"flex", alignItems:"center", justifyContent:"center" }}>{n}</span>
      <span style={{ fontSize:"0.7rem", fontWeight:600, color:"#5a849c", letterSpacing:"0.06em", textTransform:"uppercase" }}>{txt}</span>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Segoe UI',sans-serif", background:"#080f1c", minHeight:"100vh", color:"#c0d0e8" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"1.1rem 1.5rem",
                    borderBottom:"1px solid #152030", background:"#0a1220" }}>
        <span style={{ background:"#00e5a0", color:"#000", fontFamily:"monospace", fontWeight:700,
                       fontSize:"0.62rem", letterSpacing:"0.1em", padding:"0.25rem 0.55rem", borderRadius:"3px" }}>QUANT</span>
        <div>
          <div style={{ fontSize:"1.15rem", fontWeight:600, color:"#e0ecff", letterSpacing:"-0.01em" }}>
            Simulador de Arbitragem
          </div>
          <div style={{ fontSize:"0.7rem", color:"#3d6080", letterSpacing:"0.04em" }}>
            Consórcio Contemplado &nbsp;↔&nbsp; Financiamento Bancário · Cálculo do Ágio Ótimo
          </div>
        </div>
        <div style={{ marginLeft:"auto", fontFamily:"monospace", fontSize:"0.62rem", color:"#4fc3f7",
                      border:"1px solid #1a3a58", padding:"0.25rem 0.65rem", borderRadius:"3px", letterSpacing:"0.12em" }}>
          MOTOR MATEMÁTICO v1.0
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"360px 1fr", gap:"1.2rem", padding:"1.2rem 1.5rem", alignItems:"start" }}>

        {/* ══ PAINEL INPUTS ══ */}
        <div style={{ background:"#0b1523", border:"1px solid #162535", borderRadius:"10px", padding:"1.3rem" }}>

          {sectionTitle("A", "Dados do Mercado — O Banco")}
          <NumInput label="Valor do Bem / Carta de Crédito" value={valorBem} onChange={setValorBem} prefix="R$" step="1000" />
          <div style={{height:"0.5rem"}}/>
          <NumInput label="Taxa do Banco (CET % a.m.)" value={taxaBancoMesPct} onChange={setTaxaBancoMesPct} suffix="%" step="0.01" hint="Custo Efetivo Total ao mês" />
          <div style={{height:"0.5rem"}}/>
          <NumInput label="Prazo do Financiamento Bancário" value={prazoBanco} onChange={setPrazoBanco} suffix="meses" step="1" min="1" />

          <div style={{ height:"1px", background:"linear-gradient(90deg,transparent,#1a2d40,transparent)", margin:"1rem 0" }}/>

          {sectionTitle("B", "Dados da Operação — O Consórcio")}
          <NumInput label="Capital Investido (lance + parcelas pagas)" value={capitalInvestido} onChange={setCapitalInvestido} prefix="R$" step="500" hint="Custo total de aquisição da cota" />
          <div style={{height:"0.5rem"}}/>
          <NumInput label="Parcelas Restantes no Consórcio" value={parcelasRestantes} onChange={setParcelasRestantes} suffix="parcelas" step="1" min="0" />
          <div style={{height:"0.5rem"}}/>
          <NumInput label="Valor da Parcela Atual do Consórcio" value={valorParcelaConsorcio} onChange={setValorParcelaConsorcio} prefix="R$" step="10" />
          <div style={{height:"0.5rem"}}/>
          <NumInput label="Taxa de Transferência da Administradora" value={taxaTransferencia} onChange={setTaxaTransferencia} prefix="R$" step="100" />

          <div style={{ height:"1px", background:"linear-gradient(90deg,transparent,#1a2d40,transparent)", margin:"1rem 0" }}/>

          {sectionTitle("C", "Estratégia de Preço")}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <label style={{ fontSize:"0.74rem", color:"#7a9ab8" }}>Margem de Segurança / Desconto ao Comprador</label>
            <span style={{ background:"#0d1e30", border:"1px solid #4fc3f7", color:"#4fc3f7", fontFamily:"monospace",
                           fontSize:"0.82rem", fontWeight:700, padding:"0.15rem 0.5rem", borderRadius:"4px" }}>
              {margemSegurancaPct}%
            </span>
          </div>
          <p style={{ fontSize:"0.64rem", color:"#3a5878", margin:"0.3rem 0 0.4rem" }}>
            Quanto mais barato que o banco — garante venda rápida. Menor = mais lucro; Maior = venda mais fácil.
          </p>
          <input type="range" min="1" max="50" step="1" value={margemSegurancaPct}
            onChange={(e) => setMargemSegurancaPct(parseInt(e.target.value))}
            style={{ width:"100%", accentColor:"#4fc3f7", cursor:"pointer", margin:"0.2rem 0" }} />
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.6rem", color:"#2a4a60" }}>
            <span>1% — Máximo Lucro</span><span>50% — Venda Garantida</span>
          </div>

          {/* Breakdown interno */}
          {r && (
            <div style={{ marginTop:"1rem", background:"#060d18", border:"1px solid #0f1e2e", borderRadius:"7px", padding:"0.9rem" }}>
              <div style={{ fontFamily:"monospace", fontSize:"0.62rem", color:"#2a5a78", letterSpacing:"0.08em", marginBottom:"0.6rem" }}>
                ▸ BREAKDOWN DO MOTOR — PASSOS 1 A 5
              </div>
              {[
                ["Prestação Banco (Price)", fmt(r.prestacaoBanco)+"/mês", "#8a9ab5"],
                ["Custo Total Banco",        fmt(r.custoTotalBanco),       "#4fc3f7"],
                ["Saldo Devedor Consórcio",  fmt(r.saldoDevedor),          "#ffb74d"],
                ["Spread Bruto",             fmt(r.spreadBruto),           "#8a9ab5"],
                ["Vantagem do Comprador",    fmt(r.vantagemComprador),     "#4fc3f7"],
                ["Ágio Bruto",               fmt(r.agioBruto),             r.agioBruto >= 0 ? "#00e5a0" : "#ff5c6e"],
                ["IR 15% s/ Ganho Capital",  fmt(r.impostoRenda),          "#ffb74d"],
              ].map(([lbl, val, clr]) => (
                <div key={lbl} style={{ display:"flex", justifyContent:"space-between", padding:"0.22rem 0",
                                        borderBottom:"1px solid #0c1828", fontSize:"0.72rem" }}>
                  <span style={{ color:"#4a6888" }}>{lbl}</span>
                  <span style={{ fontFamily:"monospace", color: clr }}>{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══ PAINEL RESULTADOS ══ */}
        {r && (
          <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>

            {/* Alerta visual */}
            <div style={{ display:"flex", alignItems:"center", gap:"0.8rem", padding:"0.85rem 1.2rem",
                          background: bgAccent, border:`1px solid ${accent}`, borderRadius:"8px" }}>
              <span style={{ fontSize:"1.1rem", color: accent }}>{r.isLucro ? "▲" : "▼"}</span>
              <span style={{ fontFamily:"monospace", fontSize:"0.82rem", fontWeight:700, color: accent, letterSpacing:"0.08em" }}>
                {r.isLucro ? "OPERAÇÃO LUCRATIVA" : "OPERAÇÃO DEFICITÁRIA"}
              </span>
              {r.isLucro && (
                <span style={{ marginLeft:"auto", background:"rgba(0,229,160,0.12)", color:"#00e5a0",
                               fontFamily:"monospace", fontSize:"0.72rem", fontWeight:700,
                               padding:"0.2rem 0.6rem", borderRadius:"4px", border:"1px solid rgba(0,229,160,0.25)" }}>
                  ROI {r.roiPct.toFixed(1)}%
                </span>
              )}
            </div>

            {/* 3 KPIs */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.8rem" }}>
              <KpiCard title="Custo Total no Banco"   value={fmt(r.custoTotalBanco)} sub={`${prazoBanco}× ${fmt(r.prestacaoBanco)}/mês`} accent="#4fc3f7" />
              <KpiCard title="Saldo do Consórcio"     value={fmt(r.saldoDevedor)}    sub={`${parcelasRestantes}× ${fmt(valorParcelaConsorcio)}/mês`} accent="#ffb74d" />
              <KpiCard title="Lucro Líquido Final"    value={fmt(r.lucroLiquido)}    sub={r.isLucro ? `↑ ${r.roiPct.toFixed(1)}% s/ capital` : "Operação no negativo"} accent={accent} large />
            </div>

            {/* Preço de venda destaque */}
            <div style={{ background:"linear-gradient(135deg,#0c1a30,#0f2040)", border:"1px solid #1a3a60",
                          borderRadius:"10px", padding:"1.5rem", textAlign:"center" }}>
              <div style={{ fontSize:"0.72rem", color:"#5a84a0", letterSpacing:"0.06em", marginBottom:"0.5rem" }}>
                💰 VALOR DE VENDA DA COTA — ÁGIO / À VISTA
              </div>
              <div style={{ fontFamily:"'Courier New',monospace", fontSize:"2.1rem", fontWeight:700,
                            color:"#e0f0ff", letterSpacing:"-0.03em" }}>
                {fmt(r.valorVendaCota)}
              </div>
              <div style={{ fontSize:"0.71rem", color:"#00c896", marginTop:"0.45rem" }}>
                O comprador economiza {fmt(r.vantagemComprador)} em relação ao banco
              </div>
            </div>

            {/* Fluxo de Caixa */}
            <div style={{ background:"#0b1523", border:"1px solid #162535", borderRadius:"10px", padding:"1.3rem 1.5rem" }}>
              <div style={{ fontFamily:"monospace", fontSize:"0.67rem", color:"#3a6888", letterSpacing:"0.1em",
                            textTransform:"uppercase", marginBottom:"0.8rem" }}>≡ Fluxo de Caixa da Venda</div>
              <FluxoRow label="(+) Valor cobrado à vista do comprador"                 value={r.valorVendaCota}    positive />
              <FluxoRow label="(−) Capital original investido"                         value={capitalInvestido}    positive={false} />
              <FluxoRow label="(−) Taxa de transferência da administradora"            value={taxaTransferencia}   positive={false} />
              <FluxoRow label="(−) Provisão IR — Ganho de Capital (15% via DARF)"     value={r.impostoRenda}      positive={false} />
              <div style={{ height:"2px", background:"linear-gradient(90deg,#1a2d40,#2a4a60,#1a2d40)", margin:"0.7rem 0" }}/>
              <FluxoRow label="RESULTADO LÍQUIDO DA OPERAÇÃO" value={r.lucroLiquido} bold />
            </div>

            {/* Análise Comparativa */}
            <div style={{ background:"#0b1523", border:"1px solid #162535", borderRadius:"10px", padding:"1.3rem 1.5rem" }}>
              <div style={{ fontFamily:"monospace", fontSize:"0.67rem", color:"#3a6888", letterSpacing:"0.1em",
                            textTransform:"uppercase", marginBottom:"0.8rem" }}>◈ Análise Comparativa</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"0.8rem" }}>
                {[
                  { label:"Economia do Comprador",  value: `${fmt(r.vantagemComprador)}`,           color:"#00e5a0", sub:"vs. banco" },
                  { label:"Spread Bruto Disponível", value: `${fmt(r.spreadBruto)}`,                color:"#4fc3f7", sub:"banco vs. consórcio" },
                  { label:"Ágio s/ Carta de Crédito",value: `${r.agioPctCarta.toFixed(1)}%`,        color:"#ffb74d", sub:"do valor de face" },
                  { label:"Margem Líquida",          value: `${r.margemLiquida.toFixed(1)}%`,       color: accent,   sub:"lucro / cobrado" },
                ].map(({ label, value, color, sub }) => (
                  <div key={label} style={{ background:"#070e1c", borderRadius:"7px", padding:"0.85rem", textAlign:"center", border:"1px solid #101e2e" }}>
                    <div style={{ fontSize:"0.6rem", color:"#3a5870", textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:"0.4rem" }}>{label}</div>
                    <div style={{ fontFamily:"monospace", fontSize:"0.95rem", fontWeight:700, color }}>{value}</div>
                    <div style={{ fontSize:"0.6rem", color:"#2a4860", marginTop:"0.2rem" }}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <p style={{ fontSize:"0.64rem", color:"#2e4a60", lineHeight:"1.5", borderTop:"1px solid #0f1e2e",
                        paddingTop:"0.9rem", margin:0 }}>
              ⚠ Este simulador tem fins educacionais e não constitui assessoria financeira. Consulte um profissional
              habilitado (CFP/CGA) antes de realizar operações. Valores de IR são estimativos — regime de caixa aplicável.
              Imposto de Renda sobre Ganho de Capital (art. 18 da Lei 9.250/95): 15% para ganhos até R$ 5M.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
