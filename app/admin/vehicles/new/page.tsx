'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createVehicle, uploadPhoto, getBrands, getModelsByBrand } from '@/lib/api';
import type { Brand, VehicleModel } from '@/types';
import { isTokenValid, getToken, removeToken } from '@/lib/auth';
import AdminLayout from '@/components/AdminLayout';

// ---- Constants ----

const FEATURES = [
  { group: 'Conforto',     items: ['Ar condicionado', 'Ar condicionado digital', 'Bancos em couro', 'Banco elétrico', 'Teto solar', 'Teto panorâmico'] },
  { group: 'Segurança',    items: ['Airbag', 'ABS', 'Controle de estabilidade', 'Câmera de ré', 'Sensor de estacionamento', 'Alarme'] },
  { group: 'Tecnologia',   items: ['Central multimídia', 'GPS', 'Bluetooth', 'Carregador wireless', 'Som original', 'Entrada USB'] },
  { group: 'Conveniência', items: ['Vidros elétricos', 'Travas elétricas', 'Retrovisores elétricos', 'Direção hidráulica', 'Direção elétrica', 'Piloto automático', 'Controle de cruzeiro adaptativo'] },
  { group: 'Estado',       items: ['Único dono', 'IPVA pago', 'Com manual', 'Com chave reserva', 'Aceita troca', 'Revisões em dia'] },
];

interface FormData {
  category: string; brand: string; model: string; brand_id: string; model_id: string;
  year: string; km: string; price: string; color: string; description: string;
  is_featured: boolean; transmission: string; fuel: string; doors: string; body_type: string;
  cilindrada: string; marchas: string; motor_type: string; cooling: string; moto_style: string;
  starter: string; front_brake: string; rear_brake: string; fuel_system: string;
}

const INITIAL: FormData = {
  category: 'car', brand: '', model: '', brand_id: '', model_id: '',
  year: '', km: '', price: '', color: '', description: '',
  is_featured: false, transmission: '', fuel: '', doors: '', body_type: '',
  cilindrada: '', marchas: '', motor_type: '', cooling: '', moto_style: '',
  starter: '', front_brake: '', rear_brake: '', fuel_system: '',
};

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 transition-colors bg-white';
const LABEL = 'block text-xs font-medium text-gray-500 mb-1';

// ---- Stepper ----

