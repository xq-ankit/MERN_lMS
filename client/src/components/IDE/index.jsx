import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import StudentViewCommonHeader from "../student-view/header";



const ModernMonacoEditor = () => {
  const [editorContent, setEditorContent] = useState("// Start coding with Academia Plus :)!");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");

  const LANGUAGE_VERSIONS = {
    javascript: "18.15.0",
    typescript: "5.0.3",
    python: "3.10.0",
    java: "15.0.2",
    csharp: "6.12.0",
    php: "8.2.3",
  };

  const API = axios.create({
    baseURL: "https://emkc.org/api/v2/piston",
  });

  const executeCode = async (language, sourceCode) => {
    try {
      const response = await API.post("/execute", {
        language: language,
        version: LANGUAGE_VERSIONS[language],
        files: [{ content: sourceCode }],
      });
      return response.data;
    } catch (error) {
      console.error("Error executing code:", error);
      return { error: error.message };
    }
  };

  const handleEditorChange = (value) => {
    setEditorContent(value);
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const handleCompile = async () => {
    const result = await executeCode(language, editorContent);
    if (result.error) {
      setOutput(`Error: ${result.error}`);
    } else {
      setOutput(result.run.output);
    }
  };

  return (
    <>
    <StudentViewCommonHeader/>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#f5efef",
        color: "#FFF",
        padding: "20px",
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <select
          value={language}
          onChange={handleLanguageChange}
          style={{
            padding: "10px",
            borderRadius: "4px",
            fontSize: "16px",
            backgroundColor: "#282C34",
            color: "#FFF",
            border: "1px solid #3B3F45",
          }}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="csharp">C#</option>
          <option value="java">Java</option>
          <option value="typescript">TypeScript</option>
          <option value="php">PHP</option>
        </select>
        <button
          onClick={handleCompile}
          style={{
            padding: "10px 20px",
            backgroundColor: "#f87171",
            color: "#FFF",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Compile
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flex: 1,
          gap: "20px",
        }}
      >
        <div style={{ flex: 2, border: "1px solid #3B3F45", borderRadius: "8px" }}>
          <Editor
            height="100%"
            language={language}
            value={editorContent}
            theme="vs-dark"
            options={{
              fontSize: 16,
              fontFamily: `'Fira Code', monospace`,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              minimap: { enabled: true },
              tabSize: 2,
              smoothScrolling: true,
              wordWrap: "on",
              renderWhitespace: "all",
            }}
            onChange={handleEditorChange}
          />
        </div>
        <div
          style={{
            flex: 1,
            backgroundColor: "#282C34",
            borderRadius: "8px",
            padding: "20px",
            color: "#FFF",
            overflowY: "auto",
          }}
        >
          <h3 style={{ marginBottom: "10px", textAlign: "center", color: "#61DAFB" }}>Output</h3>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: `'Fira Code', monospace`, fontSize: "14px" }}>
            {output || "No output yet. Write some code and hit Compile!"}
          </pre>
        </div>
      </div>
    </div>
    </>
  );
};

export default ModernMonacoEditor;
