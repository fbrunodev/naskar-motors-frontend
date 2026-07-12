'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getVehicle, updateVehicle, uploadPhoto, deletePhoto, getBrands, getModelsByBrand } from '@/lib/api';
import type { Brand, VehicleModel } from '@/types';
import { isTokenValid, removeToken } from '@/lib/auth';
import AdminLayout from '@/components/AdminLayout';

const FEATURES = [
  { group: 'Conforto',      items: ['Ar condicionado', 'Ar condicionado digital', 'Bancos em couro', 'Banco elétrico', 'Teto solar', 'Teto panorâmico'] },
  { group: 'Segurança',     items: ['Airbag', 'ABS', 'Controle de estabilidade', 'Câmera de ré', 'Sensor de estacionamento', 'Alarme'] },
  { group: 'Tecnologia',    items: ['Central multimídia', 'GPS', 'Bluetooth', 'Carregador wireless', 'Som original', 'Entrada USB'] },
  { group: 'Conveniência',  items: ['Vidros elétricos', 'Travas elétricas', 'Retrovisores elétricos', 'Direção hidráulica', 'Direção elétrica', 'Piloto automático', 'Controle de cruzeiro adaptativo'] },
  { group: 'Estado',        items: ['Único dono', 'IPVA pago', 'Com manual', 'Com chave reserva', 'Aceita troca', 'Revisões em dia'] },
];

