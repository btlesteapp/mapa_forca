import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import {
  Copy, Plus, Trash2, CarFront, Users, User, Shield, Calendar, Clock, Phone, IdCard,
  FileCheck, Turntable, CarFrontIcon, AlertTriangle, FileText, Download, MapPin,
  CheckCircle2, ClipboardList
} from 'lucide-react';
import { supabase } from './supabaseClient.js';
import { POLICIAIS } from './data/policiais.js';
import {
  OCCURRENCE_UNITS,
  INITIAL_UNITS,
  getCurrentTurno,
  formatNum,
  NumericCell,
  IncidentListField,
  isAllowedSA,
  formatDateBR,
  formatHourBR,
  INITIAL_HEADER,
  NATURE_SUGGESTIONS
} from './Shared.jsx';

export default function SaLesteMapModule({ showToast, activeTab, logoUrl }) {
  const [header, setHeader] = useState(() => {
    try {
      const saved = localStorage.getItem('mf_header_sa');
      return saved ? JSON.parse(saved) : { ...INITIAL_HEADER, telefone: '(92) 98842-2842' };
    } catch (e) {
      return { ...INITIAL_HEADER, telefone: '(92) 98842-2842' };
    }
  });

  useEffect(() => {
    localStorage.setItem('mf_header_sa', JSON.stringify(header));
  }, [header]);

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
        if (isAllowedSA(p.postoGrad)) {
          newHeader.cpoNome = `${p.postoGrad} ${p.nomeGuerra}`;
        } else {
          showToast(`O policial ${p.nomeGuerra} (${p.postoGrad}) não pode ser SA Leste. Apenas CAP QOPM, 1º/2º TEN QOPM/QOAPM são permitidos.`, 'error');
          newHeader.cpoNome = '';
        }
      } else if (cleanId === '') {
        newHeader.cpoNome = '';
      } else if (cleanId.length === 5) {
        showToast('CI do SA não encontrado! Digite uma CI válida.', 'error');
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
      showToast('CI do SA não encontrado! Digite uma CI válida.', 'error');
      setHeader(prev => ({ ...prev, cpoId: '', cpoNome: '' }));
    }
  };

  // Mapa da Força Table State
  const [units, setUnits] = useState(() => {
    try {
      const saved = localStorage.getItem('mf_units_sa');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((item, index) => ({
          ...INITIAL_UNITS[index],
          ...item,
          id: INITIAL_UNITS[index]?.id
        }));
      }
    } catch (e) { }
    return INITIAL_UNITS;
  });

  // Mapa da Força Alterations states
  const [faltas, setFaltas] = useState(() => {
    try {
      const saved = localStorage.getItem('mf_faltas_sa');
      return saved ? JSON.parse(saved) : ['S/A'];
    } catch (e) { return ['S/A']; }
  });

  const [atrasos, setAtrasos] = useState(() => {
    try {
      const saved = localStorage.getItem('mf_atrasos_sa');
      return saved ? JSON.parse(saved) : ['S/A'];
    } catch (e) { return ['S/A']; }
  });

  const [dispensas, setDispensas] = useState(() => {
    try {
      const saved = localStorage.getItem('mf_dispensas_sa');
      return saved ? JSON.parse(saved) : ['S/A'];
    } catch (e) { return ['S/A']; }
  });

  // Resumo de Ocorrencias State
  const [occurrences, setOccurrences] = useState(() => {
    try {
      const saved = localStorage.getItem('mf_occurrences_sa');
      if (saved && saved !== 'null' && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) { }
    const initial = {};
    OCCURRENCE_UNITS.forEach(u => {
      initial[u.id] = [];
    });
    return initial;
  });

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showOccClearConfirm, setShowOccClearConfirm] = useState(false);

  // Sync states to local storage
  useEffect(() => {
    localStorage.setItem('mf_units_sa', JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem('mf_faltas_sa', JSON.stringify(faltas));
  }, [faltas]);

  useEffect(() => {
    localStorage.setItem('mf_atrasos_sa', JSON.stringify(atrasos));
  }, [atrasos]);

  useEffect(() => {
    localStorage.setItem('mf_dispensas_sa', JSON.stringify(dispensas));
  }, [dispensas]);

  useEffect(() => {
    localStorage.setItem('mf_occurrences_sa', JSON.stringify(occurrences));
  }, [occurrences]);

  const handleUnitChange = (id, field, value) => {
    setUnits(prev => prev.map(u => {
      if (u.id === id) {
        if (['vtrOrd', 'vtrSeg', 'pmOrd', 'pmSeg'].includes(field)) {
          const parsed = parseInt(value, 10);
          return { ...u, [field]: isNaN(parsed) ? 0 : parsed };
        }

        let newUnit = { ...u, [field]: value };

        if (field === 'supervisorId') {
          const cleanId = value.toString().trim();
          const p = POLICIAIS.find(x => x.rg.toString().trim() === cleanId);
          if (p) {
            newUnit.supervisor = `${p.postoGrad} ${p.nomeGuerra}`;
          } else if (cleanId === '') {
            newUnit.supervisor = '';
          } else if (cleanId.length === 5) {
            showToast('CI do SSA não encontrado! Digite uma CI válida.', 'error');
            newUnit.supervisor = '';
          }
        }

        return newUnit;
      }
      return u;
    }));
  };

  const handleUnitIdBlur = (unitId) => {
    setUnits(prev => prev.map(u => {
      if (u.id === unitId) {
        const cleanId = (u.supervisorId || '').toString().trim();
        if (cleanId === '') return u;
        const p = POLICIAIS.find(x => x.rg.toString().trim() === cleanId);
        if (!p) {
          showToast('CI do SSA não encontrado! Digite uma CI válida.', 'error');
          return { ...u, supervisorId: '', supervisor: '' };
        }
      }
      return u;
    }));
  };

  const handleSyncFromCicom = async () => {
    if (showToast) showToast('Sincronizando do servidor...', 'info');

    const { data: serverMapas, error } = await supabase
      .from('mapas_diarios')
      .select('*')
      .eq('data_registro', header.data)
      .eq('turno', header.turno);

    if (error) {
      console.error(error);
      if (showToast) showToast('Erro ao sincronizar.', 'error');
      return;
    }

    const cicomMap = {
      '4-cicom': '4ª CICOM',
      '9-cicom': '9ª CICOM',
      '11-cicom': '11ª CICOM',
      '14-cicom': '14ª CICOM',
      '25-cicom': '25ª CICOM',
      '28-cicom': '28ª CICOM',
      '29-cicom': '29ª CICOM',
      '30-cicom': '30ª CICOM'
    };

    setUnits(prev => prev.map(u => {
      if (u.isHQ || !cicomMap[u.id]) return u;

      const cicomName = cicomMap[u.id];
      const serverMapa = serverMapas?.find(m => m.cicom_name === cicomName);

      let newUnit = { ...u };

      if (serverMapa) {
        const h = serverMapa.header_payload || {};
        const d = serverMapa.mapa_payload || {};

        if (h.cpoId) {
          const cleanId = h.cpoId.toString().trim();
          newUnit.supervisorId = cleanId;
          const p = POLICIAIS.find(x => x.rg.toString().trim() === cleanId);
          if (p) {
            newUnit.supervisor = `${p.postoGrad} ${p.nomeGuerra}`;
          } else {
            newUnit.supervisor = h.cpoNome || '';
          }
        }

        if (d.vtrs && Array.isArray(d.vtrs)) {
          let vtrOrdCount = 0;
          let vtrSegCount = 0;
          let pmOrdCount = 0;
          let pmSegCount = 0;

          d.vtrs.forEach(vtr => {
            const isSeg = vtr.tipo === 'SEG';
            
            if (isSeg) {
              vtrSegCount++;
              if (vtr.cmt?.nome) pmSegCount++;
              if (vtr.mot?.nome) pmSegCount++;
            } else {
              vtrOrdCount++;
              if (vtr.cmt?.nome) pmOrdCount++;
              if (vtr.mot?.nome) pmOrdCount++;
            }
          });

          newUnit.vtrOrd = vtrOrdCount;
          newUnit.vtrSeg = vtrSegCount;
          newUnit.pmOrd = pmOrdCount;
          newUnit.pmSeg = pmSegCount;
        }

        const vtrsNaoMontadas = parseInt(d.resumo?.totalVtrsNaoMontadas) || 0;
        newUnit.vtrBaixada = vtrsNaoMontadas;
        
        const totalAdmin = parseInt(d.servicoInterno?.totalAdmin) || 0;
        const permanencia = parseInt(d.servicoInterno?.permanenciaReserva) || 0;
        newUnit.adm = totalAdmin + permanencia;
      }

      return newUnit;
    }));

    if (showToast) showToast('Sincronizado com o servidor!', 'success');
  };

  const handleAddIncidentItem = (category) => {
    const processList = (list) => {
      if (list.length === 1 && list[0] === 'S/A') {
        return [''];
      }
      return [...list, ''];
    };

    if (category === 'faltas') setFaltas(processList(faltas));
    if (category === 'atrasos') setAtrasos(processList(atrasos));
    if (category === 'dispensas') setDispensas(processList(dispensas));
  };

  const handleRemoveIncidentItem = (category, index) => {
    let list = category === 'faltas' ? faltas : category === 'atrasos' ? atrasos : dispensas;
    const newList = list.filter((_, i) => i !== index);
    const finalized = newList.length === 0 ? ['S/A'] : newList;

    if (category === 'faltas') setFaltas(finalized);
    if (category === 'atrasos') setAtrasos(finalized);
    if (category === 'dispensas') setDispensas(finalized);
  };

  const handleIncidentItemChange = (category, index, value) => {
    let list = [...(category === 'faltas' ? faltas : category === 'atrasos' ? atrasos : dispensas)];
    list[index] = value;
    if (category === 'faltas') setFaltas(list);
    if (category === 'atrasos') setAtrasos(list);
    if (category === 'dispensas') setDispensas(list);
  };

  const handleClearAll = () => {
    setHeader({
      data: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      turno: getCurrentTurno(),
      customTurno: '',
      cpoNome: '',
      cpoId: '',
      telefone: '(92) 98842-2842',
      vtrSa: ''
    });
    setUnits(INITIAL_UNITS);
    setFaltas(['S/A']);
    setAtrasos(['S/A']);
    setDispensas(['S/A']);
    setShowClearConfirm(false);
    showToast('Formulário limpo com sucesso!', 'info');
  };

  const handleClearOccurrences = () => {
    const cleared = {};
    OCCURRENCE_UNITS.forEach(u => {
      cleared[u.id] = [];
    });
    setOccurrences(cleared);
    setShowOccClearConfirm(false);
    showToast('Todas as ocorrências foram limpas.', 'info');
  };

  const handleAddOccurrence = (unitId) => {
    setOccurrences(prev => ({
      ...prev,
      [unitId]: [
        ...(prev[unitId] || []),
        { nature: '', ciops: '', bo: '', ciopsInProg: false, boInProg: false }
      ]
    }));
  };

  const handleRemoveOccurrence = (unitId, index) => {
    setOccurrences(prev => ({
      ...prev,
      [unitId]: (prev[unitId] || []).filter((_, i) => i !== index)
    }));
  };

  const handleOccurrenceFieldChange = (unitId, index, field, value) => {
    setOccurrences(prev => {
      const list = [...(prev[unitId] || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [unitId]: list };
    });
  };

  const getTurnoText = () => {
    if (header.turno === '1º TURNO') {
      return '1º TURNO - 07h às 19h';
    }
    if (header.turno === '2º TURNO') {
      return '2º TURNO - 19h às 07h';
    }
    return header.turno;
  };

  // ----------------------------------------------------
  // REPORT 1: MAPA DA FORÇA GENERATORS (TXT & PDF)
  // ----------------------------------------------------

  const totalVtrOrd = units.reduce((acc, c) => acc + c.vtrOrd, 0);
  const totalVtrSeg = units.reduce((acc, c) => acc + c.vtrSeg, 0);
  const grandTotalViaturas = totalVtrOrd + totalVtrSeg;

  const totalPmOrd = units.reduce((acc, c) => acc + c.pmOrd, 0);
  const totalPmSeg = units.reduce((acc, c) => acc + c.pmSeg, 0);
  const grandTotalEfetivo = totalPmOrd + totalPmSeg;

  const formatIncidentText = (arr) => {
    const filtered = arr.map(i => i.trim()).filter(i => i !== '' && i.toUpperCase() !== 'S/A');
    if (filtered.length === 0) return 'S/A';
    return filtered.join(', ');
  };

  const generateTXTString = (currentTimeOverride) => {
    const dateFormatted = formatDateBR(header.data);
    const timeFormatted = formatHourBR(currentTimeOverride || header.hora);
    const turnoText = getTurnoText();

    const lines = [];
    lines.push('*MAPA DA FORÇA - CPA LESTE*');
    lines.push(`*BATALHÃO LESTE - ${dateFormatted} ${timeFormatted}*`);
    lines.push(`*${turnoText}*`);
    lines.push('');
    lines.push(`*SA LESTE: ${header.cpoNome.toUpperCase().trim() || 'SEM IDENTIFICAÇÃO'} (${header.cpoId.trim() || 'N/C'})*`);
    const vtrText = header.vtrSa ? ` - VTR ${header.vtrSa.toUpperCase().trim()}` : '';
    lines.push(`*TEL: ${header.telefone || 'N/I'}${vtrText}*`);
    lines.push('_________________________');
    lines.push('');
    lines.push('*SUPERVISORES DE SUBÁREAS*');

    units.forEach(u => {
      if (u.id !== 'cpa-leste') {
        const nameVal = u.supervisor ? u.supervisor.toUpperCase().trim() : 'S/A';
        const idVal = u.supervisorId ? `(${u.supervisorId.trim()})` : '';
        const ssaName = u.name.replace('', '');
        lines.push(`${ssaName}: ${nameVal}${idVal}`);
      }
    });

    lines.push('_________________________');
    lines.push('');
    lines.push('*VIATURAS MONTADAS*');

    units.forEach(u => {
      const vtrTotal = u.vtrOrd + u.vtrSeg;
      const paddedTotal = formatNum(vtrTotal);

      if (u.vtrSeg > 0) {
        lines.push(`${u.name}: ${paddedTotal} (ORD ${formatNum(u.vtrOrd)} + SEG ${formatNum(u.vtrSeg)})`);
      } else {
        lines.push(`${u.name}: ${paddedTotal}`);
      }
    });

    lines.push('_________________________');
    lines.push('');
    lines.push(`*TOTAL DE VIATURAS: ${grandTotalViaturas}*`);
    lines.push('_________________________');
    lines.push('');
    lines.push('*EFETIVO*');

    units.forEach(u => {
      const pmTotal = u.pmOrd + u.pmSeg;
      const paddedTotal = formatNum(pmTotal);

      if (u.pmSeg > 0) {
        lines.push(`${u.name}: ${paddedTotal} (ORD ${formatNum(u.pmOrd)} + SEG ${formatNum(u.pmSeg)})`);
      } else {
        lines.push(`${u.name}: ${paddedTotal}`);
      }
    });

    lines.push('_________________________');
    lines.push('');
    lines.push(`*TOTAL DE PM's: ${grandTotalEfetivo}*`);
    lines.push('_________________________');
    lines.push('');
    lines.push(`*FALTAS: ${formatIncidentText(faltas)}*`);
    lines.push(`*ATRASOS: ${formatIncidentText(atrasos)}*`);
    lines.push(`*DISPENSAS: ${formatIncidentText(dispensas)}*`);
    lines.push('_________________________');
    lines.push('');
    lines.push('*Bom serviço a todos!*');
    lines.push('*"Que Deus nos proteja em mais um dia de serviço"*');
    lines.push('');
    lines.push('*"BATALHÃO LESTE - CONQUISTAR E MANTER!"*');

    return lines.join('\n');
  };

  const handleGeneratePDF = async () => {
    const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setHeader(prev => ({ ...prev, hora: currentTime }));
    showToast('Gerando documento PDF...', 'info');
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const navyDark = [8, 12, 24];
      const navyBlue = [27, 38, 79];
      const textDark = [30, 41, 59];
      const grayLight = [248, 250, 252];
      const borderGray = [226, 232, 240];

      // A4 page boundaries
      doc.setDrawColor(...navyBlue);
      doc.setLineWidth(0.4);
      doc.rect(6, 6, 198, 285);

      // Header Banner
      doc.setFillColor(...navyDark);
      doc.rect(6, 6, 198, 24, 'F');

      if (logoUrl) {
        try {
          doc.addImage(logoUrl, 'PNG', 12, 8, 16, 20);
        } catch (logoErr) {
          console.warn("Could not insert logo image into PDF.", logoErr);
        }
      }

      // Center-aligned Header Texts
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
      doc.text("MAPA DA FORÇA", 105, 22, { align: "center" });

      // Metadata Header Info
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

      const saNameText = header.cpoNome ? header.cpoNome.toUpperCase() : 'SEM IDENTIFICAÇÃO';
      const saIdText = header.cpoId ? header.cpoId : 'N/C';
      doc.text(`Supervisor de Área (SA Leste): ${saNameText}`, 85, 45);
      doc.text(`Matrícula / ID: ${saIdText}`, 85, 50);
      doc.text(`Telefone de Plantão: ${header.telefone || 'N/I'}`, 85, 55);

      // Main Data Table Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("DISTRIBUIÇÃO DE EFETIVO ORDINÁRIO E SEG POR CICOM", 12, 65);
      doc.line(12, 67, 198, 67);

      const tableYStart = 71;
      const colX = {
        unidade: 12,
        supervisor: 35,
        id: 78,
        vtrOrd: 93,
        vtrSeg: 110,
        vtrTotal: 127,
        pmOrd: 144,
        pmSeg: 161,
        pmTotal: 178
      };

      doc.setFillColor(...navyBlue);
      doc.rect(12, tableYStart, 186, 7, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text("UNIDADE", colX.unidade + 2, tableYStart + 4.5);
      doc.text("SUPERVISOR (SSA)", colX.supervisor + 2, tableYStart + 4.5);
      doc.text("CI", colX.id + 2, tableYStart + 4.5);
      doc.text("VTR ORD", colX.vtrOrd + 8.5, tableYStart + 4.5, { align: "center" });
      doc.text("VTR SEG", colX.vtrSeg + 8.5, tableYStart + 4.5, { align: "center" });
      doc.text("VTR Total", colX.vtrTotal + 8.5, tableYStart + 4.5, { align: "center" });
      doc.text("PM ORD", colX.pmOrd + 8.5, tableYStart + 4.5, { align: "center" });
      doc.text("PM SEG", colX.pmSeg + 8.5, tableYStart + 4.5, { align: "center" });
      doc.text("PM Total", colX.pmTotal + 10, tableYStart + 4.5, { align: "center" });

      let currentY = tableYStart + 7;
      doc.setTextColor(...textDark);

      units.forEach((u, idx) => {
        if (idx % 2 === 1) {
          doc.setFillColor(...grayLight);
          doc.rect(12, currentY, 186, 6.5, 'F');
        }

        doc.setDrawColor(...borderGray);
        doc.line(12, currentY + 6.5, 198, currentY + 6.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);

        let nameField = u.supervisor;
        let idField = u.supervisorId;
        if (u.isHQ) {
          nameField = header.cpoNome;
          idField = header.cpoId;
        }

        const supervisorDisplay = u.isHQ ? 'SA LESTE (CPO)' : (nameField ? nameField.toUpperCase() : 'S/A');
        const idDisplay = idField || '-';

        doc.text(u.name, colX.unidade + 2, currentY + 4.5);
        doc.text(supervisorDisplay, colX.supervisor + 2, currentY + 4.5);
        doc.text(idDisplay, colX.id + 2, currentY + 4.5);

        // Centered numeric column output
        doc.text(formatNum(u.vtrOrd), colX.vtrOrd + 8.5, currentY + 4.5, { align: "center" });
        doc.text(formatNum(u.vtrSeg), colX.vtrSeg + 8.5, currentY + 4.5, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.text(formatNum(u.vtrOrd + u.vtrSeg), colX.vtrTotal + 8.5, currentY + 4.5, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.text(formatNum(u.pmOrd), colX.pmOrd + 8.5, currentY + 4.5, { align: "center" });
        doc.text(formatNum(u.pmSeg), colX.pmSeg + 8.5, currentY + 4.5, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.text(formatNum(u.pmOrd + u.pmSeg), colX.pmTotal + 10, currentY + 4.5, { align: "center" });

        currentY += 6.5;
      });

      // Total Geral Row inside PDF Table
      doc.setFillColor(230, 235, 245);
      doc.rect(12, currentY, 186, 7.5, 'F');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("TOTAL GERAL", colX.unidade + 2, currentY + 5);

      doc.text(formatNum(totalVtrOrd), colX.vtrOrd + 8.5, currentY + 5, { align: "center" });
      doc.text(formatNum(totalVtrSeg), colX.vtrSeg + 8.5, currentY + 5, { align: "center" });

      doc.setTextColor(220, 140, 20);
      doc.text(formatNum(grandTotalViaturas), colX.vtrTotal + 8.5, currentY + 5, { align: "center" });
      doc.setTextColor(...textDark);

      doc.text(formatNum(totalPmOrd), colX.pmOrd + 8.5, currentY + 5, { align: "center" });
      doc.text(formatNum(totalPmSeg), colX.pmSeg + 8.5, currentY + 5, { align: "center" });

      doc.setTextColor(220, 140, 20);
      doc.text(formatNum(grandTotalEfetivo), colX.pmTotal + 10, currentY + 5, { align: "center" });
      doc.setTextColor(...textDark);

      // Table Outline
      doc.setDrawColor(...navyBlue);
      doc.setLineWidth(0.3);
      doc.rect(12, tableYStart, 186, currentY - tableYStart + 7.5);

      currentY += 15;

      // Incidents Operational events
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("ALTERAÇÕES E EVENTUALIDADES OPERACIONAIS", 12, currentY);
      doc.line(12, currentY + 2, 198, currentY + 2);

      currentY += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`Faltas de Efetivo: ${formatIncidentText(faltas)}`, 14, currentY);
      doc.text(`Atrasos Registrados: ${formatIncidentText(atrasos)}`, 14, currentY + 5.5);
      doc.text(`Dispensas Justificadas: ${formatIncidentText(dispensas)}`, 14, currentY + 11);

      // Footer message
      currentY += 30;
      doc.setFont("helvetica", "bolditalic");
      doc.setFontSize(9);
      doc.setTextColor(...navyBlue);
      doc.text("* BOM SERVIÇO A TODOS! *", 82, currentY);

      const fileDate = header.data ? header.data.replace(/-/g, '_') : 'data';
      doc.save(`MAPA_DA_FORCA_${fileDate}.pdf`);
      showToast('Relatório PDF exportado com sucesso!');
    } catch (e) {
      console.error(e);
      showToast('Erro ao exportar relatório em PDF.', 'error');
    }
  };

  const handleCopyToClipboard = () => {
    try {
      const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setHeader(prev => ({ ...prev, hora: currentTime }));
      const text = generateTXTString(currentTime);
      navigator.clipboard.writeText(text);
      showToast('Mapa da Força copiado para a área de transferência!');
    } catch (err) {
      console.error(err);
      showToast('Falha ao copiar mapa.', 'error');
    }
  };

  const handleDownloadTXT = () => {
    try {
      const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setHeader(prev => ({ ...prev, hora: currentTime }));
      const text = generateTXTString(currentTime);
      const element = document.createElement("a");
      const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      const dateFormatted = header.data ? header.data.replace(/-/g, '_') : 'mapa';
      element.download = `MAPA_DA_FORCA_${dateFormatted}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      showToast('TXT do mapa baixado com sucesso!');
    } catch (err) {
      console.error(err);
      showToast('Erro ao baixar TXT do mapa.', 'error');
    }
  };

  // ----------------------------------------------------
  // REPORT 2: RESUMO DE OCORRÊNCIAS GENERATORS (TXT & PDF)
  // ----------------------------------------------------

  const formatSingleOccurrence = (occ) => {
    const nature = occ.nature.trim() || 'Ocorrência de relevo';
    const ciopsVal = occ.ciopsInProg ? 'Ocorrência em Andamento, aguardando numeral' : occ.ciops.trim();
    const boVal = occ.boInProg ? 'Ocorrência em Andamento, aguardando numeral' : occ.bo.trim();

    let result = `• ${nature}`;

    if (ciopsVal && boVal) {
      result += `, Nº CIOPS: ${ciopsVal}. Nº BO: ${boVal}`;
    } else if (ciopsVal) {
      result += `, Nº CIOPS: ${ciopsVal}`;
    } else if (boVal) {
      result += `, Nº BO: ${boVal}`;
    }

    if (!result.endsWith('.')) {
      result += '.';
    }
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
    lines.push(`*SA LESTE: ${header.cpoNome.toUpperCase().trim() || 'SEM IDENTIFICAÇÃO'}*`);
    lines.push('');

    OCCURRENCE_UNITS.forEach(unit => {
      lines.push(`*${unit.name}:*`);
      const list = occurrences[unit.id] || [];
      const activeOccs = list.filter(o => o.nature.trim() !== '');

      if (activeOccs.length === 0) {
        lines.push('Sem ocorrência de grande vulto.');
      } else {
        activeOccs.forEach(o => {
          lines.push(formatSingleOccurrence(o));
        });
      }
    });

    lines.push('');
    lines.push('*BOA FOLGA E BOM SERVIÇO A TODOS*');
    lines.push('');
    lines.push('*BATALHÃO LESTE: CONQUISTAR E MANTER*');

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
      element.download = `RESUMO_DE_OCORRENCIAS_${dateFormatted}.txt`;
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
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const navyDark = [8, 12, 24];
      const navyBlue = [27, 38, 79];
      const textDark = [30, 41, 59];
      const borderGray = [226, 232, 240];

      // Margem e borda
      doc.setDrawColor(...navyBlue);
      doc.setLineWidth(0.4);
      doc.rect(6, 6, 198, 285);

      // Header Banner
      doc.setFillColor(...navyDark);
      doc.rect(6, 6, 198, 24, 'F');

      if (logoUrl) {
        try {
          doc.addImage(logoUrl, 'PNG', 12, 8, 16, 20);
        } catch (logoErr) {
          console.warn("Could not insert logo image into PDF.", logoErr);
        }
      }

      // Center-aligned Header Texts
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
      doc.text("RESUMO DE OCORRÊNCIAS", 105, 22, { align: "center" });

      // Metadata Header Info
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

      const saNameText = header.cpoNome ? header.cpoNome.toUpperCase() : 'SEM IDENTIFICAÇÃO';
      const saIdText = header.cpoId ? header.cpoId : 'N/C';
      doc.text(`Supervisor de Área (SA Leste): ${saNameText}`, 85, 45);
      doc.text(`Matrícula / ID: ${saIdText}`, 85, 50);
      doc.text(`Telefone de Plantão: ${header.telefone || 'N/I'}`, 85, 55);

      // Section title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("RESUMO OPERACIONAL DE OCORRÊNCIAS DE RELEVO", 12, 65);
      doc.line(12, 67, 198, 67);

      let currentY = 72;
      doc.setTextColor(...textDark);

      OCCURRENCE_UNITS.forEach(unit => {
        if (currentY > 265) {
          doc.addPage();
          doc.setDrawColor(...navyBlue);
          doc.setLineWidth(0.4);
          doc.rect(6, 6, 198, 285);
          currentY = 15;
        }

        doc.setFillColor(240, 244, 248);
        doc.rect(12, currentY, 186, 5.5, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...navyDark);
        doc.text(`${unit.name}`, 14, currentY + 4);

        currentY += 5.5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...textDark);

        const list = occurrences[unit.id] || [];
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

        currentY += 1.5;
      });

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
      doc.text("* BATALHÃO LESTE: CONQUISTAR E MANTER *", 105, currentY + 5, { align: "center" });

      const fileDate = header.data ? header.data.replace(/-/g, '_') : 'data';
      doc.save(`RESUMO_DE_OCORRENCIAS_${fileDate}.pdf`);
      showToast('PDF de ocorrências exportado com sucesso!');
    } catch (e) {
      console.error(e);
      showToast('Erro ao exportar resumo em PDF.', 'error');
    }
  };

  return (
    <>
      <div className="w-full mb-8">
        <section className="glass-panel p-6 rounded-2xl glow-accent">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6">
            <FileCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800 tracking-wide uppercase">
              Dados do SA(CPO) LESTE
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. CI */}
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

            {/* 2. SUPERVISOR */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-505 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" /> Supervisor de ÁREA
              </label>
              <input
                type="text"
                placeholder="Nome de Guerra (Autopreenchido)"
                value={header.cpoNome}
                readOnly
                className="glass-input px-3 py-2 text-sm rounded-lg bg-slate-100 text-slate-600 font-bold border-slate-200 outline-none cursor-not-allowed"
              />
            </div>

            {/* 3. TURNO */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-505 uppercase tracking-wider flex items-center gap-1.5">
                <Turntable className="w-3.5 h-3.5 text-blue-600" /> Turno
              </label>
              <select
                value={header.turno}
                onChange={(e) => setHeader(prev => ({ ...prev, turno: e.target.value }))}
                className="glass-input px-3 py-2 text-sm rounded-lg cursor-pointer"
              >
                <option value="1º TURNO">1º TURNO</option>
                <option value="2º TURNO">2º TURNO</option>
              </select>
            </div>

            {/* 4. VTR SA */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-505 uppercase tracking-wider flex items-center gap-1.5">
                <CarFrontIcon className="w-3.5 h-3.5 text-blue-600" /> VTR SA
              </label>
              <input
                type="text"
                placeholder="Ex: 25-1006"
                value={header.vtrSa || ''}
                onChange={(e) => setHeader(prev => ({ ...prev, vtrSa: e.target.value }))}
                className="glass-input px-3 py-2 text-sm rounded-lg placeholder-slate-400"
              />
            </div>

            {/* 5. TELEFONE PLANTÃO */}
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

            {/* 6. DATA */}
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

            {/* 7. HORA DO REGISTRO */}
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
        </section>
      </div>

      {activeTab === 'mapa' && (
        <>
          {/* Running KPIs Totals */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-amber-600 shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Viaturas Montadas</span>
                <span className="text-3xl font-black text-slate-800 mt-1 block">{formatNum(grandTotalViaturas)}</span>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 text-amber-700">
                <CarFront className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-blue-600 shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Efetivo de Serviço</span>
                <span className="text-3xl font-black text-slate-800 mt-1 block">{formatNum(grandTotalEfetivo)} PMs</span>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 text-blue-700">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-slate-500 shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Subáreas Cobertas</span>
                <span className="text-3xl font-black text-slate-800 mt-1 block">08 Unidades</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-100 text-slate-505">
                <MapPin className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-emerald-500 shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Conexão Local</span>
                <span className="text-lg font-bold text-emerald-600 mt-1 block">Operação Offline OK</span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </section>

          {/* Interactive Grid Table */}
          <section className="glass-panel rounded-2xl overflow-hidden shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800 tracking-wide uppercase">MONTAGEM DO EFETIVO DO MAPA DA FORÇA - BATALHÃO LESTE</h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSyncFromCicom}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Sincronizar Dados (Nuvem)
                </button>
                <span className="text-xs font-medium text-slate-505 italic hidden sm:block">Preenchimento de Efetivos e Viaturas</span>
              </div>
            </div>

            {/* tELA DE LISTAGEM  VTR E PMS */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-[#1b264f] text-white text-xs font-bold uppercase tracking-wider border-b border-slate-350">
                    <th className="py-3.5 px-4 w-[14%] border-r border-white/5">UNIDADE</th>
                    <th className="py-3.5 px-4 w-[24%] border-r border-white/5">SUPERVISOR (SSA)</th>
                    <th className="py-3.5 px-4 w-[11%] border-r border-white/5">CI</th>
                    <th className="py-3.5 px-4 w-[8%] text-center border-r border-white/5">VTR ORD</th>
                    <th className="py-3.5 px-4 w-[8%] text-center border-r border-white/5">VTR SEG</th>
                    <th className="py-3.5 px-4 w-[9%] text-center border-r border-white/5 font-bold">VTR Total</th>
                    <th className="py-3.5 px-4 w-[8%] text-center border-r border-white/5">PM ORD</th>
                    <th className="py-3.5 px-4 w-[8%] text-center border-r border-white/5">PM SEG</th>
                    <th className="py-3.5 px-4 w-[10%] text-center font-bold">PM Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 text-sm">
                  {units.map((unit, idx) => {
                    const vtrTotal = unit.vtrOrd + unit.vtrSeg;
                    const pmTotal = unit.pmOrd + unit.pmSeg;

                    return (
                      <tr
                        key={unit.id}
                        className={`hover:bg-slate-50/70 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'} ${unit.isHQ ? 'bg-blue-50/20 font-semibold' : ''}`}
                      >
                        <td className="py-2.5 px-4 font-bold text-slate-800 border-r border-slate-100">
                          <div className="flex items-center justify-center gap-2">
                            <img
                              src={`./logos/${unit.id}.png`}
                              alt={`Logo ${unit.name}`}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                              }}
                            />
                            <span>{unit.name}</span>
                          </div>
                        </td>

                        <td className="py-2.5 px-4 border-r border-slate-100">
                          <input
                            type="text"
                            placeholder={unit.isHQ ? "SA LESTE (CPO)" : "Nome de Guerra"}
                            value={unit.isHQ ? (header.cpoNome ? `${header.cpoNome.toUpperCase()} (CPO)` : 'SA LESTE (CPO)') : unit.supervisor}
                            onChange={(e) => handleUnitChange(unit.id, 'supervisor', e.target.value)}
                            readOnly={unit.isHQ}
                            className={`w-full px-3 py-1.5 text-xs rounded border outline-none transition-all ${unit.isHQ ? 'bg-slate-100 text-slate-500 font-bold border-slate-200 cursor-not-allowed' : 'border-slate-350 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-800'}`}
                          />
                        </td>

                        <td className="py-2.5 px-4 border-r border-slate-100">
                          <input
                            type="text"
                            placeholder="CI"
                            value={unit.isHQ ? header.cpoId : unit.supervisorId}
                            onChange={(e) => handleUnitChange(unit.id, 'supervisorId', e.target.value.replace(/\D/g, '').slice(0, 5))}
                            onBlur={() => !unit.isHQ && handleUnitIdBlur(unit.id)}
                            maxLength={5}
                            disabled={unit.isHQ}
                            className={`w-full px-3 py-1.5 text-xs rounded border text-center outline-none transition-all ${unit.isHQ ? 'bg-slate-100 text-slate-500 font-bold border-slate-200 cursor-not-allowed' : 'border-slate-350 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-800'}`}
                          />
                        </td>

                        <td className="py-2.5 px-4 text-center border-r border-slate-100">
                          <NumericCell value={unit.vtrOrd} onChange={(val) => handleUnitChange(unit.id, 'vtrOrd', val)} />
                        </td>

                        <td className="py-2.5 px-4 text-center border-r border-slate-100">
                          <NumericCell value={unit.vtrSeg} onChange={(val) => handleUnitChange(unit.id, 'vtrSeg', val)} />
                        </td>

                        <td className="py-2.5 px-4 text-center text-sm font-extrabold text-slate-900 bg-slate-50/40 border-r border-slate-100">
                          {formatNum(vtrTotal)}
                        </td>

                        <td className="py-2.5 px-4 text-center border-r border-slate-100">
                          <NumericCell value={unit.pmOrd} onChange={(val) => handleUnitChange(unit.id, 'pmOrd', val)} />
                        </td>

                        <td className="py-2.5 px-4 text-center border-r border-slate-100">
                          <NumericCell value={unit.pmSeg} onChange={(val) => handleUnitChange(unit.id, 'pmSeg', val)} />
                        </td>

                        <td className="py-2.5 px-4 text-center text-sm font-extrabold text-slate-900 bg-slate-50/40">
                          {formatNum(pmTotal)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* TOTAL GERAL ROW */}
                  <tr className="bg-slate-100 border-t border-slate-300 font-black text-slate-900">
                    <td className="py-3 px-4 text-sm" colSpan={3}>TOTAL GERAL</td>
                    <td className="py-3 px-4 text-center text-sm">{formatNum(totalVtrOrd)}</td>
                    <td className="py-3 px-4 text-center text-sm">{formatNum(totalVtrSeg)}</td>
                    <td className="py-3 px-4 text-center text-sm text-amber-600 font-black">{formatNum(grandTotalViaturas)}</td>
                    <td className="py-3 px-4 text-center text-sm">{formatNum(totalPmOrd)}</td>
                    <td className="py-3 px-4 text-center text-sm">{formatNum(totalPmSeg)}</td>
                    <td className="py-3 px-4 text-center text-sm text-amber-600 font-black">{formatNum(grandTotalEfetivo)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="grid grid-cols-1 gap-6 p-4 md:hidden">
              {units.map((unit) => {
                const vtrTotal = unit.vtrOrd + unit.vtrSeg;
                const pmTotal = unit.pmOrd + unit.pmSeg;

                return (
                  <div
                    key={unit.id}
                    className={`p-4 rounded-xl border flex flex-col gap-4 ${unit.isHQ ? 'bg-blue-50/30 border-blue-200' : 'bg-white border-slate-200'}`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                        {unit.isHQ && <Shield className="w-4 h-4 text-blue-600" />}
                        {unit.name}
                      </span>
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                        {unit.isHQ ? 'QG Batalhão' : 'Subárea'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-505 uppercase">Supervisor</label>
                        <input
                          type="text"
                          placeholder={unit.isHQ ? "SA LESTE (CPO)" : "Nome de Guerra"}
                          value={unit.isHQ ? (header.cpoNome ? `${header.cpoNome.toUpperCase()} (CPO)` : 'SA LESTE (CPO)') : unit.supervisor}
                          onChange={(e) => handleUnitChange(unit.id, 'supervisor', e.target.value)}
                          readOnly={unit.isHQ}
                          className={`px-3 py-1.5 text-xs rounded border outline-none ${unit.isHQ ? 'bg-slate-100 text-slate-505 font-bold border-slate-200 cursor-not-allowed' : 'border-slate-350 focus:border-blue-500 bg-white text-slate-800'}`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-505 uppercase">CI / Matrícula</label>
                        <input
                          type="text"
                          value={unit.isHQ ? header.cpoId : unit.supervisorId}
                          onChange={(e) => handleUnitChange(unit.id, 'supervisorId', e.target.value.replace(/\D/g, '').slice(0, 5))}
                          onBlur={() => !unit.isHQ && handleUnitIdBlur(unit.id)}
                          maxLength={5}
                          disabled={unit.isHQ}
                          className={`px-3 py-1.5 text-xs rounded border text-center outline-none ${unit.isHQ ? 'bg-slate-100 text-slate-505 border-slate-200 cursor-not-allowed' : 'border-slate-350 focus:border-blue-500 bg-white text-slate-800'}`}
                        />
                      </div>
                    </div>

                    {/* Viaturas */}
                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Viaturas (VTRs)</span>
                        <span className="text-xs font-black text-slate-800">Total: {formatNum(vtrTotal)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1 items-center">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">ORD</label>
                          <NumericCell value={unit.vtrOrd} onChange={(val) => handleUnitChange(unit.id, 'vtrOrd', val)} />
                        </div>
                        <div className="flex flex-col gap-1 items-center">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">SEG</label>
                          <NumericCell value={unit.vtrSeg} onChange={(val) => handleUnitChange(unit.id, 'vtrSeg', val)} />
                        </div>
                      </div>
                    </div>

                    {/* Efetivo */}
                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Efetivo (PMs)</span>
                        <span className="text-xs font-black text-slate-800">Total: {formatNum(pmTotal)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1 items-center">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">ORD</label>
                          <NumericCell value={unit.pmOrd} onChange={(val) => handleUnitChange(unit.id, 'pmOrd', val)} />
                        </div>
                        <div className="flex flex-col gap-1 items-center">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">SEG</label>
                          <NumericCell value={unit.pmSeg} onChange={(val) => handleUnitChange(unit.id, 'pmSeg', val)} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Incidents / Alterations Section */}
          <section className="glass-panel p-6 rounded-2xl glow-accent">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6">
              <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
              <h2 className="text-lg font-bold text-slate-800 tracking-wide uppercase">Alterações / Ocorrências de Serviço</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <IncidentListField
                label="Faltas de Efetivo (Ex: Nome/ID)"
                items={faltas}
                placeholder="EX: SD STIVE FULANO (123456) - OPM"
                onAdd={() => handleAddIncidentItem('faltas')}
                onChange={(idx, val) => handleIncidentItemChange('faltas', idx, val)}
                onRemove={(idx) => handleRemoveIncidentItem('faltas', idx)}
              />
              <IncidentListField
                label="Atrasos de Serviço"
                items={atrasos}
                placeholder="EX: SD STIVE FULANO (123456) - OPM"
                onAdd={() => handleAddIncidentItem('atrasos')}
                onChange={(idx, val) => handleIncidentItemChange('atrasos', idx, val)}
                onRemove={(idx) => handleRemoveIncidentItem('atrasos', idx)}
              />
              <IncidentListField
                label="Dispensas do Turno"
                items={dispensas}
                placeholder="EX: SD STIVE FULANO (123456) - OPM"
                onAdd={() => handleAddIncidentItem('dispensas')}
                onChange={(idx, val) => handleIncidentItemChange('dispensas', idx, val)}
                onRemove={(idx) => handleRemoveIncidentItem('dispensas', idx)}
              />
            </div>
          </section>

          {/* Tab 1 Actions Panel */}
          <section className="flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-center p-6 rounded-2xl bg-slate-100 border border-slate-200 glass-panel">
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

            <button
              onClick={handleGeneratePDF}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Gerar Relatório PDF
            </button>

            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Dados
            </button>
          </section>
        </>
      )}

      {activeTab === 'ocorrencias' && (
        <>
          <section className="glass-panel p-6 md:p-8 rounded-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-lg text-blue-700">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Resumo de Ocorrências</h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Lançamento de ocorrências de relevo por unidade.</p>
                </div>
              </div>
              <div className="px-4 py-2 bg-slate-100 rounded-lg border border-slate-200 text-sm font-bold text-slate-600">
                Total de Registros: {
                  OCCURRENCE_UNITS.reduce((acc, u) => acc + (occurrences[u.id]?.length || 0), 0)
                }
              </div>
            </div>

            <div className="flex flex-col gap-8">
              {OCCURRENCE_UNITS.map(unit => (
                <div key={unit.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-blue-200 transition-colors">
                  {/* Unit Header */}
                  <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={`./logos/${unit.id}.png`}
                        alt={`Logo ${unit.name}`}
                        className="w-7 h-7 object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                      <h3 className="font-extrabold text-slate-800 text-sm tracking-wide">{unit.name}</h3>
                    </div>
                    <button
                      onClick={() => handleAddOccurrence(unit.id)}
                      className="text-xs font-bold px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Ocorrência
                    </button>
                  </div>

                  {/* Unit Occurrences List */}
                  <div className="p-5 flex flex-col gap-4">
                    {(!occurrences[unit.id] || occurrences[unit.id].length === 0) ? (
                      <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <p className="text-sm font-semibold text-slate-500">Nenhuma ocorrência registrada para esta unidade.</p>
                      </div>
                    ) : (
                      occurrences[unit.id].map((occ, idx) => (
                        <div key={idx} className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg relative group">
                          <button
                            onClick={() => handleRemoveOccurrence(unit.id, idx)}
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
                                onChange={(e) => handleOccurrenceFieldChange(unit.id, idx, 'nature', e.target.value)}
                                list={`nature-list-${unit.id}-${idx}`}
                                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              />
                              <datalist id={`nature-list-${unit.id}-${idx}`}>
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
                                  onChange={(e) => handleOccurrenceFieldChange(unit.id, idx, 'ciops', e.target.value)}
                                  className={`w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${occ.ciopsInProg ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
                                />
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 whitespace-nowrap cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={occ.ciopsInProg || false}
                                    onChange={(e) => {
                                      handleOccurrenceFieldChange(unit.id, idx, 'ciopsInProg', e.target.checked);
                                      if (e.target.checked) handleOccurrenceFieldChange(unit.id, idx, 'ciops', '');
                                    }}
                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
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
                                  onChange={(e) => handleOccurrenceFieldChange(unit.id, idx, 'bo', e.target.value)}
                                  className={`w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${occ.boInProg ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
                                />
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 whitespace-nowrap cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={occ.boInProg || false}
                                    onChange={(e) => {
                                      handleOccurrenceFieldChange(unit.id, idx, 'boInProg', e.target.checked);
                                      if (e.target.checked) handleOccurrenceFieldChange(unit.id, idx, 'bo', '');
                                    }}
                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
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
              ))}
            </div>
          </section>

          {/* Tab 2 Actions Panel */}
          <section className="flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-center p-6 rounded-2xl bg-slate-100 border border-slate-200 glass-panel">
            <button
              onClick={handleCopyToClipboardOcc}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              Copiar Texto TXT
            </button>

            <button
              onClick={handleDownloadOccTXT}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-white hover:bg-slate-50 text-blue-600 border border-slate-350 hover:border-blue-400 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Baixar Resumo TXT
            </button>

            <button
              onClick={handleGenerateOccurrencesPDF}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
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
          </section>
        </>
      )}

      {/* Confirmation Modals */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-slide-up border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Atenção
            </h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">Tem certeza que deseja apagar todos os dados preenchidos no Mapa da Força? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Sim, Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {showOccClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-slide-up border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Atenção
            </h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">Tem certeza que deseja apagar todos os registros de ocorrências? Esta ação não pode ser desfeita.</p>
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
                Sim, Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
