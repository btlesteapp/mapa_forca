import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import {
  Copy, Plus, Trash2, CarFront, Users, User, Shield, Calendar, Clock, Phone, IdCard,
  FileCheck, Turntable, CarFrontIcon, AlertTriangle, FileText, Download, CloudUpload, Home
} from 'lucide-react';
import { supabase } from './supabaseClient.js';
import { POLICIAIS } from './data/policiais.js';
import {
  IncidentListField,
  formatNum,
  INITIAL_HEADER,
  CICOM_PHONES,
  isAllowedSSA,
  getCurrentTurno,
  formatDateBR,
  formatHourBR,
  NATURE_SUGGESTIONS
} from './Shared.jsx';

const CICOM_DATA = {
  '4ª CICOM': [],
  '9ª CICOM': [],
  '11ª CICOM': [],
  '14ª CICOM': [],
  '25ª CICOM': [],
  '28ª CICOM': [],
  '29ª CICOM': [],
  '30ª CICOM': []
};

const INITIAL_CICOM_STATE = {
  resumo: {
    totalVtrsNaoMontadas: ''
  },
  servicoInterno: {
    totalAdmin: '',
    permanenciaReserva: ''
  },
  faltas: ['S/A'],
  atrasos: ['S/A'],
  dispensas: ['S/A']
};

