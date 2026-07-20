import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export const OCCURRENCE_UNITS = [
  { id: 'btl-leste', name: 'BTL LESTE' },
  { id: '4-cicom', name: '4ª CICOM' },
  { id: '9-cicom', name: '9ª CICOM' },
  { id: '11-cicom', name: '11ª CICOM' },
  { id: '14-cicom', name: '14ª CICOM' },
  { id: '25-cicom', name: '25ª CICOM' },
  { id: '28-cicom', name: '28ª CICOM' },
  { id: '29-cicom', name: '29ª CICOM' },
  { id: '30-cicom', name: '30ª CICOM' },
  { id: 'seg', name: 'SEG' }
];

export const INITIAL_UNITS = [
  { id: 'cpa-leste', name: 'CPA LESTE', shortName: 'LESTE', isHQ: true, supervisor: '', supervisorId: '', vtrOrd: 0, vtrSeg: 0, pmOrd: 0, pmSeg: 0 },
  { id: '4-cicom', name: '04ª CICOM', shortName: '4ª', isHQ: false, supervisor: '', supervisorId: '', vtrOrd: 0, vtrSeg: 0, pmOrd: 0, pmSeg: 0 },
  { id: '9-cicom', name: '09ª CICOM', shortName: '9ª', isHQ: false, supervisor: '', supervisorId: '', vtrOrd: 0, vtrSeg: 0, pmOrd: 0, pmSeg: 0 },
  { id: '11-cicom', name: '11ª CICOM', shortName: '11ª', isHQ: false, supervisor: '', supervisorId: '', vtrOrd: 0, vtrSeg: 0, pmOrd: 0, pmSeg: 0 },
  { id: '14-cicom', name: '14ª CICOM', shortName: '14ª', isHQ: false, supervisor: '', supervisorId: '', vtrOrd: 0, vtrSeg: 0, pmOrd: 0, pmSeg: 0 },
  { id: '25-cicom', name: '25ª CICOM', shortName: '25ª', isHQ: false, supervisor: '', supervisorId: '', vtrOrd: 0, vtrSeg: 0, pmOrd: 0, pmSeg: 0 },
  { id: '28-cicom', name: '28ª CICOM', shortName: '28ª', isHQ: false, supervisor: '', supervisorId: '', vtrOrd: 0, vtrSeg: 0, pmOrd: 0, pmSeg: 0 },
  { id: '29-cicom', name: '29ª CICOM', shortName: '29ª', isHQ: false, supervisor: '', supervisorId: '', vtrOrd: 0, vtrSeg: 0, pmOrd: 0, pmSeg: 0 },
  { id: '30-cicom', name: '30ª CICOM', shortName: '30ª', isHQ: false, supervisor: '', supervisorId: '', vtrOrd: 0, vtrSeg: 0, pmOrd: 0, pmSeg: 0 }
];

export const getCurrentTurno = () => {
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 19) {
    return '1º TURNO';
  }
  return '2º TURNO';
};

export const INITIAL_HEADER = {
  data: new Date().toISOString().split('T')[0],
  hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  turno: getCurrentTurno(),
  customTurno: '',
  cpoNome: '',
  cpoId: '',
  telefone: '(92) 98842-1552', // 4a cicom padrao
  vtrSa: '',
  cicomName: '4ª CICOM',
  cicomHorarioTurno: '07h as 19h'
};

export const CICOM_PHONES = {
  '4ª CICOM': '(92) 98842-1552',
  '9ª CICOM': '(92) 98842-1581',
  '11ª CICOM': '(92) 98842-1593',
  '14ª CICOM': '(92) 98842-1667',
  '25ª CICOM': '(92) 98842-2911',
  '28ª CICOM': '(92) 98842-1460',
  '29ª CICOM': '(92) 98842-0000',
  '30ª CICOM': '(92) 98842-1732'
};

export const NATURE_SUGGESTIONS = [
  'Homicídio',
  'Roubo',
  'Furto',
  'Morte por Intervenção policial',
  'Tráfico de Drogas',
  'Apreensão de Arma de Fogo',
  'Apreensão de Entorpecentes',
  'Veículo Recuperado',
  'Lesão Corporal'
];

export const formatNum = (val) => {
  const num = parseInt(val, 10);
  if (isNaN(num)) return '00';
  return num < 10 ? `0${num}` : `${num}`;
};

export const NumericCell = ({ value, onChange }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [localVal, setLocalVal] = useState(formatNum(value));

  if (value !== prevValue) {
    setPrevValue(value);
    setLocalVal(formatNum(value));
  }

  const handleChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(-2);
    setLocalVal(val);
    const parsed = parseInt(val, 10);
    onChange(isNaN(parsed) ? 0 : parsed);
  };

  const handleBlur = () => {
    setLocalVal(formatNum(value));
  };

  const handleFocus = (e) => {
    e.target.select();
  };

  return (
    <input
      type="text"
      value={localVal}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      className="w-14 px-1 py-1 text-sm rounded border border-slate-300 text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 bg-white"
    />
  );
};

export const IncidentListField = ({ label, items, placeholder, onAdd, onChange, onRemove }) => {
  return (
    <div className="flex flex-col gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</label>
        <button
          type="button"
          onClick={onAdd}
          className="text-[11px] px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-sm hover:shadow-md transition-all flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </button>
      </div>
      <div className="flex flex-col gap-2 mt-1">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              placeholder={placeholder}
              value={item}
              onChange={(e) => onChange(idx, e.target.value)}
              className="w-full text-slate-800 bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-1.5 text-sm outline-none transition-all"
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const normalizeRank = (rank) => (rank || '').toUpperCase().replace(/°/g, 'º').trim();

export const isAllowedSA = (rank) => {
  const r = normalizeRank(rank);
  const allowed = [
    'CAP QOPM',
    '1º TEN QOPM',
    '1º TEN QOAPM',
    '2º TEN QOPM',
    '2º TEN QOAPM'
  ];
  return allowed.includes(r);
};

export const isAllowedSSA = (rank) => {
  const r = normalizeRank(rank);
  const allowed = [
    'ASP OF PM',
    'ASP OF',
    '1º TEN QOPM',
    '1º TEN QOAPM',
    '1º TEN QPPM',
    '1° TEN QPPM',
    '2º TEN QOPM',
    '2º TEN QOAPM',
    'ST QPPM',
    'ST PM',
    '1º SGT QPPM',
    '2º SGT QPPM',
    '3º SGT QPPM',
    'CB QPPM',
    'CB PM',
    'CB'
  ];
  return allowed.includes(r);
};

export const formatDateBR = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const formatHourBR = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.includes(':')) {
    const parts = timeStr.split(':');
    return `${parts[0]}h${parts[1]}`;
  }
  return timeStr;
};