function Stepper({ current }: { current: number }) {
  const steps = ['Dados básicos', 'Detalhes', 'Opcionais', 'Fotos'];
  return (
    <div className="flex items-start mb-8">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = current > n;
        const active = current === n;
        return (
          <div key={label} className="flex items-start flex-1">
            <div className="flex flex-col items-center">
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: done ? '#22c55e' : active ? '#0a1628' : '#e5e7eb',
                color: (done || active) ? '#fff' : '#9ca3af',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
              }}>
                {done ? '✓' : n}
              </div>
              <span style={{
                fontSize: 11, marginTop: 5, textAlign: 'center', lineHeight: 1.3,
                color: active ? '#0a1628' : done ? '#22c55e' : '#9ca3af',
                fontWeight: active ? 600 : 400,
              }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginTop: 15, marginLeft: 4, marginRight: 4,
                background: done ? '#22c55e' : '#e5e7eb', borderRadius: 2,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---- Page ----

export default function NewVehiclePage() {
  const router = useRouter();
  const [token, setTokenState] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isTokenValid()) { removeToken(); router.replace('/admin/login'); return; }
    setTokenState(getToken());
  }, [router]);

  useEffect(() => {
    getBrands('car').then(setBrands).catch(console.error);
  }, []);

  function field(key: keyof FormData, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleCategoryChange(category: string) {
    setForm(prev => ({ ...prev, category, brand_id: '', brand: '', model_id: '', model: '' }));
    setVehicleModels([]);
    setBrands([]);
    getBrands(category).then(setBrands).catch(console.error);
  }

  async function handleBrandChange(brandIdStr: string) {
    setForm(prev => ({ ...prev, brand_id: brandIdStr, brand: '', model_id: '', model: '' }));
    setVehicleModels([]);
    if (!brandIdStr) return;
    const brand = brands.find(b => b.id === Number(brandIdStr));
    if (brand) setForm(prev => ({ ...prev, brand: brand.name }));
    setLoadingModels(true);
    try { setVehicleModels(await getModelsByBrand(Number(brandIdStr))); }
    finally { setLoadingModels(false); }
  }

  function handleModelChange(modelIdStr: string) {
    const m = vehicleModels.find(m => m.id === Number(modelIdStr));
    setForm(prev => ({ ...prev, model_id: modelIdStr, model: m?.name ?? '' }));
  }

  function toggleFeature(item: string) {
    setFeatures(prev => prev.includes(item) ? prev.filter(f => f !== item) : [...prev, item]);
  }

  function addFiles(newFiles: File[]) {
    const combined = [...files, ...newFiles].slice(0, 10);
    previews.forEach(URL.revokeObjectURL);
    setFiles(combined);
    setPreviews(combined.map(f => URL.createObjectURL(f)));
  }

  function removeFile(i: number) {
    URL.revokeObjectURL(previews[i]);
    setFiles(files.filter((_, j) => j !== i));
    setPreviews(previews.filter((_, j) => j !== i));
  }

  function validate(): string {
    if (step === 1) {
      if (!form.brand_id) return 'Selecione a marca.';
      if (!form.model_id) return 'Selecione o modelo.';
      if (!form.year.trim()) return 'Informe o ano.';
      if (!form.km) return 'Informe a quilometragem.';
      if (!form.price) return 'Informe o preço.';
    }
    if (step === 2) {
      if (!form.color.trim()) return 'Informe a cor.';
    }
    return '';
  }

  function advance() {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => (s + 1) as 1 | 2 | 3 | 4);
  }

  function back() {
    setError('');
    setStep(s => (s - 1) as 1 | 2 | 3 | 4);
  }

  async function handleSubmit() {
    if (!token) return;
    setError(''); setSaving(true);
    try {
      const vehicle = await createVehicle({
        category: form.category,
        brand: form.brand.trim(),
        model: form.model.trim(),
        brand_id: form.brand_id ? Number(form.brand_id) : undefined,
        model_id: form.model_id ? Number(form.model_id) : undefined,
        year: form.year.trim(),
        km: Number(form.km),
        price: Number(form.price),
        color: form.color.trim() || undefined,
        description: form.description.trim() || undefined,
        is_featured: form.is_featured,
        transmission: form.transmission || undefined,
        fuel: form.fuel || undefined,
        doors: form.doors ? Number(form.doors) : undefined,
        body_type: form.body_type || undefined,
        cilindrada: form.cilindrada ? Number(form.cilindrada) : undefined,
        marchas: form.marchas ? Number(form.marchas) : undefined,
        motor_type: form.motor_type || undefined,
        cooling: form.cooling || undefined,
        moto_style: form.moto_style || undefined,
        starter: form.starter || undefined,
        front_brake: form.front_brake || undefined,
        rear_brake: form.rear_brake || undefined,
        fuel_system: form.fuel_system || undefined,
        features,
      }, token);

      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Enviando foto ${i + 1} de ${files.length}...`);
        await uploadPhoto(vehicle.id, files[i], token);
      }

      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar veículo.');
    } finally {
      setSaving(false);
      setUploadProgress('');
    }
  }

  if (!token) return null;

  const btnBack = (
    <button type="button" onClick={back}
      className="px-5 py-2.5 text-sm font-semibold border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
      ← Voltar
    </button>
  );

  const btnNext = (
    <button type="button" onClick={advance}
      className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity"
      style={{ background: '#0a1628' }}>
      Próximo →
    </button>
  );

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Novo veículo</h1>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <Stepper current={step} />

          {/* ── Etapa 1 — Dados básicos ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Categoria *</label>
                <select className={INPUT} value={form.category} onChange={e => handleCategoryChange(e.target.value)}>
                  <option value="car">Carro</option>
                  <option value="motorcycle">Moto</option>
                  <option value="truck">Caminhão</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Marca *</label>
                  <select className={INPUT} value={form.brand_id} onChange={e => handleBrandChange(e.target.value)}>
                    <option value="">Selecione a marca</option>
                    {brands.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Modelo *</label>
                  <select
                    className={INPUT}
                    value={form.model_id}
                    disabled={!form.brand_id || loadingModels}
                    onChange={e => handleModelChange(e.target.value)}
                    style={{ opacity: (!form.brand_id || loadingModels) ? 0.5 : 1 }}
                  >
                    <option value="">{loadingModels ? 'Carregando...' : 'Selecione o modelo'}</option>
                    {vehicleModels.map(m => <option key={m.id} value={String(m.id)}>{m.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={LABEL}>Ano *</label>
                  <input className={INPUT} type="text" value={form.year}
                    onChange={e => field('year', e.target.value)} placeholder="Ex: 2022/2023" />
                </div>
                <div>
                  <label className={LABEL}>Quilometragem *</label>
                  <input className={INPUT} type="number" min={0} value={form.km}
                    onChange={e => field('km', e.target.value)} placeholder="45000" />
                </div>
                <div>
                  <label className={LABEL}>Preço (R$) *</label>
                  <input className={INPUT} type="number" min={0} step="0.01" value={form.price}
                    onChange={e => field('price', e.target.value)} placeholder="75000" />
                </div>
              </div>

              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              <div className="flex justify-end pt-2">{btnNext}</div>
            </div>
          )}

          {/* ── Etapa 2 — Detalhes ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Cor *</label>
                <input className={INPUT} type="text" value={form.color}
                  onChange={e => field('color', e.target.value)} placeholder="Ex: Prata" />
              </div>

              {form.category === 'motorcycle' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL}>Cilindrada (cc)</label>
                      <input className={INPUT} type="number" min={0} value={form.cilindrada}
                        onChange={e => field('cilindrada', e.target.value)} placeholder="Ex: 150" />
                    </div>
                    <div>
                      <label className={LABEL}>Marchas</label>
                      <select className={INPUT} value={form.marchas} onChange={e => field('marchas', e.target.value)}>
                        <option value="">Selecione</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL}>Tipo de motor</label>
                      <select className={INPUT} value={form.motor_type} onChange={e => field('motor_type', e.target.value)}>
                        <option value="">Selecione</option>
                        <option value="2 Tempos">2 Tempos</option>
                        <option value="4 Tempos">4 Tempos</option>
                      </select>
                    </div>
                    <div>
                      <label className={LABEL}>Refrigeração</label>
                      <select className={INPUT} value={form.cooling} onChange={e => field('cooling', e.target.value)}>
                        <option value="">Selecione</option>
                        <option value="Ar">Ar</option>
                        <option value="Água">Água</option>
                        <option value="Óleo">Óleo</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL}>Estilo</label>
                      <select className={INPUT} value={form.moto_style} onChange={e => field('moto_style', e.target.value)}>
                        <option value="">Selecione</option>
                        <option value="Street">Street</option>
                        <option value="Trail">Trail</option>
                        <option value="Utilitária">Utilitária</option>
                        <option value="Esportiva">Esportiva</option>
                        <option value="Scooter">Scooter</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <label className={LABEL}>Partida</label>
                      <select className={INPUT} value={form.starter} onChange={e => field('starter', e.target.value)}>
                        <option value="">Selecione</option>
                        <option value="Elétrica">Elétrica</option>
                        <option value="Pedal">Pedal</option>
                        <option value="Ambas">Ambas</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL}>Freio dianteiro</label>
                      <select className={INPUT} value={form.front_brake} onChange={e => field('front_brake', e.target.value)}>
                        <option value="">Selecione</option>
                        <option value="Disco">Disco</option>
                        <option value="Tambor">Tambor</option>
                      </select>
                    </div>
                    <div>
                      <label className={LABEL}>Freio traseiro</label>
                      <select className={INPUT} value={form.rear_brake} onChange={e => field('rear_brake', e.target.value)}>
                        <option value="">Selecione</option>
                        <option value="Disco">Disco</option>
                        <option value="Tambor">Tambor</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={LABEL}>Alimentação</label>
                    <select className={INPUT} value={form.fuel_system} onChange={e => field('fuel_system', e.target.value)}>
                      <option value="">Selecione</option>
                      <option value="Carburador">Carburador</option>
                      <option value="Injeção Eletrônica">Injeção Eletrônica</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL}>Câmbio</label>
                      <select className={INPUT} value={form.transmission} onChange={e => field('transmission', e.target.value)}>
                        <option value="">Selecione</option>
                        <option value="Manual">Manual</option>
                        <option value="Automático">Automático</option>
                        <option value="CVT">CVT</option>
                        <option value="Automatizado">Automatizado</option>
                      </select>
                    </div>
                    <div>
                      <label className={LABEL}>Combustível</label>
                      <select className={INPUT} value={form.fuel} onChange={e => field('fuel', e.target.value)}>
                        <option value="">Selecione</option>
                        <option value="Gasolina">Gasolina</option>
                        <option value="Flex">Flex</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Elétrico">Elétrico</option>
                        <option value="Híbrido">Híbrido</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL}>Portas</label>
                      <select className={INPUT} value={form.doors} onChange={e => field('doors', e.target.value)}>
                        <option value="">Selecione</option>
                        <option value="2">2</option>
                        <option value="4">4</option>
                      </select>
                    </div>
                    <div>
                      <label className={LABEL}>Carroceria</label>
                      <select className={INPUT} value={form.body_type} onChange={e => field('body_type', e.target.value)}>
                        <option value="">Selecione</option>
                        <option value="Hatch">Hatch</option>
                        <option value="Sedan">Sedan</option>
                        <option value="SUV">SUV</option>
                        <option value="Picape">Picape</option>
                        <option value="Conversível">Conversível</option>
                        <option value="Minivan">Minivan</option>
                        <option value="Caminhonete">Caminhonete</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className={LABEL}>Descrição</label>
                <textarea className={INPUT} rows={4} value={form.description}
                  onChange={e => field('description', e.target.value)}
                  placeholder="Detalhes sobre o veículo..."
                  style={{ resize: 'none' }} />
              </div>

              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              <div className="flex justify-between pt-2">{btnBack}{btnNext}</div>
            </div>
          )}

          {/* ── Etapa 3 — Opcionais ── */}
          {step === 3 && (
            <div className="space-y-5">
              {FEATURES.map(({ group, items }) => (
                <div key={group}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{group}</p>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                    {items.map(item => (
                      <label key={item} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={features.includes(item)}
                          onChange={() => toggleFeature(item)}
                          className="w-4 h-4 rounded flex-shrink-0"
                          style={{ accentColor: '#0a1628' }}
                        />
                        <span className="text-sm text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <label className="flex items-center gap-2 cursor-pointer pt-3 border-t border-gray-100">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={e => field('is_featured', e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: '#0a1628' }}
                />
                <span className="text-sm font-medium text-gray-700">Veículo em destaque</span>
              </label>

              <div className="flex justify-between pt-2">{btnBack}{btnNext}</div>
            </div>
          )}

          {/* ── Etapa 4 — Fotos ── */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Drag & drop */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault(); setDragOver(false);
                  addFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? '#0a1628' : '#d1d5db'}`,
                  borderRadius: 12,
                  padding: '40px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragOver ? 'rgba(10,22,40,0.04)' : '#fafafa',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 8, pointerEvents: 'none' }}>📷</div>
                <p className="text-sm font-medium text-gray-600 pointer-events-none">
                  Arraste as fotos aqui ou clique para selecionar
                </p>
                <p className="text-xs text-gray-400 mt-1 pointer-events-none">
                  {files.length}/10 fotos · PNG, JPG, WEBP
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => { addFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }}
              />

              {/* Previews */}
              {previews.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden bg-gray-100 group"
                      style={{ aspectRatio: '4/3' }}>
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); removeFile(i); }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: '#cc0000', border: 'none', cursor: 'pointer', lineHeight: 1 }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {error && <p className="text-xs text-red-500">{error}</p>}

              {uploadProgress && (
                <p className="text-sm text-blue-600 bg-blue-50 rounded-lg px-3 py-2">{uploadProgress}</p>
              )}

              <div className="flex justify-between pt-2">
                {btnBack}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ background: '#22c55e' }}
                >
                  {saving ? (uploadProgress || 'Publicando...') : '✓ Publicar veículo'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
