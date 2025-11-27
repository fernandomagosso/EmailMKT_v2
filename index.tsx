import React, { useState, useRef, ChangeEvent, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";

// Declaração para garantir que o TypeScript entenda o process.env injetado
declare global {
  interface Window {
    process?: {
      env: {
        [key: string]: string | undefined;
      };
    };
  }
}

// --- Types ---
interface Variable {
  key: string;
  value: string;
}

interface Template {
  id: string;
  name: string;
  icon: string;
  content: string;
}

// --- Predefined Templates (Vivo Identity) ---
const PREDEFINED_TEMPLATES: Template[] = [
  {
    id: 'adjust',
    name: 'Aviso de Ajuste',
    icon: '⚖️',
    content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  /* Prefixing classes to avoid conflict with main app styles */
  .vivo-email-body { margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f6f6f6; color: #333; }
  .vivo-email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-top: 5px solid #660099; }
  .vivo-email-header { padding: 30px 40px; border-bottom: 1px solid #eee; }
  .vivo-email-logo { color: #660099; font-size: 24px; font-weight: bold; }
  .vivo-email-content { padding: 40px; line-height: 1.6; }
  .vivo-alert-box { background-color: #f3e5f5; border-left: 4px solid #A74AC7; padding: 15px; margin: 20px 0; border-radius: 4px; }
  .vivo-old-price { text-decoration: line-through; color: #999; }
  .vivo-new-price { font-size: 1.2em; font-weight: bold; color: #660099; }
  .vivo-email-footer { background-color: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; }
</style>
</head>
<body class="vivo-email-body">
  <div class="vivo-email-container">
    <div class="vivo-email-header">
      <div class="vivo-email-logo">vivo</div>
    </div>
    <div class="vivo-email-content">
      <h2 style="color: #660099; margin-top: 0;">Atualização importante sobre sua conta</h2>
      <p>Olá, <strong>##NomeCliente##</strong>.</p>
      <p>Acreditamos na transparência total em nossa relação. Por isso, estamos entrando em contato para informar sobre o reajuste anual do seu plano.</p>
      
      <div class="vivo-alert-box">
        <p style="margin: 0;"><strong>Detalhes da Atualização:</strong></p>
        <p style="margin: 5px 0 0 0;">O valor do seu plano terá um ajuste de <span class="vivo-new-price">##Delta##</span> referente à inflação acumulada e melhorias na rede.</p>
      </div>

      <p>Este ajuste nos permite continuar investindo na expansão da fibra ótica e garantir a estabilidade que sua casa precisa.</p>
      <p>Qualquer dúvida, estamos à disposição em nossos canais oficiais.</p>
    </div>
    <div class="vivo-email-footer">
      Vivo - Telefônica Brasil S.A.<br>
      Acesse o App Vivo para mais detalhes.
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'inst',
    name: 'Institucional',
    icon: '📢',
    content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  .vivo-inst-body { margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f6f6f6; }
  .vivo-inst-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
  .vivo-inst-header { background-color: #660099; padding: 30px 40px; text-align: left; }
  .vivo-inst-logo { color: white; font-size: 24px; font-weight: bold; text-decoration: none; }
  .vivo-inst-content { padding: 40px; color: #333333; line-height: 1.6; }
  .vivo-inst-h1 { color: #660099; font-size: 24px; margin-bottom: 20px; font-weight: bold; }
  .vivo-inst-footer { background-color: #333333; color: #999999; padding: 20px; text-align: center; font-size: 12px; }
  .vivo-inst-btn { display: inline-block; background-color: #660099; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }
</style>
</head>
<body class="vivo-inst-body">
  <div class="vivo-inst-container">
    <div class="vivo-inst-header">
      <div class="vivo-inst-logo">vivo</div>
    </div>
    <div class="vivo-inst-content">
      <div class="vivo-inst-h1">Olá, ##NomeCliente##</div>
      <p>Escrevemos hoje com transparência para falar sobre seus serviços.</p>
      <p>Este é um espaço para comunicado oficial da marca.</p>
      
      <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #f9f9f9; border-left: 4px solid #660099; margin: 20px 0;">
        <tr>
          <td>
            <strong>Resumo:</strong><br>
            Ajuste: <strong>##Delta##</strong><br>
          </td>
        </tr>
      </table>

      <p>Estamos à disposição para tirar suas dúvidas.</p>
      <a href="#" class="vivo-inst-btn">Acessar Minha Vivo</a>
    </div>
    <div class="vivo-inst-footer">
      <p>Vivo - Telefônica Brasil S.A.<br>Este é um e-mail automático, por favor não responda.</p>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'promo',
    name: 'Oferta Relâmpago',
    icon: '⚡',
    content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  .vivo-promo-body { margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #eeeeee; }
  .vivo-promo-wrapper { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  .vivo-promo-banner { background-color: #A74AC7; height: 200px; display: flex; align-items: center; justify-content: center; color: white; text-align: center; }
  .vivo-promo-main { padding: 30px; text-align: center; }
  .vivo-promo-title { color: #660099; font-size: 28px; margin: 0 0 10px; }
  .vivo-promo-price { font-size: 40px; color: #333; font-weight: bold; margin: 20px 0; }
  .vivo-promo-cta { background-color: #660099; color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-size: 18px; display: inline-block; transition: 0.3s; }
  .vivo-promo-legal { font-size: 11px; color: #999; padding: 20px; text-align: justify; background: #fafafa; }
</style>
</head>
<body class="vivo-promo-body">
  <div class="vivo-promo-wrapper">
    <!-- Espaço reservado para imagem de destaque -->
    <div class="vivo-promo-banner">
      <h1>Sua Internet pode mais</h1>
    </div>
    <div class="vivo-promo-main">
      <h2 class="vivo-promo-title">Oferta Exclusiva para ##NomeCliente##</h2>
      <p>Upgrade disponível com condições especiais apenas hoje.</p>
      
      <div class="vivo-promo-price">##Delta##</div>
      
      <p>Aproveite a ultravelocidade da Vivo Fibra.</p>
      <br>
      <a href="#" class="vivo-promo-cta">QUERO APROVEITAR</a>
    </div>
    <div class="vivo-promo-legal">
      *Consulte regulamento no site. Oferta válida por tempo limitado.
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'launch',
    name: 'Lançamento Tech',
    icon: '🚀',
    content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  .vivo-launch-body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #111; color: #fff; margin:0; padding:0; }
  .vivo-launch-container { max-width: 600px; margin: 0 auto; background-color: #000; }
  .vivo-launch-neon { height: 4px; background: linear-gradient(90deg, #660099, #A74AC7); }
  .vivo-launch-hero { padding: 40px 20px; text-align: center; }
  .vivo-launch-title { font-size: 32px; letter-spacing: 2px; margin-bottom: 10px; color: #A74AC7; }
  .vivo-launch-desc { color: #ccc; line-height: 1.5; margin-bottom: 30px; }
  .vivo-launch-btn { border: 2px solid #A74AC7; color: #fff; padding: 10px 30px; text-decoration: none; display: inline-block; }
  .vivo-launch-grid { display: flex; margin-top: 30px; border-top: 1px solid #333; }
  .vivo-launch-col { flex: 1; padding: 20px; text-align: center; border-right: 1px solid #333; }
  .vivo-launch-col:last-child { border: none; }
</style>
</head>
<body class="vivo-launch-body">
  <div class="vivo-launch-container">
    <div class="vivo-launch-neon"></div>
    <div class="vivo-launch-hero">
      <div style="font-size: 14px; text-transform: uppercase; color: #666; margin-bottom: 20px;">Vivo Apresenta</div>
      <h1 class="vivo-launch-title">NOVO ##Delta##</h1>
      <p class="vivo-launch-desc">A tecnologia que transforma a sua casa chegou.<br>Disponível agora para ##NomeCliente##.</p>
      <a href="#" class="vivo-launch-btn">CONHECER DETALHES</a>
    </div>
    <div class="vivo-launch-grid">
      <div class="vivo-launch-col">Velocidade</div>
      <div class="vivo-launch-col">Estabilidade</div>
      <div class="vivo-launch-col">Inovação</div>
    </div>
  </div>
</body>
</html>`
  }
];

const App: React.FC = () => {
  // --- State Management ---
  const [htmlTemplate, setHtmlTemplate] = useState<string>("");
  const [htmlFileName, setHtmlFileName] = useState<string>("");
  
  const [variables, setVariables] = useState<Variable[]>([
    { key: "##NomeCliente##", value: "" },
    { key: "##Delta##", value: "" }
  ]);

  const [imageBase64, setImageBase64] = useState<string>("");
  const [imageName, setImageName] = useState<string>("");
  const [imageWidth, setImageWidth] = useState<number>(100);

  // New State: Custom Prompt Instruction
  const [customInstructions, setCustomInstructions] = useState<string>("");

  const [generatedHtml, setGeneratedHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Used to force re-render of contentEditable when AI updates
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // New State: View Mode (Visual Editor vs Code)
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');

  // --- Refs ---
  const htmlInputRef = useRef<HTMLInputElement>(null);
  const txtInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const editableDivRef = useRef<HTMLDivElement>(null);

  // --- Handlers ---

  const handleSelectTemplate = (template: Template) => {
    setHtmlTemplate(template.content);
    setHtmlFileName(`Template: ${template.name}`);
    setError(null);
  };

  // 1. HTML Template Upload
  const handleHtmlUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const target = e.target as FileReader;
      const text = target.result;
      if (typeof text === "string") {
        setHtmlTemplate(text);
        setHtmlFileName(file.name);
        setError(null);
      }
    };
    reader.onerror = () => setError("Falha ao ler o arquivo HTML.");
    // Force UTF-8 to avoid special character issues
    reader.readAsText(file, "UTF-8");
  };

  // 2. Variables Management
  const handleVariableChange = (index: number, field: keyof Variable, newValue: string) => {
    setVariables(prev => {
      const newVars = [...prev];
      newVars[index] = { ...newVars[index], [field]: newValue };
      return newVars;
    });
  };

  const addVariable = () => {
    setVariables(prev => [...prev, { key: "##NovaVariavel##", value: "" }]);
  };

  const removeVariable = (index: number) => {
    setVariables(prev => prev.filter((_, i) => i !== index));
  };

  const handleTxtVariablesUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const target = e.target as FileReader;
      const text = target.result;
      
      if (typeof text === "string") {
        // Parse format "Key: Value" or "Key=Value" per line
        const lines = text.split(/\r?\n/);
        const newVars: Variable[] = [];
        
        lines.forEach(line => {
          if (line.trim()) {
            const separatorIndex = line.indexOf(':') !== -1 ? line.indexOf(':') : line.indexOf('=');
            if (separatorIndex !== -1) {
              const key = line.substring(0, separatorIndex).trim();
              const value = line.substring(separatorIndex + 1).trim();
              if (key) newVars.push({ key, value });
            }
          }
        });

        if (newVars.length > 0) {
          setVariables(prev => {
            const combined = [...prev];
            newVars.forEach(nv => {
              const existingIndex = combined.findIndex(v => v.key === nv.key);
              if (existingIndex >= 0) {
                combined[existingIndex] = { ...combined[existingIndex], value: nv.value };
              } else {
                combined.push(nv);
              }
            });
            return combined;
          });
          setError(null);
        } else {
          setError("O arquivo TXT não possui formato válido (Chave: Valor).");
        }
      }
    };
    reader.onerror = () => setError("Falha ao ler o arquivo de variáveis.");
    // Force UTF-8
    reader.readAsText(file, "UTF-8");
  };

  // 3. Image Upload
  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione apenas arquivos de imagem.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const target = e.target as FileReader;
      const result = target.result;
      if (typeof result === "string") {
        setImageBase64(result);
        setImageName(file.name);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- LIVE PREVIEW LOGIC ---
  useEffect(() => {
    if (!htmlTemplate) return;

    let currentDraft = htmlTemplate;

    // 1. Substituição de Variáveis
    variables.forEach(v => {
      if (v.key) {
        const regex = new RegExp(v.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        currentDraft = currentDraft.replace(regex, v.value);
      }
    });

    // 2. Injeção de Imagem (Local)
    if (imageBase64) {
      const imgTag = `<img src="${imageBase64}" style="width: ${imageWidth}%; max-width: 100%; height: auto; display: block; margin: 20px auto;" alt="Destaque" class="injected-img" />`;
      
      // Procura se já existe uma imagem injetada anteriormente para substituir
      if (currentDraft.includes('class="injected-img"')) {
         // Regex simples para substituir tag img existente com essa classe
         currentDraft = currentDraft.replace(/<img[^>]*class="injected-img"[^>]*>/g, imgTag);
      } else {
        // Inserção inteligente
        if (currentDraft.includes('<div class="main-content">')) {
           currentDraft = currentDraft.replace('<div class="main-content">', `<div class="main-content">${imgTag}`);
        } else if (currentDraft.includes('class="vivo-promo-banner"')) {
            currentDraft = currentDraft.replace(/<div class="vivo-promo-banner".*?<\/div>/s, `<div class="vivo-promo-banner" style="height:auto; padding:0; background:none;">${imgTag}</div>`);
        } else if (currentDraft.includes('<div class="banner">')) {
           currentDraft = currentDraft.replace(/<div class="banner">.*?<\/div>/s, `<div class="banner" style="height:auto; padding:0; background:none;">${imgTag}</div>`);
        } else if (currentDraft.includes('<body>')) {
           currentDraft = currentDraft.replace('<body>', `<body>${imgTag}`);
        } else {
           currentDraft = imgTag + currentDraft;
        }
      }
    }

    setGeneratedHtml(currentDraft);
    // Increment key to force re-render of div
    setRefreshKey(prev => prev + 1);
  }, [htmlTemplate, variables, imageBase64, imageWidth]);

  // 4. AI Refinement Logic
  const handleAiRefinement = async () => {
    if (!generatedHtml) {
      setError("Obrigatório: Carregue um template primeiro.");
      return;
    }

    const apiKey = typeof process !== 'undefined' && process.env && process.env.API_KEY
      ? process.env.API_KEY 
      : window.process?.env?.API_KEY;
    
    if (!apiKey) {
      setError("Erro de Configuração: API Key não detectada.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // CAPTURE CONTENT FROM EDITOR
      let contentToProcess = editableDivRef.current?.innerHTML || generatedHtml;

      // --- PROTECTION LOGIC: HIDE IMAGE BASE64 ---
      // Sending huge base64 strings to LLM is bad. We replace it with a token.
      let hasImage = false;
      
      if (imageBase64) {
        if (contentToProcess.includes(imageBase64)) {
            contentToProcess = contentToProcess.split(imageBase64).join("##IMG_DATA##");
            hasImage = true;
        }
      }

      const prompt = `
        CONTEXTO: Você é um Especialista em Marketing Direto e Desenvolvedor Front-end da Vivo.
        TAREFA: Otimizar e Refinar o código HTML de e-mail fornecido abaixo.

        INPUT (HTML ATUAL):
        \`\`\`html
        ${contentToProcess}
        \`\`\`
        
        INSTRUÇÕES DE USUÁRIO (O que melhorar):
        ${customInstructions || "Melhore a persuasão do texto, corrija erros de português e torne o tom mais empático e transparente, mantendo a estrutura visual."}

        DIRETRIZES TÉCNICAS E DE FORMATAÇÃO:
        - IMPORTANTE: Retorne os caracteres acentuados (ã, é, ç, ê) diretamente em formato UTF-8, NÃO use entidades HTML (como &atilde;, &ccedil;). Isso é vital para o editor visual funcionar corretamente.
        - Mantenha a estrutura HTML intacta.
        - Se encontrar ##IMG_DATA## no src da imagem, MANTENHA EXATAMENTE ASSIM. Não altere o placeholder da imagem.
        - Certifique-se de que o português esteja no padrão Brasil (pt-BR).

        OUTPUT ESPERADO:
        - Retorne APENAS o código HTML corrigido/melhorado.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      let cleanHtml = response.text || "";
      cleanHtml = cleanHtml.replace(/^```html\s*/i, '').replace(/```$/, '');

      // --- RESTORE IMAGE ---
      if (hasImage && imageBase64) {
          cleanHtml = cleanHtml.split("##IMG_DATA##").join(imageBase64);
      }

      setGeneratedHtml(cleanHtml);
      setRefreshKey(prev => prev + 1); // Force div refresh

    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(`Erro na IA: ${err.message}`);
      } else {
        setError("Ocorreu um erro desconhecido.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    let contentToDownload = editableDivRef.current?.innerHTML || generatedHtml;
    if (!contentToDownload) return;
    
    // Ensure Meta Charset exists for UTF-8
    if (!contentToDownload.includes('<meta charset="utf-8"')) {
       if (!contentToDownload.includes('<html')) {
          contentToDownload = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vivo Campanha</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif;">
${contentToDownload}
</body>
</html>`;
       } else {
          contentToDownload = contentToDownload.replace('<head>', '<head>\n<meta charset="utf-8">');
       }
    }

    const blob = new Blob([contentToDownload], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vivo-campanha-${new Date().toISOString().slice(0,10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Sync edits in real-time
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
     setGeneratedHtml(e.currentTarget.innerHTML);
  };

  return (
    <div className="app">
      <header>
        <div className="logo">vivo <span style={{fontWeight: 300}}>Marketing Builder</span></div>
        <div className="user-badge">CX & Tech</div>
      </header>

      <main className="container">
        {/* Left Panel: Configuration */}
        <div className="card config-panel">
          <h2>1. Estrutura & Templates</h2>
          
          <div className="section-group">
            <label className="section-title">Galeria de Modelos Rápidos</label>
            <div className="template-grid">
              {PREDEFINED_TEMPLATES.map(t => (
                <button 
                  key={t.id} 
                  className="template-card" 
                  onClick={() => handleSelectTemplate(t)}
                  title={t.name}
                >
                  <span className="template-icon">{t.icon}</span>
                  <span className="template-name">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="divider-text">OU</div>

          <div className="section-group">
            <label className="section-title">Upload de Arquivo Próprio</label>
            <div 
              className={`file-upload small ${htmlTemplate && !htmlFileName.startsWith("Template:") ? 'active' : ''}`}
              onClick={() => htmlInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={htmlInputRef} 
                onChange={handleHtmlUpload} 
                style={{display: 'none'}} 
                accept=".html,.htm"
              />
              <span role="img" aria-label="code">🌐</span>
              <span>{htmlFileName || "Carregar HTML do PC"}</span>
            </div>
          </div>

          <hr style={{border: 'none', borderTop: '1px solid #eee', margin: '1rem 0'}} />

          {/* 2. Variables */}
          <div className="section-group">
            <div className="flex-header">
              <h2>2. Dados Variáveis</h2>
              <button className="btn-text" onClick={() => txtInputRef.current?.click()}>
                Importar .txt
              </button>
              <input 
                type="file" 
                ref={txtInputRef} 
                onChange={handleTxtVariablesUpload} 
                style={{display: 'none'}} 
                accept=".txt" 
              />
            </div>
            
            <div className="variables-list">
              {variables.map((v, index) => (
                <div key={index} className="variable-row">
                  <input 
                    type="text" 
                    placeholder="Chave"
                    value={v.key}
                    onChange={(e) => handleVariableChange(index, 'key', e.target.value)}
                    className="var-key"
                  />
                  <input 
                    type="text" 
                    placeholder="Valor"
                    value={v.value}
                    onChange={(e) => handleVariableChange(index, 'value', e.target.value)}
                    className="var-value"
                  />
                  <button 
                    className="btn-icon" 
                    onClick={() => removeVariable(index)}
                    title="Remover campo"
                  >×</button>
                </div>
              ))}
              <button className="btn-add-var" onClick={addVariable}>+ Adicionar Campo</button>
            </div>
          </div>

          {/* 3. Image Upload */}
          <div className="section-group">
            <label className="section-title">Imagem de Destaque</label>
            <div 
              className={`file-upload small ${imageBase64 ? 'active' : ''}`}
              onClick={() => imgInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={imgInputRef} 
                onChange={handleImageUpload} 
                style={{display: 'none'}} 
                accept="image/png, image/jpeg, image/gif"
              />
              <span role="img" aria-label="img">🖼️</span>
              <span>{imageName || "Selecionar Imagem"}</span>
            </div>
            
            {imageBase64 && (
              <div className="image-controls">
                <label>Tamanho: {imageWidth}%</label>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={imageWidth} 
                  onChange={(e) => setImageWidth(Number(e.target.value))} 
                />
              </div>
            )}
          </div>

          <hr style={{border: 'none', borderTop: '1px solid #eee', margin: '1.5rem 0'}} />

          <h2>3. Inteligência Artificial (Opcional)</h2>
          
          {/* 4. Prompt Customization */}
          <div className="section-group">
            <label className="section-title">Instruções para Otimização</label>
            <textarea
              className="text-area-input"
              rows={3}
              placeholder="Ex: 'Torne o texto mais curto', 'Adicione um tom de urgência ética', 'Corrija gramática'..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
            />
          </div>

          {error && <div className="error-msg" role="alert">{error}</div>}

          <button 
            className="btn-primary ai-btn" 
            onClick={handleAiRefinement} 
            disabled={isLoading || !htmlTemplate}
          >
            {isLoading ? (
              <span className="flex-center">
                <span className="loading-spinner"></span>
                Otimizando...
              </span>
            ) : (
              "✨ Melhorar Conteúdo com IA"
            )}
          </button>
        </div>

        {/* Right Panel: Output */}
        <div className="card output-panel">
          <div className="panel-header">
            <h2>Visualização em Tempo Real</h2>
            <div className="actions">
              {generatedHtml && (
                <>
                  <div className="tab-group">
                    <button 
                      className={`tab-btn ${viewMode === 'visual' ? 'active' : ''}`}
                      onClick={() => setViewMode('visual')}
                    >
                      Visual
                    </button>
                    <button 
                      className={`tab-btn ${viewMode === 'code' ? 'active' : ''}`}
                      onClick={() => setViewMode('code')}
                    >
                      Código
                    </button>
                  </div>
                  <button className="btn-secondary" onClick={handleDownload}>
                    💾 Baixar
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="preview-container">
            {!generatedHtml ? (
              <div className="placeholder-text">
                <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🎨</div>
                <p>Selecione um template ou carregue um arquivo para começar.</p>
              </div>
            ) : viewMode === 'visual' ? (
              <div className="visual-editor-wrapper">
                 <div className="visual-editor-notice">Modo Editor: Clique e digite para alterar o texto.</div>
                 <div 
                    key={refreshKey} // Forces re-render when AI updates content
                    ref={editableDivRef}
                    className="email-paper"
                    contentEditable={true}
                    onInput={handleInput} // Syncs text changes immediately
                    suppressContentEditableWarning={true}
                    dangerouslySetInnerHTML={{ __html: generatedHtml }}
                 />
              </div>
            ) : (
              <textarea 
                className="code-editor"
                value={editableDivRef.current?.innerHTML || generatedHtml}
                onChange={(e) => {
                   setGeneratedHtml(e.target.value);
                   // Manual update of ref not needed here as state drives textarea, 
                   // but needed for switch back to visual
                   if(editableDivRef.current) editableDivRef.current.innerHTML = e.target.value;
                }}
                spellCheck={false}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}