
import React, { useState, useRef, ChangeEvent } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";

// --- TypeScript Declarations ---
// Garante que o TS reconheça o process.env mesmo em ambiente web
declare const process: {
  env: {
    API_KEY?: string;
    [key: string]: string | undefined;
  };
};

// --- Types ---
interface Variable {
  key: string;
  value: string;
}

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

  const [generatedHtml, setGeneratedHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // --- Refs ---
  const htmlInputRef = useRef<HTMLInputElement>(null);
  const txtInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  // 1. HTML Template Upload
  const handleHtmlUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setHtmlTemplate(text);
        setHtmlFileName(file.name);
        setError(null);
      }
    };
    reader.onerror = () => setError("Falha ao ler o arquivo HTML.");
    reader.readAsText(file);
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
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        // Parse format "Key: Value" or "Key=Value" per line
        const lines = text.split(/\r?\n/);
        const newVars: Variable[] = [];
        
        lines.forEach(line => {
          if (line.trim()) {
            // Support both ':' and '=' as separators
            const separatorIndex = line.indexOf(':') !== -1 ? line.indexOf(':') : line.indexOf('=');
            if (separatorIndex !== -1) {
              const key = line.substring(0, separatorIndex).trim();
              const value = line.substring(separatorIndex + 1).trim();
              // Basic sanitization
              if (key) newVars.push({ key, value });
            }
          }
        });

        if (newVars.length > 0) {
          setVariables(prev => {
            // Merge strategy: Update existing keys, append new ones
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
    reader.readAsText(file);
  };

  // 3. Image Upload
  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione apenas arquivos de imagem.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        setImageBase64(result);
        setImageName(file.name);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // 4. Generation Logic
  const handleGenerate = async () => {
    if (!htmlTemplate) {
      setError("Obrigatório: Faça o upload de um template HTML base.");
      return;
    }

    // Safe access to API Key with Typescript check
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setError("Erro de Configuração: API Key não encontrada no ambiente.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedHtml("");

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const variablesString = variables
        .filter(v => v.key.trim() !== "")
        .map(v => `${v.key}: ${v.value}`)
        .join("\n");
      
      const imageInstruction = imageBase64 
        ? `INSTRUÇÃO DE IMAGEM: O usuário forneceu uma imagem promocional. Você OBRIGATORIAMENTE deve inserir a tag <img src="${imageBase64}" style="width: ${imageWidth}%; max-width: 100%; height: auto; display: block; margin: 20px auto;" alt="Imagem da Campanha" />. Escolha o melhor lugar para ela dentro do HTML (logo após o header ou antes do CTA). Mantenha o base64 exato.` 
        : "Nenhuma imagem adicional foi fornecida.";

      const prompt = `
        CONTEXTO: Você é um Especialista em Marketing Direto e Desenvolvedor Front-end da Vivo.
        OBJETIVO: Criar o corpo de um e-mail HTML para comunicar um reajuste de preço (Banda Larga/Voz) de forma transparente e ética.

        INPUTS:
        1. TEMPLATE HTML (Estrutura Base):
        \`\`\`html
        ${htmlTemplate}
        \`\`\`

        2. VARIÁVEIS DO CLIENTE:
        ${variablesString}

        3. MÍDIA:
        ${imageInstruction}

        DIRETRIZES DE CONTEÚDO (Copywriting):
        - Tom de voz: Transparente, Respeitoso, Direto (Sem "corporatês" excessivo).
        - Estrutura do Texto:
          1. Abertura clara explicando o motivo do contato.
          2. Detalhamento do reajuste (Use a variável de Delta se disponível).
          3. Benefícios do serviço que justificam a continuidade (Use dados fictícios auditáveis se necessário).
          4. CTA claro para tirar dúvidas ou ver detalhes da conta.
        
        DIRETRIZES TÉCNICAS (Output):
        - Retorne O CÓDIGO HTML COMPLETO.
        - Integre o texto gerado DENTRO da estrutura do Template HTML fornecido.
        - Substitua todas as chaves de variáveis (ex: ##Nome##) pelos valores fornecidos. Se o valor estiver vazio, remova a chave ou coloque um texto genérico adequado.
        - Não quebre o layout do template original (preserve CSS inline, tabelas, header/footer).
        - Não use markdown na resposta final, apenas o código HTML.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      let cleanHtml = response.text || "";
      // Sanitize AI markdown output if present
      cleanHtml = cleanHtml.replace(/^```html\s*/i, '').replace(/```$/, '');

      setGeneratedHtml(cleanHtml);

    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(`Erro na geração: ${err.message}`);
      } else {
        setError("Ocorreu um erro desconhecido durante a geração.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedHtml) return;
    
    const blob = new Blob([generatedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vivo-campanha-${new Date().toISOString().slice(0,10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <h2>Configuração da Campanha</h2>
          
          {/* 1. HTML Base */}
          <div className="section-group">
            <label className="section-title">1. Template Base (HTML)</label>
            <div 
              className={`file-upload small ${htmlTemplate ? 'active' : ''}`}
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
              <span>{htmlFileName || "Carregar HTML Base (Header/Footer)"}</span>
            </div>
          </div>

          {/* 2. Variables */}
          <div className="section-group">
            <div className="flex-header">
              <label className="section-title">2. Dados Variáveis</label>
              <button className="btn-text" onClick={() => txtInputRef.current?.click()}>
                📥 Importar .txt
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
                    placeholder="Chave (ex: ##Nome##)"
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
                    aria-label="Remover variável"
                  >×</button>
                </div>
              ))}
              <button className="btn-add-var" onClick={addVariable}>+ Adicionar Campo</button>
            </div>
          </div>

          {/* 3. Image Upload */}
          <div className="section-group">
            <label className="section-title">3. Imagem Promocional</label>
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
              <span>{imageName || "Carregar Imagem (Opcional)"}</span>
            </div>
            
            {imageBase64 && (
              <div className="image-controls">
                <label>Largura da Imagem no Email: {imageWidth}%</label>
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

          {error && <div className="error-msg" role="alert">{error}</div>}

          <button 
            className="btn-primary" 
            onClick={handleGenerate} 
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex-center">
                <span className="loading-spinner"></span>
                Processando...
              </span>
            ) : (
              "Gerar E-mail Completo"
            )}
          </button>
        </div>

        {/* Right Panel: Output */}
        <div className="card output-panel">
          <div className="panel-header">
            <h2>Preview Final</h2>
            <div className="actions">
              {generatedHtml && (
                <button className="btn-secondary" onClick={handleDownload}>
                  💾 Baixar HTML
                </button>
              )}
            </div>
          </div>

          <div className="preview-container">
            {generatedHtml ? (
              <iframe 
                title="Visualização do Email"
                srcDoc={generatedHtml}
                className="html-iframe"
                sandbox="allow-same-origin allow-scripts"
              />
            ) : (
              <div className="placeholder-text">
                <p>O layout renderizado aparecerá aqui.</p>
                <small>Carregue o HTML base e defina as variáveis para começar.</small>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// Ensure root element exists before mounting
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