export default function CicomMapModule({ showToast, activeTab, logoUrl, onNavigateHome }) {
  // ACTIVE CICOM
  const [activeCicom, setActiveCicom] = useState(() => {
    return localStorage.getItem('mf_active_cicom') || '4ª CICOM';
  });

  // HEADER STATE
  const [header, setHeader] = useState(() => {
    try {
      const saved = localStorage.getItem(`mf_header_cicom_${localStorage.getItem('mf_active_cicom') || '4ª CICOM'}`);
      return saved ? JSON.parse(saved) : { ...INITIAL_HEADER, cicomName: localStorage.getItem('mf_active_cicom') || '4ª CICOM' };
    } catch (e) {
      return { ...INITIAL_HEADER, cicomName: localStorage.getItem('mf_active_cicom') || '4ª CICOM' };
    }
  });

  useEffect(() => {
    localStorage.setItem('mf_active_cicom', activeCicom);
    const saved = localStorage.getItem(`mf_header_cicom_${activeCicom}`);
    if (saved) {
      setHeader(JSON.parse(saved));
    } else {
      setHeader({ ...INITIAL_HEADER, cicomName: activeCicom, telefone: CICOM_PHONES[activeCicom] });
    }
  }, [activeCicom]);

  useEffect(() => {
    localStorage.setItem(`mf_header_cicom_${activeCicom}`, JSON.stringify(header));
  }, [header, activeCicom]);

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    value = value.replace(/\D/g, "");
    if (value.length > 0) {
      if (value.length <= 2) {
        value = `(${value}`;
      } else if (value.length <= 7) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      } else {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
      }
    }
    setHeader(prev => ({ ...prev, telefone: value }));
  };

  const handleCpoIdChange = (idValue) => {
    setHeader(prev => {
      const newHeader = { ...prev, cpoId: idValue };
      const cleanId = idValue.toString().trim();
      const p = POLICIAIS.find(x => x.rg.toString().trim() === cleanId);
      if (p) {
        if (isAllowedSSA(p.postoGrad)) {
          newHeader.cpoNome = `${p.postoGrad} ${p.nomeGuerra}`;
        } else {
          showToast(`O policial ${p.nomeGuerra} (${p.postoGrad}) não pode ser SSA. Postos permitidos a partir de CB.`, 'error');
          newHeader.cpoNome = '';
        }
      } else if (cleanId === '') {
        newHeader.cpoNome = '';
      } else if (cleanId.length === 5) {
        showToast('CI do SSA não encontrado! Digite uma CI válida.', 'error');
        newHeader.cpoNome = '';
      }
      return newHeader;
    });
  };

  const handleCpoIdBlur = () => {
    const cleanId = header.cpoId.toString().trim();
    if (cleanId === '') return;
    const p = POLICIAIS.find(x => x.rg.toString().trim() === cleanId);
    if (!p) {
      showToast('CI do SSA não encontrado! Digite uma CI válida.', 'error');
      setHeader(prev => ({ ...prev, cpoId: '', cpoNome: '' }));
    }
  };

  // MAPA STATE
  const patchData = (parsedData) => {
    return {
      ...parsedData,
      faltas: parsedData.faltas?.length > 0 ? parsedData.faltas : ['S/A'],
      atrasos: parsedData.atrasos?.length > 0 ? parsedData.atrasos : ['S/A'],
      dispensas: parsedData.dispensas?.length > 0 ? parsedData.dispensas : ['S/A']
    };
  };

  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(`mf_cicom_${localStorage.getItem('mf_active_cicom') || '4ª CICOM'}`);
      if (saved) {
        return patchData(JSON.parse(saved));
      }
      return { ...INITIAL_CICOM_STATE, vtrs: CICOM_DATA[localStorage.getItem('mf_active_cicom') || '4ª CICOM'] || [] };
    } catch (e) {
      return { ...INITIAL_CICOM_STATE, vtrs: CICOM_DATA[localStorage.getItem('mf_active_cicom') || '4ª CICOM'] || [] };
    }
  });

  useEffect(() => {
    const saved = localStorage.getItem(`mf_cicom_${activeCicom}`);
    if (saved) {
      try {
        setData(patchData(JSON.parse(saved)));
      } catch (e) {
        setData({ ...INITIAL_CICOM_STATE, vtrs: CICOM_DATA[activeCicom] || [] });
      }
    } else {
      setData({ ...INITIAL_CICOM_STATE, vtrs: CICOM_DATA[activeCicom] || [] });
    }
  }, [activeCicom]);

  useEffect(() => {
    localStorage.setItem(`mf_cicom_${activeCicom}`, JSON.stringify(data));
  }, [data, activeCicom]);

  // OCCURRENCES STATE
  const [occurrences, setOccurrences] = useState(() => {
    try {
      const saved = localStorage.getItem('mf_occurrences_cicom');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('mf_occurrences_cicom', JSON.stringify(occurrences));
  }, [occurrences]);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showOccClearConfirm, setShowOccClearConfirm] = useState(false);

  // --- Handlers for MAPA ---
  const handleNestedUpdate = (section, field, value) => {
    setData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const handleVtrUpdate = (index, field, value) => {
    setData(prev => {
      const newVtrs = [...prev.vtrs];
      newVtrs[index] = { ...newVtrs[index], [field]: value };
      return { ...prev, vtrs: newVtrs };
    });
  };

  const handleVtrMemberUpdate = (vtrIndex, role, field, value) => {
    setData(prev => {
      const newVtrs = [...prev.vtrs];
      const member = { ...newVtrs[vtrIndex][role], [field]: value };

      if (field === 'id') {
        const cleanId = value.toString().replace(/\D/g, '').slice(0, 5);
        member.id = cleanId; // force only numbers and 5 max

        if (cleanId.length > 0) {
          const p = POLICIAIS.find(x => x.rg.toString().trim() === cleanId);
          if (p) {
            member.nome = `${p.postoGrad} ${p.nomeGuerra}`;
          }
        } else {
          member.nome = '';
        }
      }

      newVtrs[vtrIndex][role] = member;
      return { ...prev, vtrs: newVtrs };
    });
  };

  const addVtr = () => {
    setData(prev => {
      const newVtrs = [...prev.vtrs, {
        tipo: 'ORDINÁRIO', horario: '07h as 19h', prefixo: '', funcao: '',
        cmt: { nome: '', id: '' }, mot: { nome: '', id: '' }
      }];
      return { ...prev, vtrs: newVtrs };
    });
  };

  const removeVtr = (index) => {
    setData(prev => {
      const newVtrs = prev.vtrs.filter((_, i) => i !== index);
      return { ...prev, vtrs: newVtrs };
    });
  };

  const handleAddIncidentItem = (category) => {
    const processList = (list) => {
      if (list.length === 1 && list[0] === 'S/A') return [''];
      return [...list, ''];
    };
    setData(prev => ({ ...prev, [category]: processList(prev[category]) }));
  };

  const handleIncidentItemChange = (category, index, value) => {
    setData(prev => {
      const newList = [...prev[category]];
      newList[index] = value;
      return { ...prev, [category]: newList };
    });
  };

  const handleRemoveIncidentItem = (category, index) => {
    setData(prev => {
      const newList = prev[category].filter((_, i) => i !== index);
      if (newList.length === 0) newList.push('S/A');
      return { ...prev, [category]: newList };
    });
  };

  const formatHeaderDateBR = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatHeaderTime = (timeStr) => {
    if (!timeStr) return '';
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      return `${parts[0]}h${parts[1]}`;
    }
    return timeStr;
  };

  const getTurnoText = () => {
    if (header.turno === 'OUTRO' && header.customTurno) {
      return header.customTurno.toUpperCase();
    }
    return header.turno;
  };

  const totalVtrs = data.vtrs.length;
  const totalPms = data.vtrs.reduce((acc, v) => acc + (v.cmt.nome.trim() ? 1 : 0) + (v.mot.nome.trim() ? 1 : 0), 0);

  const generateReportText = () => {
    const formatListText = (arr) => arr.filter(i => i.trim() !== '').join(', ') || 'S/A';

    let text = `*MAPA DA FORÇA - ${header.cicomName.toUpperCase()}*\n`;
    text += `*BATALHÃO LESTE - ${formatHeaderDateBR(header.data)} ${formatHeaderTime(header.hora)}*\n`;
    text += `*${header.turno} - ${header.cicomHorarioTurno}*\n\n`;

    const ssaNome = header.cpoNome || 'NÃO PREENCHIDO';
    const ssaId = header.cpoId || 'S/ID';
    const ssaVtr = header.vtrSa || 'S/VTR';
    const ssaTel = header.telefone || 'S/TEL';

    text += `*SSA: ${ssaNome} (${ssaId})*\n`;
    text += `*TEL: ${ssaTel} - VTR ${ssaVtr}*\n\n`;

    data.vtrs.forEach(v => {
      text += `*VTR ${v.tipo.toUpperCase()}: (${v.horario})*\n`;
      text += `*VTR ${v.prefixo}:${v.funcao.toUpperCase()}*\n`;
      if (v.cmt.nome) text += `${v.cmt.nome} (${v.cmt.id}) - CMT\n`;
      if (v.mot.nome) text += `${v.mot.nome} (${v.mot.id}) - MOT\n`;
      text += '\n';
    });

    text += `----------------------------------\n\n`;
    text += `*TOTAL DE VIATURAS: ${formatNum(totalVtrs)}*\n`;
    text += `*TOTAL DE PM's: ${formatNum(totalPms)}*\n`;
    text += `*TOTAL DE VIATURAS NÃO MONTADAS: ${formatNum(data.resumo.totalVtrsNaoMontadas)}*\n\n`;

    text += `----------------------------------\n\n`;
    text += `*SERVIÇO INTERNO*\n`;
    text += `*TOTAL DE PM'S ADMINISTRATIVO: ${formatNum(data.servicoInterno.totalAdmin)}*\n`;
    text += `*PERMANÊNCIA/RESERVA: ${formatNum(data.servicoInterno.permanenciaReserva)}*\n\n`;

    text += `----------------------------------\n\n`;
    text += `*FALTAS: ${formatListText(data.faltas)}*\n`;
    text += `*ATRASOS: ${formatListText(data.atrasos)}*\n`;
    text += `*DISPENSAS: ${formatListText(data.dispensas)}*\n\n`;

    text += `----------------------------------\n\n`;
    text += `*Bom serviço a todos!*\n`;
    text += `*"Que Deus nos proteja em mais um dia de serviço"*\n\n`;
    text += `*"${header.cicomName.toUpperCase()}"*`;

    return text;
  };

  const handleCopyToClipboard = async () => {
    try {
      const text = generateReportText();
      await navigator.clipboard.writeText(text);
      if (showToast) showToast(`Relatório da ${header.cicomName} copiado para a área de transferência!`);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      if (showToast) showToast('Erro ao copiar o relatório.', 'error');
    }
  };

  const handleDownloadTXT = () => {
    try {
      const text = generateReportText();
      const element = document.createElement("a");
      const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      const fileDate = header.data ? header.data.replace(/-/g, '_') : 'data';
      element.download = `MAPA_${header.cicomName}_${fileDate}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      if (showToast) showToast('TXT exportado com sucesso!');
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Erro ao baixar TXT.', 'error');
    }
  };

  const handleGeneratePDF = () => {
    try {
      if (showToast) showToast('Gerando PDF...', 'info');
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const text = generateReportText();

      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(text, 180);
      doc.text(splitText, 15, 15);

      const fileDate = header.data ? header.data.replace(/-/g, '_') : 'data';
      doc.save(`MAPA_${header.cicomName}_${fileDate}.pdf`);
      if (showToast) showToast('PDF exportado com sucesso!');
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Erro ao exportar PDF.', 'error');
    }
  };

  const handleClearData = () => {
    setData({ ...INITIAL_CICOM_STATE, vtrs: [] });
    setHeader({ ...INITIAL_HEADER, cicomName: activeCicom, telefone: CICOM_PHONES[activeCicom] });
    setShowClearConfirm(false);
    if (showToast) showToast('Formulário limpo com sucesso.', 'info');
  };

  const handleSaveToSupabase = async () => {
    try {
      if (showToast) showToast('Salvando no servidor...', 'info');

      const payload = {
        cicom_name: header.cicomName,
        data_registro: header.data,
        turno: header.turno,
        header_payload: header,
        mapa_payload: data,
        ocorrencias_payload: occurrences[header.cicomName] || []
      };

      const { error } = await supabase
        .from('mapas_diarios')
        .upsert(payload, { onConflict: 'cicom_name,data_registro,turno' });

      if (error) throw error;

      if (showToast) showToast('Dados salvos no servidor com sucesso!', 'success');
    } catch (err) {
      console.error('Erro Supabase:', err);
      if (showToast) showToast('Erro ao salvar no servidor.', 'error');
    }
  };

  // --- Handlers for OCCURRENCES ---
  const handleAddOccurrence = () => {
    setOccurrences(prev => ({
      ...prev,
      [header.cicomName]: [
        ...(prev[header.cicomName] || []),
        { nature: '', ciops: '', bo: '', ciopsInProg: false, boInProg: false }
      ]
    }));
  };

  const handleRemoveOccurrence = (index) => {
    setOccurrences(prev => ({
      ...prev,
      [header.cicomName]: (prev[header.cicomName] || []).filter((_, i) => i !== index)
    }));
  };

  const handleOccurrenceFieldChange = (index, field, value) => {
    setOccurrences(prev => {
      const newList = [...(prev[header.cicomName] || [])];
      newList[index] = { ...newList[index], [field]: value };
      return { ...prev, [header.cicomName]: newList };
    });
  };

  const handleClearOccurrences = () => {
    setOccurrences(prev => ({ ...prev, [header.cicomName]: [] }));
    setShowOccClearConfirm(false);
    showToast(`Ocorrências da ${header.cicomName} foram limpas.`, 'info');
  };

  const formatSingleOccurrence = (occ) => {
    const nature = occ.nature.trim() || 'Ocorrência de relevo';
    const ciopsVal = occ.ciopsInProg ? 'Ocorrência em Andamento, aguardando numeral' : occ.ciops.trim();
    const boVal = occ.boInProg ? 'Ocorrência em Andamento, aguardando numeral' : occ.bo.trim();

    let result = `• ${nature}`;
    if (ciopsVal && boVal) result += `, Nº CIOPS: ${ciopsVal}. Nº BO: ${boVal}`;
    else if (ciopsVal) result += `, Nº CIOPS: ${ciopsVal}`;
    else if (boVal) result += `, Nº BO: ${boVal}`;

    if (!result.endsWith('.')) result += '.';
    return result;
  };

  const generateOccurrencesTXTString = (currentTimeOverride) => {
    const dateFormatted = formatDateBR(header.data);
    const timeFormatted = formatHourBR(currentTimeOverride || header.hora);
    const turnoText = getTurnoText();

    const lines = [];
    lines.push('*POLÍCIA MILITAR DO AMAZONAS*');
    lines.push('*BATALHÃO LESTE*');
    lines.push('');
    lines.push('*RESUMO DE OCORRÊNCIAS*');
    lines.push(`*${dateFormatted} - ${turnoText}* ${timeFormatted}`);
    lines.push(`*${header.cicomName.toUpperCase()}: ${header.cpoNome.toUpperCase().trim() || 'SEM IDENTIFICAÇÃO'}*`);
    lines.push('');

    const list = occurrences[header.cicomName] || [];
    const activeOccs = list.filter(o => o.nature.trim() !== '');

    if (activeOccs.length === 0) {
      lines.push('Sem ocorrência de grande vulto.');
    } else {
      activeOccs.forEach(o => {
        lines.push(formatSingleOccurrence(o));
      });
    }
    //MUDANÇAS NO FINAL DO RELATORIO
    lines.push('');
    lines.push('*BOA FOLGA E BOM SERVIÇO A TODOS*');
    lines.push(`*${header.cicomName.toUpperCase()}*`);
    lines.push('');
    lines.push('*BATALHÃO LESTE - CONQUISTAR E MANTER*');

    return lines.join('\n');
  };

  const handleCopyToClipboardOcc = () => {
    try {
      const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setHeader(prev => ({ ...prev, hora: currentTime }));
      const text = generateOccurrencesTXTString(currentTime);
      navigator.clipboard.writeText(text);
      showToast('Resumo de ocorrências copiado!');
    } catch (err) {
      console.error(err);
      showToast('Falha ao copiar resumo.', 'error');
    }
  };

  const handleDownloadOccTXT = () => {
    try {
      const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setHeader(prev => ({ ...prev, hora: currentTime }));
      const text = generateOccurrencesTXTString(currentTime);
      const element = document.createElement("a");
      const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      const dateFormatted = header.data ? header.data.replace(/-/g, '_') : 'ocorrencias';
      element.download = `RESUMO_OCORRENCIAS_${header.cicomName}_${dateFormatted}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      showToast('TXT de ocorrências baixado com sucesso!');
    } catch (err) {
      console.error(err);
      showToast('Erro ao baixar TXT de ocorrências.', 'error');
    }
  };

  const handleGenerateOccurrencesPDF = async () => {
    const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setHeader(prev => ({ ...prev, hora: currentTime }));
    showToast('Gerando PDF de ocorrências...', 'info');
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const navyDark = [8, 12, 24];
      const navyBlue = [27, 38, 79];
      const textDark = [30, 41, 59];
      const borderGray = [226, 232, 240];

      doc.setDrawColor(...navyBlue);
      doc.setLineWidth(0.4);
      doc.rect(6, 6, 198, 285);

      doc.setFillColor(...navyDark);
      doc.rect(6, 6, 198, 24, 'F');

      if (logoUrl) {
        try {
          doc.addImage(logoUrl, 'PNG', 12, 8, 16, 20);
        } catch (logoErr) {
          console.warn("Could not insert logo image into PDF.", logoErr);
        }
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("POLÍCIA MILITAR DO AMAZONAS", 105, 12, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text("BATALHÃO LESTE - BTL LESTE", 105, 17, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(245, 176, 65);
      doc.text(`RESUMO DE OCORRÊNCIAS - ${header.cicomName}`, 105, 22, { align: "center" });

      doc.setTextColor(...textDark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("INFORMAÇÕES OPERACIONAIS DO SERVIÇO", 12, 38);

      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.2);
      doc.line(12, 40, 198, 40);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);

      doc.text(`Data: ${formatDateBR(header.data)}`, 12, 45);
      doc.text(`Hora do Registro: ${currentTime}`, 12, 50);
      doc.text(`Turno Operacional: ${getTurnoText()}`, 12, 55);

      const ssaNameText = header.cpoNome ? header.cpoNome.toUpperCase() : 'SEM IDENTIFICAÇÃO';
      const ssaIdText = header.cpoId ? header.cpoId : 'N/C';
      doc.text(`SSA da Área (${header.cicomName}): ${ssaNameText}`, 85, 45);
      doc.text(`Matrícula / ID: ${ssaIdText}`, 85, 50);
      doc.text(`Telefone de Plantão: ${header.telefone || 'N/I'}`, 85, 55);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("RESUMO OPERACIONAL DE OCORRÊNCIAS DE RELEVO", 12, 65);
      doc.line(12, 67, 198, 67);

      let currentY = 72;
      doc.setTextColor(...textDark);

      doc.setFillColor(240, 244, 248);
      doc.rect(12, currentY, 186, 5.5, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...navyDark);
      doc.text(`${header.cicomName}`, 14, currentY + 4);

      currentY += 5.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...textDark);

      const list = occurrences[header.cicomName] || [];
      const activeOccs = list.filter(o => o.nature.trim() !== '');

      if (activeOccs.length === 0) {
        doc.text("Sem ocorrência de grande vulto.", 16, currentY + 4.5);
        currentY += 6.5;
      } else {
        activeOccs.forEach(o => {
          if (currentY > 270) {
            doc.addPage();
            doc.setDrawColor(...navyBlue);
            doc.setLineWidth(0.4);
            doc.rect(6, 6, 198, 285);
            currentY = 15;
          }
          const formatted = formatSingleOccurrence(o);
          const splitText = doc.splitTextToSize(formatted, 178);
          doc.text(splitText, 16, currentY + 4.5);
          currentY += (splitText.length * 4) + 1.5;
        });
      }

      currentY += 8;
      if (currentY > 270) {
        doc.addPage();
        doc.setDrawColor(...navyBlue);
        doc.setLineWidth(0.4);
        doc.rect(6, 6, 198, 285);
        currentY = 15;
      }

      doc.setFont("helvetica", "bolditalic");
      doc.setFontSize(9);
      doc.setTextColor(...navyBlue);
      doc.text("* BOA FOLGA E BOM SERVIÇO A TODOS *", 105, currentY, { align: "center" });
      doc.text(`* ${header.cicomName}: CONQUISTAR E MANTER *`, 105, currentY + 5, { align: "center" });

      const fileDate = header.data ? header.data.replace(/-/g, '_') : 'data';
      doc.save(`RESUMO_OCORRENCIAS_${header.cicomName}_${fileDate}.pdf`);
      showToast('PDF de ocorrências exportado com sucesso!');
    } catch (e) {
      console.error(e);
      showToast('Erro ao exportar resumo em PDF.', 'error');
    }
  };

  const getCicomLogo = () => {
    return `./logos/${header.cicomName.toLowerCase().replace('ª ', '-').replace(' ', '')}.png`;
  };

  return (
    <>
      {/* HEADER UI */}
      <div className="w-full mb-8">
        <section className="glass-panel p-6 rounded-2xl glow-accent">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6">
            <FileCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800 tracking-wide uppercase">
              Dados do SSA da Área
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. OPM */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-505 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" /> OPM (CICOM)
              </label>
              <select
                value={activeCicom}
                onChange={(e) => setActiveCicom(e.target.value)}
                className="glass-input px-3 py-2 text-sm rounded-lg cursor-pointer font-bold text-amber-700"
              >
                {Object.keys(CICOM_PHONES).map(cicom => (
                  <option key={cicom} value={cicom}>{cicom}</option>
                ))}
              </select>
            </div>

            {/* 2. CI */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-505 uppercase tracking-wider flex items-center gap-1.5">
                <IdCard className="w-3.5 h-3.5 text-blue-600" /> CI
              </label>
              <input
                type="text"
                placeholder="Ex: 20805"
                value={header.cpoId}
                onChange={(e) => handleCpoIdChange(e.target.value.replace(/\D/g, '').slice(0, 5))}
                onBlur={handleCpoIdBlur}
                maxLength={5}
                className="glass-input px-3 py-2 text-sm rounded-lg placeholder-slate-400"
              />
            </div>

            {/* 3. SSA DA ÁREA */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-505 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" /> SSA da Área
              </label>
              <input
                type="text"
                placeholder="Nome de Guerra (Autopreenchido)"
                value={header.cpoNome}
                readOnly
                className="glass-input px-3 py-2 text-sm rounded-lg bg-slate-100 text-slate-600 font-bold border-slate-200 outline-none cursor-not-allowed"
              />
            </div>

            {/* 4. TURNO */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-505 uppercase tracking-wider flex items-center gap-1.5">
                <Turntable className="w-3.5 h-3.5 text-blue-600" /> Turno
              </label>
              <select
                value={header.turno}
                onChange={(e) => {
                  const novoTurno = e.target.value;
                  const novoHorario = novoTurno === '1º TURNO' ? '07h as 19h' : '19h as 07h';
                  setHeader(prev => ({ ...prev, turno: novoTurno, cicomHorarioTurno: novoHorario }));
                }}
                className="glass-input px-3 py-2 text-sm rounded-lg cursor-pointer"
              >
                <option value="1º TURNO">1º TURNO</option>
                <option value="2º TURNO">2º TURNO</option>
              </select>
            </div>

            {/* 5. VTR SSA */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-505 uppercase tracking-wider flex items-center gap-1.5">
                <CarFrontIcon className="w-3.5 h-3.5 text-blue-600" /> VTR SSA
              </label>
              <input
                type="text"
                placeholder="Ex: 25-1006"
                value={header.vtrSa || ''}
                onChange={(e) => setHeader(prev => ({ ...prev, vtrSa: e.target.value }))}
                className="glass-input px-3 py-2 text-sm rounded-lg placeholder-slate-400"
              />
            </div>

            {/* 6. TELEFONE PLANTÃO */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-505 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" /> Telefone de Plantão
              </label>
              <input
                type="text"
                value={header.telefone}
                onChange={handlePhoneChange}
                className="glass-input px-3 py-2 text-sm rounded-lg placeholder-slate-400 font-bold"
              />
            </div>

            {/* 7. DATA */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-505 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> Data
              </label>
              <input
                type="date"
                value={header.data}
                onChange={(e) => setHeader(prev => ({ ...prev, data: e.target.value }))}
                className="glass-input px-3 py-2 text-sm rounded-lg"
              />
            </div>

            {/* 8. HORA DO REGISTRO */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-505 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Hora do Registro
              </label>
              <input
                type="time"
                value={header.hora}
                onChange={(e) => setHeader(prev => ({ ...prev, hora: e.target.value }))}
                className="glass-input px-3 py-2 text-sm rounded-lg"
              />
            </div>
          </div>
        </section >
      </div >

      {activeTab === 'cicom' && (
        <div className="flex flex-col gap-6 animate-fade-in w-full pb-8">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-bold tracking-wide flex items-center gap-2">
                <CarFront className="w-5 h-5 text-slate-300" /> Viaturas Empregadas - {header.cicomName}
              </h2>
              <button onClick={addVtr} className="flex items-center gap-1 bg-slate-600 hover:bg-slate-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer">
                <Plus className="w-4 h-4" /> Nova VTR
              </button>
            </div>
            <div className="p-6 flex flex-col gap-6">
              {data.vtrs.map((vtr, idx) => (
                <div key={idx} className="p-5 border border-slate-200 rounded-xl bg-slate-50 relative group">
                  <button onClick={() => removeVtr(idx)} className="absolute top-4 right-4 text-rose-500 hover:bg-rose-100 p-1.5 rounded-lg transition-colors cursor-pointer" title="Remover VTR">
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Tipo / Serviço</label>
                      <select
                        value={vtr.tipo}
                        onChange={e => handleVtrUpdate(idx, 'tipo', e.target.value)}
                        className="glass-input px-3 py-2 text-sm rounded-lg cursor-pointer bg-white"
                      >
                        <option value="ORDINÁRIO">ORDINÁRIO</option>
                        <option value="2X2">2X2</option>
                        <option value="ORD CORINGA">ORD CORINGA</option>
                        <option value="SEG">SEG</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Horário</label>
                      <select
                        value={vtr.horario}
                        onChange={e => handleVtrUpdate(idx, 'horario', e.target.value)}
                        className="glass-input px-3 py-2 text-sm rounded-lg cursor-pointer bg-white"
                      >
                        <option value="06h as 18h">06h as 18h</option>
                        <option value="07h as 19h">07h as 19h</option>
                        <option value="07h as 15h">07h as 15h</option>
                        <option value="08h as 16h">08h as 16h</option>
                        <option value="18h as 06h">18h as 06h</option>
                        <option value="19h as 07h">19h as 07h</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Prefixo (Número)</label>
                      <input
                        type="text"
                        value={vtr.prefixo}
                        onChange={e => handleVtrUpdate(idx, 'prefixo', e.target.value)}
                        placeholder="Ex: 1101"
                        className="glass-input px-3 py-2 text-sm rounded-lg bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Função Designada</label>
                      <input
                        type="text"
                        value={vtr.funcao}
                        onChange={e => handleVtrUpdate(idx, 'funcao', e.target.value)}
                        placeholder="Ex: SSA"
                        className="glass-input px-3 py-2 text-sm rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CMT */}
                    <div className="flex flex-col gap-3 p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Comandante (CMT)</span>
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Graduação/Nome"
                          value={vtr.cmt.nome}
                          onChange={e => handleVtrMemberUpdate(idx, 'cmt', 'nome', e.target.value)}
                          className="glass-input px-3 py-2 text-sm rounded-lg bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Digite a CI aqui"
                          value={vtr.cmt.id}
                          onChange={e => handleVtrMemberUpdate(idx, 'cmt', 'id', e.target.value)}
                          className="glass-input px-3 py-2 text-sm rounded-lg bg-white"
                        />
                      </div>
                    </div>
                    {/* MOT */}
                    <div className="flex flex-col gap-3 p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Motorista (MOT)</span>
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Graduação/Nome"
                          value={vtr.mot.nome}
                          onChange={e => handleVtrMemberUpdate(idx, 'mot', 'nome', e.target.value)}
                          className="glass-input px-3 py-2 text-sm rounded-lg bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Digite a CI aqui"
                          value={vtr.mot.id}
                          onChange={e => handleVtrMemberUpdate(idx, 'mot', 'id', e.target.value)}
                          className="glass-input px-3 py-2 text-sm rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {data.vtrs.length === 0 && (
                <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                  <p className="text-sm font-semibold text-slate-500">Nenhuma viatura registrada para esta CICOM.</p>
                </div>
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4 md:col-span-1">
              <h3 className="font-bold text-slate-700 uppercase text-sm border-b border-slate-100 pb-2">Resumo de Efetivo e VTR</h3>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500">TOTAL DE VIATURAS</span>
                  <span className="font-black text-slate-800 bg-slate-100 px-3 py-1 rounded">{formatNum(totalVtrs)}</span>
                </div>
                <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-3">
                  <span className="text-xs font-semibold text-slate-500">TOTAL DE PM's</span>
                  <span className="font-black text-slate-800 bg-slate-100 px-3 py-1 rounded">{formatNum(totalPms)}</span>
                </div>
                <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-3">
                  <span className="text-xs font-semibold text-slate-500">VTR NÃO MONTADAS</span>
                  <input type="text" value={data.resumo.totalVtrsNaoMontadas} onChange={e => handleNestedUpdate('resumo', 'totalVtrsNaoMontadas', e.target.value)} className="glass-input w-16 text-center text-sm py-1" />
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4">
              <h3 className="font-bold text-slate-700 uppercase text-sm border-b border-slate-100 pb-2">Serviço Interno</h3>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500">ADMINISTRATIVOS</span>
                  <input type="text" value={data.servicoInterno.totalAdmin} onChange={e => handleNestedUpdate('servicoInterno', 'totalAdmin', e.target.value)} className="glass-input w-16 text-center text-sm py-1" />
                </div>
                <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-3">
                  <span className="text-xs font-semibold text-slate-500">PERMANÊNCIA/RESERVA</span>
                  <input type="text" value={data.servicoInterno.permanenciaReserva} onChange={e => handleNestedUpdate('servicoInterno', 'permanenciaReserva', e.target.value)} className="glass-input w-16 text-center text-sm py-1" />
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4">
              <h3 className="font-bold text-slate-700 uppercase text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> Alterações do Serviço
              </h3>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500">FALTAS</span>
                  <span className="font-black text-slate-800 bg-slate-100 px-3 py-1 rounded">{formatNum(data.faltas.filter(f => f && f.trim() !== 'S/A' && f.trim() !== 'NENHUMA').length)}</span>
                </div>
                <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-3">
                  <span className="text-xs font-semibold text-slate-500">ATRASOS</span>
                  <span className="font-black text-slate-800 bg-slate-100 px-3 py-1 rounded">{formatNum(data.atrasos.filter(a => a && a.trim() !== 'S/A' && a.trim() !== 'NENHUMA').length)}</span>
                </div>
                <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-3">
                  <span className="text-xs font-semibold text-slate-500">DISPENSAS</span>
                  <span className="font-black text-slate-800 bg-slate-100 px-3 py-1 rounded">{formatNum(data.dispensas.filter(d => d && d.trim() !== 'S/A' && d.trim() !== 'NENHUMA').length)}</span>
                </div>
              </div>
            </section>
          </div>

          <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
            <section className="glass-panel p-6 rounded-2xl glow-accent">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6">
                <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                <h2 className="text-lg font-bold text-slate- tracking-wide uppercase">Alterações / Ocorrências de Serviço</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <IncidentListField
                  label="Faltas de Efetivo (Ex: Nome/ID)"
                  items={data.faltas}
                  placeholder="EX: SD STIVE FULANO (123456) - OPM"
                  onAdd={() => handleAddIncidentItem('faltas')}
                  onChange={(idx, val) => handleIncidentItemChange('faltas', idx, val)}
                  onRemove={(idx) => handleRemoveIncidentItem('faltas', idx)}
                />
                <IncidentListField
                  label="Atrasos de Serviço"
                  items={data.atrasos}
                  placeholder="EX: SD STIVE FULANO (123456) - OPM"
                  onAdd={() => handleAddIncidentItem('atrasos')}
                  onChange={(idx, val) => handleIncidentItemChange('atrasos', idx, val)}
                  onRemove={(idx) => handleRemoveIncidentItem('atrasos', idx)}
                />
                <IncidentListField
                  label="Dispensas do Turno"
                  items={data.dispensas}
                  placeholder="EX: SD STIVE FULANO (123456) - OPM"
                  onAdd={() => handleAddIncidentItem('dispensas')}
                  onChange={(idx, val) => handleIncidentItemChange('dispensas', idx, val)}
                  onRemove={(idx) => handleRemoveIncidentItem('dispensas', idx)}
                />
              </div>
            </section>
          </div>

          {/* Tab 1 Actions Panel */}
          <section className="flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-center p-6 rounded-2xl bg-slate-100 border border-slate-200 glass-panel mt-4">
            <button
              onClick={handleSaveToSupabase}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <CloudUpload className="w-4 h-4" />
              Salvar no Servidor
            </button>

            <button
              onClick={handleCopyToClipboard}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              Copiar Texto TXT
            </button>

            <button
              onClick={handleDownloadTXT}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-white hover:bg-slate-50 text-blue-600 border border-slate-350 hover:border-blue-400 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Baixar Relatório TXT
            </button>

            <div className="relative w-full sm:w-auto">
              {!showClearConfirm ? (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Limpar Dados
                </button>
              ) : (
                <div className="flex items-center gap-2 w-full sm:w-auto bg-white p-1 rounded-xl border border-rose-200 shadow-sm animate-fade-in">
                  <span className="text-xs font-bold text-slate-600 px-3 whitespace-nowrap">Deseja limpar os dados?</span>
                  <button
                    onClick={handleClearData}
                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Sim
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Não
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onNavigateHome}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-slate-800 hover:bg-slate-900 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Voltar ao Início
            </button>
          </section>
        </div>
      )
      }

      {/* OCORRENCIAS CICOM UI */}
      {
        activeTab === 'ocorrencias_cicom' && (
          <div className="flex flex-col gap-8 animate-fade-in max-w-5xl mx-auto w-full pb-8">
            <section className="glass-panel p-6 md:p-8 rounded-2xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 rounded-lg text-amber-700">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Resumo de Ocorrências</h2>
                    <p className="text-xs font-semibold text-slate-500 mt-1">Lançamento de ocorrências para a CICOM selecionada.</p>
                  </div>
                </div>
                <div className="px-4 py-2 bg-slate-100 rounded-lg border border-slate-200 text-sm font-bold text-slate-600">
                  Total de Registros: {(occurrences[header.cicomName] || []).length}
                </div>
              </div>

              <div className="flex flex-col gap-8">
                <div className="bg-white border border-amber-200 rounded-xl overflow-hidden shadow-sm hover:border-amber-300 transition-colors">
                  <div className="bg-slate-50 border-b border-amber-200 px-5 py-3.5 flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={getCicomLogo()}
                        alt={`Logo ${header.cicomName}`}
                        className="w-7 h-7 object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                      <h3 className="font-extrabold text-slate-800 text-sm tracking-wide uppercase">{header.cicomName}</h3>
                    </div>
                    <button
                      onClick={handleAddOccurrence}
                      className="text-xs font-bold px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Ocorrência
                    </button>
                  </div>

                  <div className="p-5 flex flex-col gap-4">
                    {(!occurrences[header.cicomName] || occurrences[header.cicomName].length === 0) ? (
                      <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <p className="text-sm font-semibold text-slate-500">Nenhuma ocorrência registrada para a {header.cicomName}.</p>
                      </div>
                    ) : (
                      (occurrences[header.cicomName]).map((occ, idx) => (
                        <div key={idx} className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg relative group">
                          <button
                            onClick={() => handleRemoveOccurrence(idx)}
                            className="absolute top-3 right-3 text-rose-500 hover:bg-rose-100 p-1.5 rounded-md transition-colors cursor-pointer"
                            title="Remover ocorrência"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-12 pr-8">
                              <label className="text-[10px] font-bold text-slate-505 uppercase tracking-wide mb-1 block">Natureza / Descrição Breve</label>
                              <input
                                type="text"
                                value={occ.nature}
                                placeholder="Ex: Homicídio, Roubo a Transeunte..."
                                onChange={(e) => handleOccurrenceFieldChange(idx, 'nature', e.target.value)}
                                list={`nature-list-${header.cicomName}-${idx}`}
                                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                              />
                              <datalist id={`nature-list-${header.cicomName}-${idx}`}>
                                {NATURE_SUGGESTIONS.map((n, i) => <option key={i} value={n} />)}
                              </datalist>
                            </div>
                            <div className="md:col-span-6">
                              <label className="text-[10px] font-bold text-slate-505 uppercase tracking-wide mb-1 block">Nº CIOPS (Opcional)</label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="text"
                                  value={occ.ciops}
                                  placeholder="Ex: 1234567"
                                  disabled={occ.ciopsInProg}
                                  onChange={(e) => handleOccurrenceFieldChange(idx, 'ciops', e.target.value)}
                                  className={`w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 ${occ.ciopsInProg ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
                                />
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 whitespace-nowrap cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={occ.ciopsInProg || false}
                                    onChange={(e) => {
                                      handleOccurrenceFieldChange(idx, 'ciopsInProg', e.target.checked);
                                      if (e.target.checked) handleOccurrenceFieldChange(idx, 'ciops', '');
                                    }}
                                    className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                                  />
                                  Em Andamento
                                </label>
                              </div>
                            </div>
                            <div className="md:col-span-6">
                              <label className="text-[10px] font-bold text-slate-505 uppercase tracking-wide mb-1 block">Nº BO (Opcional)</label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="text"
                                  value={occ.bo}
                                  placeholder="Ex: 23/0456"
                                  disabled={occ.boInProg}
                                  onChange={(e) => handleOccurrenceFieldChange(idx, 'bo', e.target.value)}
                                  className={`w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 ${occ.boInProg ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
                                />
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 whitespace-nowrap cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={occ.boInProg || false}
                                    onChange={(e) => {
                                      handleOccurrenceFieldChange(idx, 'boInProg', e.target.checked);
                                      if (e.target.checked) handleOccurrenceFieldChange(idx, 'bo', '');
                                    }}
                                    className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                                  />
                                  Em Andamento
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-center p-6 rounded-2xl bg-slate-100 border border-slate-200 glass-panel">
              <button
                onClick={handleCopyToClipboardOcc}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                Copiar Resumo TXT
              </button>

              <button
                onClick={handleDownloadOccTXT}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-white hover:bg-slate-50 text-amber-600 border border-slate-350 hover:border-amber-400 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Baixar Resumo TXT
              </button>

              <button
                onClick={handleGenerateOccurrencesPDF}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-slate-700 hover:bg-slate-800 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                Gerar Resumo PDF
              </button>

              <button
                onClick={() => setShowOccClearConfirm(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Limpar Resumo
              </button>

              <button
                onClick={onNavigateHome}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-slate-800 hover:bg-slate-900 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Voltar ao Início
              </button>
            </section>
          </div>
        )
      }

      {
        showOccClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-slide-up border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Atenção
              </h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">Tem certeza que deseja apagar todos os registros de ocorrências da {header.cicomName}? Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowOccClearConfirm(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClearOccurrences}
                  className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Sim, Limpar
                </button>
              </div>
            </div>
          </div>
        )
      }
    </>
  );
}