interface FormData {
  category: string;
  brand: string;
  model: string;
  brand_id: string;
  model_id: string;
  year: string;
  km: string;
  price: string;
  color: string;
  description: string;
  is_featured: boolean;
  transmission: string;
  fuel: string;
  doors: string;
  body_type: string;
}

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = Number(params.id);

  const [token, setTokenState] = useState<string | null>(null);
  const [form, setForm] = useState<FormData | null>(null);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [photosToDelete, setPhotosToDelete] = useState<Set<string>>(new Set());
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [features, setFeatures] = useState<string[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isTokenValid()) {
      removeToken();
      router.replace('/admin/login');
      return;
    }
    setTokenState(localStorage.getItem('naskar_token'));
  }, [router]);

  useEffect(() => {
    if (!token || !vehicleId) return;
    (async () => {
      try {
        const v = await getVehicle(vehicleId);

        setForm({
          category: v.category,
          brand: v.brand,
          model: v.model,
          brand_id: v.brand_id ? String(v.brand_id) : '',
          model_id: v.model_id ? String(v.model_id) : '',
          year: v.year,
          km: String(v.km),
          price: String(v.price),
          color: v.color ?? '',
          description: v.description ?? '',
          is_featured: v.is_featured,
          transmission: v.transmission ?? '',
          fuel: v.fuel ?? '',
          doors: v.doors != null ? String(v.doors) : '',
          body_type: v.body_type ?? '',
        });
        setExistingPhotos(v.photos);
        setFeatures(v.features ?? []);

        // 1. Carregar marcas da categoria do veículo
        const brandsData = await getBrands(v.category);
        setBrands(brandsData);

        // 2. Determinar brand_id válido: verifica se existe na lista; senão, match por nome
        let effectiveBrandId: number | null = v.brand_id ?? null;
        if (effectiveBrandId && !brandsData.some(b => b.id === effectiveBrandId)) {
          effectiveBrandId = null; // ID stale — cai no match por nome
        }
        if (!effectiveBrandId && v.brand) {
          const match = brandsData.find(b => b.name.trim().toLowerCase() === v.brand.trim().toLowerCase());
          if (match) effectiveBrandId = match.id;
        }

        if (!effectiveBrandId) return;

        setSelectedBrandId(String(effectiveBrandId));
        setForm(prev => prev ? { ...prev, brand_id: String(effectiveBrandId) } : prev);

        // 3. Carregar modelos da marca
        const modelsData = await getModelsByBrand(effectiveBrandId);
        setVehicleModels(modelsData);

        // 4. Determinar model_id válido: verifica se existe na lista; senão, match por nome
        let effectiveModelId: number | null = v.model_id ?? null;
        if (effectiveModelId && !modelsData.some(m => m.id === effectiveModelId)) {
          effectiveModelId = null; // ID stale — cai no match por nome
        }
        if (!effectiveModelId && v.model) {
          const match = modelsData.find(m => m.name.trim().toLowerCase() === v.model.trim().toLowerCase());
          if (match) effectiveModelId = match.id;
        }

        if (!effectiveModelId) return;

        setSelectedModelId(String(effectiveModelId));
        setForm(prev => prev ? { ...prev, model_id: String(effectiveModelId) } : prev);
      } catch {
        setLoadError('Veículo não encontrado.');
      }
    })();
  }, [token, vehicleId]);

  function handleField(field: keyof FormData, value: string | boolean) {
    setForm(prev => prev ? { ...prev, [field]: value } : prev);
  }

  async function handleCategoryChange(category: string) {
    setForm(prev => prev ? { ...prev, category, brand_id: '', brand: '', model_id: '', model: '' } : prev);
    setSelectedBrandId('');
    setSelectedModelId('');
    setVehicleModels([]);
    setBrands([]);
    getBrands(category).then(setBrands).catch(console.error);
  }

  async function handleBrandChange(brandIdStr: string) {
    setSelectedBrandId(brandIdStr);
    setSelectedModelId('');
    setForm(prev => prev ? { ...prev, brand_id: brandIdStr, brand: '', model_id: '', model: '' } : prev);
    setVehicleModels([]);
    if (!brandIdStr) return;
    const brand = brands.find(b => b.id === Number(brandIdStr));
    if (brand) setForm(prev => prev ? { ...prev, brand: brand.name } : prev);
    setLoadingModels(true);
    try {
      const ms = await getModelsByBrand(Number(brandIdStr));
      setVehicleModels(ms);
    } finally {
      setLoadingModels(false);
    }
  }

  function toggleFeature(item: string) {
    setFeatures(prev => prev.includes(item) ? prev.filter(f => f !== item) : [...prev, item]);
  }

  function handleModelChange(modelIdStr: string) {
    setSelectedModelId(modelIdStr);
    const m = vehicleModels.find(m => m.id === Number(modelIdStr));
    setForm(prev => prev ? { ...prev, model_id: modelIdStr, model: m?.name ?? '' } : prev);
  }

  function toggleDeletePhoto(url: string) {
    setPhotosToDelete(prev => {
      const next = new Set(prev);
      next.has(url) ? next.delete(url) : next.add(url);
      return next;
    });
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const combined = [...newFiles, ...selected].slice(0, 10);
    setNewFiles(combined);
    newPreviews.forEach(URL.revokeObjectURL);
    setNewPreviews(combined.map(f => URL.createObjectURL(f)));
  }

  function removeNewFile(index: number) {
    URL.revokeObjectURL(newPreviews[index]);
    setNewFiles(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !form) return;
    setSaveError('');
    setSaving(true);

    try {
      await updateVehicle(vehicleId, {
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
        features,
      }, token);

      // Delete removed photos
      for (const url of photosToDelete) {
        await deletePhoto(vehicleId, url, token);
      }

      // Upload new photos
      for (let i = 0; i < newFiles.length; i++) {
        setUploadProgress(`Enviando foto ${i + 1} de ${newFiles.length}...`);
        await uploadPhoto(vehicleId, newFiles[i], token);
      }

      router.push('/admin');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
      setUploadProgress('');
    }
  }

  if (!token) return null;

  if (loadError) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-600 mb-3">{loadError}</p>
            <Link href="/admin" className="text-sm text-gray-600 underline">Voltar</Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!form) {
    return (
      <AdminLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-xl shadow p-6 space-y-4 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const visibleExistingPhotos = existingPhotos.filter(url => !photosToDelete.has(url));

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 flex flex-col gap-5">

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
            <select
              value={form.category}
              onChange={e => handleCategoryChange(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500"
            >
              <option value="car">Carro</option>
              <option value="motorcycle">Moto</option>
              <option value="truck">Caminhão</option>
            </select>
          </div>

          {/* Brand + Model */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
              <select
                required
                value={selectedBrandId}
                onChange={e => handleBrandChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500"
              >
                <option value="">Selecione a marca</option>
                {brands.map(b => (
                  <option key={b.id} value={String(b.id)}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
              <select
                required
                value={selectedModelId}
                disabled={!selectedBrandId || loadingModels}
                onChange={e => handleModelChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{loadingModels ? 'Carregando...' : 'Selecione o modelo'}</option>
                {vehicleModels.map(m => (
                  <option key={m.id} value={String(m.id)}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Year + KM */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano *</label>
              <input
                type="text"
                required
                value={form.year}
                onChange={e => handleField('year', e.target.value)}
                placeholder="Ex: 2022 ou 2022/2023"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quilometragem *</label>
              <input
                type="number"
                required
                min={0}
                value={form.km}
                onChange={e => handleField('km', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          {/* Price + Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={form.price}
                onChange={e => handleField('price', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
              <input
                type="text"
                value={form.color}
                onChange={e => handleField('color', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          {/* Transmission + Fuel */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Câmbio</label>
              <select
                value={form.transmission}
                onChange={e => handleField('transmission', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500"
              >
                <option value="">Selecione</option>
                <option value="Manual">Manual</option>
                <option value="Automático">Automático</option>
                <option value="CVT">CVT</option>
                <option value="Automatizado">Automatizado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Combustível</label>
              <select
                value={form.fuel}
                onChange={e => handleField('fuel', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500"
              >
                <option value="">Selecione</option>
                <option value="Gasolina">Gasolina</option>
                <option value="Flex">Flex</option>
                <option value="Diesel">Diesel</option>
                <option value="Elétrico">Elétrico</option>
                <option value="Híbrido">Híbrido</option>
              </select>
            </div>
          </div>

          {/* Doors + Body type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Portas</label>
              <select
                value={form.doors}
                onChange={e => handleField('doors', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500"
              >
                <option value="">Selecione</option>
                <option value="2">2</option>
                <option value="4">4</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carroceria</label>
              <select
                value={form.body_type}
                onChange={e => handleField('body_type', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500"
              >
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

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={form.description}
              onChange={e => handleField('description', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500 resize-none"
            />
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Opcionais e Acessórios</label>
            <div className="space-y-4">
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
                          className="w-4 h-4 rounded accent-gray-900 flex-shrink-0"
                        />
                        <span className="text-sm text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={e => handleField('is_featured', e.target.checked)}
              className="w-4 h-4 rounded accent-gray-900"
            />
            <span className="text-sm font-medium text-gray-700">Veículo em destaque</span>
          </label>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fotos</label>

            {/* Existing photos */}
            {existingPhotos.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1.5">Fotos atuais — clique para remover</p>
                <div className="flex flex-wrap gap-2">
                  {existingPhotos.map((url, i) => {
                    const marked = photosToDelete.has(url);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleDeletePhoto(url)}
                        className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 transition-all ${marked ? 'opacity-30 ring-2 ring-red-500' : 'hover:opacity-80'}`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {marked && (
                          <div className="absolute inset-0 flex items-center justify-center bg-red-100/50">
                            <span className="text-red-600 font-bold text-xs">REMOVER</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* New photos */}
            {newPreviews.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1.5">Novas fotos</p>
                <div className="flex flex-wrap gap-2">
                  {newPreviews.map((src, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 group flex-shrink-0">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewFile(i)}
                        className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg px-4 py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors w-full text-center"
            >
              + Adicionar fotos
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
              className="hidden"
            />
          </div>

          {saveError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {saveError}
            </p>
          )}

          {uploadProgress && (
            <p className="text-sm text-blue-600 bg-blue-50 rounded-lg px-3 py-2">{uploadProgress}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              href="/admin"
              className="flex-1 text-center border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
