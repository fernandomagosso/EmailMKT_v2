
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

// --- Helper for Image Processing ---

const processImage = (img: HTMLImageElement, action: string, param?: string): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return img.src;

  const w = img.naturalWidth;
  const h = img.naturalHeight;

  if (action === 'rotate') {
    // 90 degree rotation
    canvas.width = h;
    canvas.height = w;
    ctx.translate(h/2, w/2);
    ctx.rotate(90 * Math.PI / 180);
    ctx.drawImage(img, -w/2, -h/2);
  } else if (action === 'crop') {
    // Simple Center Crops
    let cropW = w;
    let cropH = h;
    
    if (param === 'square') {
      const size = Math.min(w, h);
      cropW = size;
      cropH = size;
    } else if (param === '16:9') {
      if (w / h > 16/9) {
        cropH = h;
        cropW = h * (16/9);
      } else {
        cropW = w;
        cropH = w * (9/16);
      }
    } else if (param === '4:5') {
       if (w/h > 4/5) {
         cropH = h;
         cropW = h * (4/5);
       } else {
         cropW = w;
         cropH = w * (5/4);
       }
    }

    canvas.width = cropW;
    canvas.height = cropH;
    const sx = (w - cropW) / 2;
    const sy = (h - cropH) / 2;
    ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, cropW, cropH);

  } else if (action === 'filter') {
    canvas.width = w;
    canvas.height = h;
    if (param === 'grayscale') ctx.filter = 'grayscale(100%)';
    if (param === 'sepia') ctx.filter = 'sepia(100%)';
    ctx.drawImage(img, 0, 0);
  }

  return canvas.toDataURL('image/jpeg', 0.9);
};

// --- Helper for Toolbar ---
const EditorToolbar = ({ onFormat, selectedImage, onImageAdjust, onImageProcess }: { 
  onFormat: (cmd: string, val?: string) => void, 
  selectedImage: HTMLImageElement | null,
  onImageAdjust: (type: 'width' | 'align', val: string) => void,
  onImageProcess: (type: string, param?: string) => void
}) => {
  return (
    <div className="editor-toolbar">
      <div className="toolbar-group">
        <button onClick={() => onFormat('bold')} title="Negrito"><b>B</b></button>
        <button onClick={() => onFormat('italic')} title="Itálico"><i>I</i></button>
        <button onClick={() => onFormat('underline')} title="Sublinhado"><u>U</u></button>
      </div>
      <div className="toolbar-separator"></div>
      <div className="toolbar-group">
        <button onClick={() => onFormat('justifyLeft')} title="Esquerda">⬅️</button>
        <button onClick={() => onFormat('justifyCenter')} title="Centralizar">⏺️</button>
        <button onClick={() => onFormat('justifyRight')} title="Direita">➡️</button>
      </div>
      <div className="toolbar-separator"></div>
      <div className="toolbar-group">
        <button onClick={() => onFormat('formatBlock', 'H2')} title="Título">T</button>
        <button onClick={() => onFormat('formatBlock', 'P')} title="Parágrafo">¶</button>
      </div>
      
      {selectedImage && (
        <>
          <div className="toolbar-separator"></div>
          <div className="toolbar-group image-controls-bar">
            <span className="tool-label">TAMANHO:</span>
            <button onClick={() => onImageAdjust('width', '100%')} title="Largura 100%">100%</button>
            <button onClick={() => onImageAdjust('width', '75%')} title="Largura 75%">75%</button>
            <button onClick={() => onImageAdjust('width', '50%')} title="Largura 50%">50%</button>
            <span className="tool-divider">|</span>
            <span className="tool-label">EDIÇÃO:</span>
             <button onClick={() => onImageProcess('rotate')} title="Girar 90°">🔄</button>
             <button onClick={() => onImageProcess('crop', 'square')} title="Recortar Quadrado">✂️ 1:1</button>
             <button onClick={() => onImageProcess('crop', '16:9')} title="Recortar Paisagem">✂️ 16:9</button>
             <button onClick={() => onImageProcess('filter', 'grayscale')} title="P&B">🎨 P&B</button>
             <button onClick={() => onImageProcess('reset')} title="Restaurar Original">↩️</button>
          </div>
        </>
      )}
    </div>
  );
};

