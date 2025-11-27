import React, { useState, useRef, useEffect, ChangeEvent } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";

// --- Types & Interfaces ---

interface Variable {
  id: string;
  key: string;
  value: string;
}

interface Template {
  id: string;
  name: string;
  icon: string;
  description: string;
  content: string;
}

// --- Constants & Templates ---

const VIVO_COLORS = {
  purple: '#660099',
  lightPurple: '#A74AC7',
  gray: '#f6f6f6',
  white: '#ffffff'
};

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'adjust',
    name: 'Aviso de Reajuste',
    icon: '⚖️',
    description: 'Comunicado formal e transparente sobre atualização de valores.',
    content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  .vivo-email-body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f6f6f6; color: #333; }
  .vivo-email-wrapper { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-top: 5px solid #660099; }
  .vivo-email-header { padding: 30px 40px; border-bottom: 1px solid #eee; }
  .vivo-email-logo { color: #660099; font-size: 24px; font-weight: bold; }
  .vivo-email-main { padding: 40px; line-height: 1.6; }
  .vivo-alert-box { background-color: #f3e5f5; border-left: 4px solid #A74AC7; padding: 15px; margin: 20px 0; border-radius: 4px; }
  .vivo-highlight { font-weight: bold; color: #660099; }
  .vivo-email-footer { background-color: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; }
</style>
</head>
<body class="vivo-email-body">
  <div class="vivo-email-wrapper">
    <div class="vivo-email-header">
      <div class="vivo-email-logo">vivo</div>
    </div>
    <div class="vivo-email-main">
      <h2 style="color: #660099; margin-top: 0;">Transparência com você, ##NomeCliente##</h2>
      <p>Entramos em contato para manter nosso compromisso de transparência. Anualmente, realizamos a revisão dos valores de nossos planos para continuar expandindo nossa rede de fibra ótica.</p>
      
      <div class="vivo-alert-box">
        <p style="margin: 0;"><strong>Atualização do Plano:</strong></p>
        <p style="margin: 5px 0 0 0;">O valor será ajustado em <span class="vivo-highlight">##Delta##</span> a partir do próximo ciclo.</p>
      </div>

      <p>Esse investimento garante que sua casa continue conectada com a ultravelocidade e estabilidade que você conhece.</p>
      <p>Caso tenha dúvidas, acesse o App Vivo.</p>
    </div>
    <div class="vivo-email-footer">
      Vivo - Telefônica Brasil S.A.<br>
      Respeitamos sua privacidade.
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'promo',
    name: 'Oferta Relâmpago',
    icon: '⚡',
    description: 'Foco em conversão rápida com destaque visual e CTA.',
    content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  .vivo-promo-body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #eeeeee; }
  .vivo-promo-container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  .vivo-promo-hero { background-color: #A74AC7; padding: 40px 20px; text-align: center; color: white; }
  .vivo-promo-content { padding: 30px; text-align: center; color: #333; }
  .vivo-promo-title { color: #660099; font-size: 28px; margin: 0 0 10px; }
  .vivo-promo-price { font-size: 42px; font-weight: bold; color: #333; margin: 20px 0; letter-spacing: -1px; }
  .vivo-promo-btn { background-color: #660099; color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-size: 18px; font-weight: bold; display: inline-block; margin-top: 10px; }
  .vivo-promo-legal { font-size: 11px; color: #999; padding: 20px; background: #fafafa; text-align: center; }
</style>
</head>
<body class="vivo-promo-body">
  <div class="vivo-promo-container">
    <div class="vivo-promo-hero">
      <h1 style="margin:0;">Sua conexão merece um Upgrade</h1>
    </div>
    <div class="vivo-promo-content">
      <h2 class="vivo-promo-title">Oferta Exclusiva ##NomeCliente##</h2>
      <p>Liberamos condições especiais para você turbinar sua internet hoje.</p>
      
      <div class="vivo-promo-price">##Delta##</div>
      
      <p>Mais velocidade para jogos, streaming e trabalho.</p>
      <br>
      <a href="#" class="vivo-promo-btn">QUERO APROVEITAR</a>
    </div>
    <div class="vivo-promo-legal">
      *Consulte regulamento no site. Válido por tempo limitado.
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'launch',
    name: 'Lançamento Premium',
    icon: '🚀',
    description: 'Design escuro e moderno para produtos high-tech.',
    content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  .vivo-launch-body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #000; color: #fff; margin:0; padding:0; }
  .vivo-launch-wrap { max-width: 600px; margin: 0 auto; background-color: #111; border: 1px solid #333; }
  .vivo-launch-top { height: 4px; background: linear-gradient(90deg, #660099, #A74AC7); }
  .vivo-launch-main { padding: 50px 30px; text-align: center; }
  .vivo-launch-h1 { font-size: 36px; letter-spacing: 1px; margin-bottom: 15px; color: #fff; }
  .vivo-launch-sub { color: #A74AC7; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; }
  .vivo-launch-text { color: #ccc; line-height: 1.6; margin: 30px 0; font-size: 16px; }
  .vivo-launch-cta { border: 1px solid #A74AC7; color: #fff; padding: 12px 35px; text-decoration: none; display: inline-block; transition: 0.3s; }
  .vivo-launch-cta:hover { background-color: #A74AC7; }
</style>
</head>
<body class="vivo-launch-body">
  <div class="vivo-launch-wrap">
    <div class="vivo-launch-top"></div>
    <div class="vivo-launch-main">
      <div class="vivo-launch-sub">Novo Lançamento</div>
      <h1 class="vivo-launch-h1">O Futuro Chegou</h1>
      <p class="vivo-launch-text">A tecnologia que transforma a sua casa está disponível. Conheça o novo <strong>##Delta##</strong> e experimente a verdadeira velocidade.</p>
      <a href="#" class="vivo-launch-cta">SAIBA MAIS</a>
    </div>
  </div>
</body>
</html>`
  }
];

// --- Main Component ---

const App: React.FC = () => {
  // --- State ---
  const [templateContent, setTemplateContent] = useState<string>("");
  const [activeTemplateName, setActiveTemplateName] = useState<string>("");
  
  const [variables, setVariables] = useState<Variable[]>([
    { id: '1', key: "##NomeCliente##", value: "" },
    { id: '2', key: "##Delta##", value: "" }
  ]);
  
  const [imageData, setImageData] = useState<{base64: string, name: string, width: number} | null>(null);
  
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [htmlPreview, setHtmlPreview] = useState<string>("");
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // References
  const editableRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const txtInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---

  // Live Preview Builder
  useEffect(() => {
    if (!templateContent) {
      setHtmlPreview("");
      return;
    }

    let draft = templateContent;

    // 1. Apply Variables
    variables.forEach(v => {
      if (v.key) {
        // Escaping special regex characters for safety
        const safeKey = v.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(safeKey, 'g');
        draft = draft.replace(regex, v.value);
      }
    });

    // 2. Apply Image (Simple Injection Strategy)
    if (imageData?.base64) {
      const imgTag = `<img src="${imageData.base64}" alt="Destaque" style="width: ${imageData.width}%; max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 4px;" class="vivo-injected-img" />`;
      
      // Attempt to place image intelligently if markers exist, else prepend/append or replace generic placeholders
      if (draft.includes('class="vivo-injected-img"')) {
        draft = draft.replace(/<img[^>]*class="vivo-injected-img"[^>]*>/g, imgTag);
      } else if (draft.includes('class="vivo-promo-hero"')) {
        draft = draft.replace(/<div class="vivo-promo-hero"[^>]*>.*?<\/div>/s, `<div class="vivo-promo-hero" style="padding:0;">${imgTag}</div>`);
      } else if (draft.includes('<!-- Espaço reservado -->')) {
        draft = draft.replace('<!-- Espaço reservado -->', imgTag);
      } else if (draft.includes('<h1')) {
         // Insert before H1 if no marker
        draft = draft.replace('<h1', `${imgTag}<h1`);
      } else {
        // Fallback: inject after body open
        draft = draft.replace('<body', `<body`); // no-op just to find body
        const bodyIdx = draft.indexOf('>', draft.indexOf('<body')) + 1;
        if (bodyIdx > 0) {
           draft = draft.slice(0, bodyIdx) + imgTag + draft.slice(bodyIdx);
        }
      }
    }

    setHtmlPreview(draft);
  }, [templateContent, variables, imageData]);

  // --- Handlers ---

  const handleLoadTemplate = (t: Template) => {
    setTemplateContent(t.content);
    setActiveTemplateName(t.name);
    setErrorMsg(null);
  };

  const handleHtmlUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') {
        setTemplateContent(text);
        setActiveTemplateName(file.name);
        setErrorMsg(null);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleTxtUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') {
        const lines = text.split('\n');
        const newVars: Variable[] = [];
        let count = 0;
        lines.forEach(line => {
          if (line.includes(':')) {
            const [key, val] = line.split(':');
            if (key.trim()) {
              newVars.push({
                id: `imported-${count++}`,
                key: key.trim(),
                value: val ? val.trim() : ''
              });
            }
          }
        });
        if (newVars.length > 0) {
          setVariables(prev => [...prev, ...newVars]);
        } else {
          setErrorMsg("Formato inválido. Use 'Chave: Valor' em cada linha.");
        }
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImgUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg("Apenas arquivos de imagem são permitidos.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result;
      if (typeof res === 'string') {
        setImageData({ base64: res, name: file.name, width: 100 });
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAiOptimization = async () => {
    if (!htmlPreview) return;
    
    // Safety check for API Key
    const apiKey = process.env.API_KEY || window.process?.env?.API_KEY;
    if (!apiKey) {
      setErrorMsg("Chave de API não encontrada.");
      return;
    }

    setIsAiLoading(true);
    setErrorMsg(null);

    try {
      // 1. Protect Image Data (Token Saving)
      let contentToProcess = editableRef.current?.innerHTML || htmlPreview;
      let placeholder = "";
      
      if (imageData?.base64 && contentToProcess.includes(imageData.base64)) {
        placeholder = "##PROTECTED_IMG_BASE64##";
        contentToProcess = contentToProcess.split(imageData.base64).join(placeholder);
      }

      const ai = new GoogleGenAI({ apiKey });
      const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
        VOCÊ É: Especialista em Email Marketing e UX Writing da Vivo.
        OBJETIVO: Melhorar o conteúdo do HTML abaixo.
        
        HTML INPUT:
        ${contentToProcess}

        INSTRUÇÕES ESPECÍFICAS:
        ${customPrompt || "Melhore a clareza, corrija a gramática e torne o tom amigável e transparente."}

        REGRAS TÉCNICAS:
        1. Mantenha a estrutura HTML intacta (tags, classes, estilos).
        2. NÃO remova o placeholder '${placeholder}' se ele existir no src da imagem.
        3. Use acentuação normal (UTF-8), não use entidades HTML como &atilde;.
        4. Retorne APENAS o código HTML.

        Saída:
      `;

      const result = await model.generateContent(prompt);
      let responseText = result.response.text();
      
      // Clean markdown code blocks if present
      responseText = responseText.replace(/```html/g, '').replace(/```/g, '').trim();

      // 2. Restore Image
      if (placeholder && imageData?.base64) {
        responseText = responseText.split(placeholder).join(imageData.base64);
      }

      // Update Preview
      if (editableRef.current) {
        editableRef.current.innerHTML = responseText;
      }
      setHtmlPreview(responseText); // Sync state

    } catch (e: any) {
      console.error(e);
      setErrorMsg("Erro ao processar com IA: " + (e.message || "Erro desconhecido"));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDownload = () => {
    let content = editableRef.current?.innerHTML || htmlPreview;
    if (!content) return;

    // Ensure Meta Charset for UTF-8
    if (!content.includes('<meta charset="utf-8"')) {
       content = `<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<title>Email Vivo</title>\n</head>\n<body>\n${content}\n</body>\n</html>`;
    }

    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vivo-campanha-${new Date().getTime()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="app-container">
      {/* Sidebar Configuration */}
      <aside className="sidebar">
        <header className="brand-header">
          <h1>vivo <span className="subtitle">Marketing Builder</span></h1>
        </header>

        <div className="scroll-content">
          {/* Section 1: Templates */}
          <section className="control-group">
            <label className="group-label">1. Escolha o Layout</label>
            <div className="template-list">
              {DEFAULT_TEMPLATES.map(t => (
                <button 
                  key={t.id} 
                  className={`template-btn ${activeTemplateName === t.name ? 'active' : ''}`}
                  onClick={() => handleLoadTemplate(t)}
                >
                  <span className="icon">{t.icon}</span>
                  <div className="info">
                    <strong>{t.name}</strong>
                    <small>{t.description}</small>
                  </div>
                </button>
              ))}
            </div>
            <div className="or-divider">OU</div>
            <button className="secondary-btn" onClick={() => fileInputRef.current?.click()}>
              📂 Carregar HTML Próprio
            </button>
            <input type="file" hidden ref={fileInputRef} accept=".html" onChange={handleHtmlUpload} />
          </section>

          {/* Section 2: Variables */}
          <section className="control-group">
            <div className="flex-between">
              <label className="group-label">2. Dados Variáveis</label>
              <button className="link-btn" onClick={() => txtInputRef.current?.click()}>Imp. TXT</button>
              <input type="file" hidden ref={txtInputRef} accept=".txt" onChange={handleTxtUpload} />
            </div>
            <div className="vars-container">
              {variables.map((v, idx) => (
                <div key={v.id} className="var-row">
                  <input 
                    className="input-sm" 
                    value={v.key} 
                    onChange={e => {
                      const newVars = [...variables];
                      newVars[idx].key = e.target.value;
                      setVariables(newVars);
                    }} 
                    placeholder="Chave"
                  />
                  <input 
                    className="input-sm" 
                    value={v.value} 
                    onChange={e => {
                      const newVars = [...variables];
                      newVars[idx].value = e.target.value;
                      setVariables(newVars);
                    }} 
                    placeholder="Valor"
                  />
                  <button className="del-btn" onClick={() => setVariables(variables.filter((_, i) => i !== idx))}>×</button>
                </div>
              ))}
              <button className="add-btn" onClick={() => setVariables([...variables, { id: Date.now().toString(), key: '##Nova##', value: '' }])}>
                + Adicionar Campo
              </button>
            </div>
          </section>

          {/* Section 3: Image */}
          <section className="control-group">
            <label className="group-label">3. Imagem Destaque</label>
            <div className="upload-box" onClick={() => imgInputRef.current?.click()}>
              {imageData ? (
                <span>📷 {imageData.name}</span>
              ) : (
                <span>Clique para selecionar imagem</span>
              )}
            </div>
            <input type="file" hidden ref={imgInputRef} accept="image/*" onChange={handleImgUpload} />
            {imageData && (
              <div className="range-control">
                <small>Largura: {imageData.width}%</small>
                <input 
                  type="range" 
                  min="20" 
                  max="100" 
                  value={imageData.width} 
                  onChange={e => setImageData({...imageData, width: Number(e.target.value)})} 
                />
              </div>
            )}
          </section>

          {/* Section 4: AI */}
          <section className="control-group ai-section">
            <label className="group-label">4. Otimização IA</label>
            <textarea 
              className="prompt-input" 
              rows={3}
              placeholder="Ex: 'Deixe o texto mais curto e urgente'..."
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
            />
            <button 
              className="primary-btn ai-btn"
              onClick={handleAiOptimization}
              disabled={isAiLoading || !htmlPreview}
            >
              {isAiLoading ? '✨ Processando...' : '✨ Otimizar com IA'}
            </button>
          </section>

          {errorMsg && <div className="error-badge">{errorMsg}</div>}
        </div>
      </aside>

      {/* Main Preview Area */}
      <main className="preview-area">
        <header className="preview-toolbar">
          <div className="tabs">
            <button className={`tab ${viewMode === 'visual' ? 'active' : ''}`} onClick={() => setViewMode('visual')}>Visual Editor</button>
            <button className={`tab ${viewMode === 'code' ? 'active' : ''}`} onClick={() => setViewMode('code')}>HTML Code</button>
          </div>
          <button className="primary-btn download-btn" onClick={handleDownload} disabled={!htmlPreview}>
            💾 Baixar HTML
          </button>
        </header>

        <div className="canvas-wrapper">
          {viewMode === 'visual' ? (
            <div className="visual-canvas">
              {!htmlPreview && <div className="empty-state">Selecione um template para começar</div>}
              <div 
                ref={editableRef}
                className="email-content-editable"
                contentEditable={true}
                suppressContentEditableWarning={true}
                dangerouslySetInnerHTML={{ __html: htmlPreview }}
                onInput={(e) => {
                  // Sync manual edits back to state loosely, mainly for download
                  // Note: Full state sync on every keystroke in contentEditable can handle caret jumps poorly, 
                  // but we need it for download. We rely on ref for the "truth" during download/AI.
                }}
              />
            </div>
          ) : (
             <textarea 
               className="code-editor" 
               value={editableRef.current?.innerHTML || htmlPreview} 
               onChange={(e) => {
                 setHtmlPreview(e.target.value);
                 if (editableRef.current) editableRef.current.innerHTML = e.target.value;
               }}
             />
          )}
        </div>
      </main>
    </div>
  );
};

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