// --- Main Component ---

const App: React.FC = () => {
  // --- State ---
  const [templateContent, setTemplateContent] = useState<string>("");
  const [activeTemplateName, setActiveTemplateName] = useState<string>("");
  
  const [variables, setVariables] = useState<Variable[]>([
    { id: '1', key: "##NomeCliente##", value: "" },
    { id: '2', key: "##Delta##", value: "" }
  ]);
  
  const [imageData, setImageData] = useState<{base64: string, name: string, width: number, original: string} | null>(null);
  
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [htmlPreview, setHtmlPreview] = useState<string>("");
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0); 
  
  // Editor State
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);

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
        const safeKey = v.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(safeKey, 'g');
        draft = draft.replace(regex, v.value);
      }
    });

    // 2. Apply Image (Simple Injection Strategy)
    if (imageData?.base64) {
      const imgTag = `<img src="${imageData.base64}" alt="Destaque" style="width: ${imageData.width}%; max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 4px;" class="vivo-injected-img" />`;
      
      if (draft.includes('class="vivo-injected-img"')) {
        draft = draft.replace(/<img[^>]*class="vivo-injected-img"[^>]*>/g, imgTag);
      } else if (draft.includes('class="vivo-promo-hero"')) {
        draft = draft.replace(/<div class="vivo-promo-hero"[^>]*>.*?<\/div>/s, `<div class="vivo-promo-hero" style="padding:0;">${imgTag}</div>`);
      } else if (draft.includes('<!-- Espaço reservado -->')) {
        draft = draft.replace('<!-- Espaço reservado -->', imgTag);
      } else if (draft.includes('<h1')) {
        draft = draft.replace('<h1', `${imgTag}<h1`);
      } else {
        draft = draft.replace('<body', `<body`); 
        const bodyIdx = draft.indexOf('>', draft.indexOf('<body')) + 1;
        if (bodyIdx > 0) {
           draft = draft.slice(0, bodyIdx) + imgTag + draft.slice(bodyIdx);
        }
      }
    }

    setHtmlPreview(draft);
    setRenderKey(prev => prev + 1);
  }, [templateContent, variables, imageData?.base64]); // Re-run when image BASE64 changes

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
        setImageData({ 
          base64: res, 
          name: file.name, 
          width: 100,
          original: res // store original for reset
        });
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAiOptimization = async () => {
    if (!htmlPreview) return;
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setErrorMsg("Chave de API não encontrada.");
      return;
    }

    setIsAiLoading(true);
    setErrorMsg(null);

    try {
      let contentToProcess = editableRef.current?.innerHTML || htmlPreview;
      let placeholder = "";
      
      const imgRegex = /src="(data:image\/[^;]+;base64,[^"]+)"/g;
      const matches = contentToProcess.match(imgRegex);
      const placeholders: Record<string, string> = {};

      if (matches) {
        matches.forEach((match, idx) => {
           const dataUrl = match.match(/"([^"]+)"/)?.[1];
           if (dataUrl) {
             const key = `##IMG_DATA_${idx}##`;
             placeholders[key] = dataUrl;
             contentToProcess = contentToProcess.replace(dataUrl, key);
           }
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        VOCÊ É: Especialista em Email Marketing e UX Writing da Vivo.
        OBJETIVO: Melhorar o conteúdo do HTML abaixo.
        HTML INPUT: ${contentToProcess}
        INSTRUÇÕES: ${customPrompt || "Melhore a clareza, corrija a gramática e torne o tom amigável e transparente."}
        REGRAS:
        1. Mantenha estrutura HTML.
        2. NÃO remova placeholders ##IMG_DATA_X##.
        3. Use UTF-8 (acentos diretos).
        4. Retorne apenas o código HTML.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      let responseText = response.text || "";
      
      responseText = responseText.replace(/```html/g, '').replace(/```/g, '').trim();

      Object.keys(placeholders).forEach(key => {
        responseText = responseText.split(key).join(placeholders[key]);
      });

      if (editableRef.current) {
        editableRef.current.innerHTML = responseText;
      }
      setHtmlPreview(responseText); 
      setRenderKey(prev => prev + 1);

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

  // --- Editor Toolbar Handlers ---
  const executeCommand = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (editableRef.current) editableRef.current.focus();
  };

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      setSelectedImage(target as HTMLImageElement);
    } else {
      setSelectedImage(null);
    }
  };

  const handleImageAdjust = (type: 'width' | 'align', val: string) => {
    if (!selectedImage) return;
    if (type === 'width') {
      selectedImage.style.width = val;
    } else if (type === 'align') {
      selectedImage.style.display = 'block';
      if (val === 'center') {
        selectedImage.style.marginLeft = 'auto';
        selectedImage.style.marginRight = 'auto';
        selectedImage.style.float = 'none';
      } else if (val === 'left') {
        selectedImage.style.marginLeft = '0';
        selectedImage.style.marginRight = 'auto';
        selectedImage.style.float = 'left';
      } else if (val === 'right') {
        selectedImage.style.marginLeft = 'auto';
        selectedImage.style.marginRight = '0';
        selectedImage.style.float = 'right';
      }
    }
    if (editableRef.current) setHtmlPreview(editableRef.current.innerHTML);
  };

  const handleImageProcess = (type: string, param?: string) => {
    if (!selectedImage) return;

    if (type === 'reset' && imageData?.original) {
      selectedImage.src = imageData.original;
      if (editableRef.current) setHtmlPreview(editableRef.current.innerHTML);
      // Also update main state to reflect reset if it matches the main image
      setImageData(prev => prev ? { ...prev, base64: prev.original } : null);
      return;
    }

    // Process using canvas
    const newBase64 = processImage(selectedImage, type, param);
    selectedImage.src = newBase64;
    
    // Sync main state
    setImageData(prev => prev ? { ...prev, base64: newBase64 } : null);
    
    if (editableRef.current) setHtmlPreview(editableRef.current.innerHTML);
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <header className="brand-header">
          <h1>vivo <span className="subtitle">Marketing Builder</span></h1>
        </header>

        <div className="scroll-content">
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

          <section className="control-group">
            <label className="group-label">3. Imagem Destaque (Inicial)</label>
            <div className="upload-box" onClick={() => imgInputRef.current?.click()}>
              {imageData ? (
                <span>📷 {imageData.name}</span>
              ) : (
                <span>Clique para selecionar imagem</span>
              )}
            </div>
            <input type="file" hidden ref={imgInputRef} accept="image/*" onChange={handleImgUpload} />
          </section>

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

      <main className="preview-area">
        <header className="preview-toolbar">
          <div className="tabs">
            <button className={`tab ${viewMode === 'visual' ? 'active' : ''}`} onClick={() => setViewMode('visual')}>Editor Visual</button>
            <button className={`tab ${viewMode === 'code' ? 'active' : ''}`} onClick={() => setViewMode('code')}>Código HTML</button>
          </div>
          <button className="primary-btn download-btn" onClick={handleDownload} disabled={!htmlPreview}>
            💾 Baixar HTML
          </button>
        </header>

        {viewMode === 'visual' && htmlPreview && (
          <div className="formatting-bar-container">
            <EditorToolbar 
              onFormat={executeCommand} 
              selectedImage={selectedImage} 
              onImageAdjust={handleImageAdjust}
              onImageProcess={handleImageProcess}
            />
          </div>
        )}

        <div className="canvas-wrapper">
          {viewMode === 'visual' ? (
            <div className="visual-canvas">
              {!htmlPreview && <div className="empty-state">Selecione um template para começar</div>}
              {htmlPreview && (
                <div 
                  key={renderKey}
                  ref={editableRef}
                  className="email-content-editable"
                  contentEditable={true}
                  suppressContentEditableWarning={true}
                  dangerouslySetInnerHTML={{ __html: htmlPreview }}
                  onClick={handleEditorClick}
                  onInput={() => {}}
                />
              )}
            </div>
          ) : (
             <textarea 
               className="code-editor" 
               value={editableRef.current?.innerHTML || htmlPreview} 
               onChange={(e) => setHtmlPreview(e.target.value)}
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
