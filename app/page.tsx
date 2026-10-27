'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Receita {
  id: string;
  nome_receita: string;
  metodo_extracao: string;
  moedor: string;
  regulagem_moedor: number;
  temperatura_agua_c: number;
  quantidade_cafe_g: number;
  quantidade_agua_g: number;
  quantidade_despejos: number;
  notas_sensoriais?: string;
  ratio: number;
  criado_em: string;
}

const METODOS = ['Todos', 'AeroPress', 'V60', 'Chemex', 'Koar', 'Melitta'];

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [metodoFiltro, setMetodoFiltro] = useState('Todos');

  const [formData, setFormData] = useState({
    nome_receita: '',
    metodo_extracao: 'AeroPress',
    moedor: 'Mischief M40',
    regulagem_moedor: '',
    temperatura_agua_c: '',
    quantidade_cafe_g: '',
    quantidade_agua_g: '',
    quantidade_despejos: '1',
    notas_sensoriais: '',
  });

  const cafeNum = Number(formData.quantidade_cafe_g);
  const aguaNum = Number(formData.quantidade_agua_g);
  const ratioCalculado = cafeNum > 0 && aguaNum > 0 ? Math.round(aguaNum / cafeNum) : null;

  const buscarReceitas = async () => {
    const { data, error } = await supabase
      .from('receitas_cafe')
      .select('*')
      .order('criado_em', { ascending: false });

    if (!error && data) {
      setReceitas(data);
    }
  };

  useEffect(() => {
    buscarReceitas();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (item: Receita) => {
    setEditingId(item.id);
    setFormData({
      nome_receita: item.nome_receita,
      metodo_extracao: item.metodo_extracao,
      moedor: item.moedor,
      regulagem_moedor: String(item.regulagem_moedor),
      temperatura_agua_c: String(item.temperatura_agua_c),
      quantidade_cafe_g: String(item.quantidade_cafe_g),
      quantidade_agua_g: String(item.quantidade_agua_g),
      quantidade_despejos: String(item.quantidade_despejos),
      notas_sensoriais: item.notas_sensoriais || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      nome_receita: '',
      metodo_extracao: 'AeroPress',
      moedor: 'Mischief M40',
      regulagem_moedor: '',
      temperatura_agua_c: '',
      quantidade_cafe_g: '',
      quantidade_agua_g: '',
      quantidade_despejos: '1',
      notas_sensoriais: '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta receita?')) return;

    const { error } = await supabase
      .from('receitas_cafe')
      .delete()
      .eq('id', id);

    if (error) {
      alert(`Erro ao excluir: ${error.message}`);
    } else {
      buscarReceitas();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('');

    const payload = {
      nome_receita: formData.nome_receita,
      metodo_extracao: formData.metodo_extracao,
      moedor: formData.moedor,
      regulagem_moedor: Number(formData.regulagem_moedor),
      temperatura_agua_c: Number(formData.temperatura_agua_c),
      quantidade_cafe_g: Number(formData.quantidade_cafe_g),
      quantidade_agua_g: Number(formData.quantidade_agua_g),
      quantidade_despejos: Number(formData.quantidade_despejos),
      notas_sensoriais: formData.notas_sensoriais,
    };

    let error;

    if (editingId) {
      const res = await supabase
        .from('receitas_cafe')
        .update(payload)
        .eq('id', editingId);
      error = res.error;
    } else {
      const res = await supabase
        .from('receitas_cafe')
        .insert([payload]);
      error = res.error;
    }

    if (error) {
      setMensagem(`Erro ao salvar: ${error.message}`);
    } else {
      setMensagem(editingId ? 'Receita atualizada com sucesso!' : 'Receita salva com sucesso!');
      handleCancelEdit();
      buscarReceitas();
    }
    setLoading(false);
  };

  const receitasFiltradas = metodoFiltro === 'Todos'
    ? receitas
    : receitas.filter(r => r.metodo_extracao === metodoFiltro);

  return (
    <main className="min-h-screen p-4 sm:p-8 bg-neutral-100 flex flex-col items-center justify-start space-y-8">
      {/* Form de Criação/Edição */}
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-800">
            {editingId ? 'Editar Receita' : 'Nova Receita de Café'}
          </h1>
          {editingId && (
            <button 
              type="button" 
              onClick={handleCancelEdit}
              className="text-xs bg-neutral-200 hover:bg-neutral-300 text-neutral-700 px-3 py-1 rounded-md font-medium"
            >
              Cancelar Edição
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Nome da Receita</label>
            <input required type="text" name="nome_receita" value={formData.nome_receita} onChange={handleChange} className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm p-2 border text-neutral-900" placeholder="Ex: SOUP Concentrado" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700">Método</label>
              <select name="metodo_extracao" value={formData.metodo_extracao} onChange={handleChange} className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm p-2 border text-neutral-900">
                <option value="AeroPress">AeroPress</option>
                <option value="V60">V60</option>
                <option value="Chemex">Chemex</option>
                <option value="Koar">Koar</option>
                <option value="Melitta">Melitta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Moedor</label>
              <select name="moedor" value={formData.moedor} onChange={handleChange} className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm p-2 border text-neutral-900">
                <option value="Mischief M40">Mischief M40</option>
                <option value="Comandante C40">Comandante C40</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700">Cliques/Nível</label>
              <input required type="number" name="regulagem_moedor" value={formData.regulagem_moedor} onChange={handleChange} className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm p-2 border text-neutral-900" placeholder="45" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Temp (°C)</label>
              <input required type="number" step="0.1" name="temperatura_agua_c" value={formData.temperatura_agua_c} onChange={handleChange} className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm p-2 border text-neutral-900" placeholder="92" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Despejos</label>
              <input required type="number" name="quantidade_despejos" value={formData.quantidade_despejos} onChange={handleChange} className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm p-2 border text-neutral-900" placeholder="1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700">Café (g)</label>
              <input required type="number" step="0.1" name="quantidade_cafe_g" value={formData.quantidade_cafe_g} onChange={handleChange} className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm p-2 border text-neutral-900" placeholder="18" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Água (g)</label>
              <input required type="number" step="0.1" name="quantidade_agua_g" value={formData.quantidade_agua_g} onChange={handleChange} className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm p-2 border text-neutral-900" placeholder="150" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">Notas Sensoriais</label>
            <textarea
              name="notas_sensoriais"
              rows={2}
              value={formData.notas_sensoriais}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm p-2 border text-neutral-900 text-sm"
              placeholder="Ex: Caramelo salgado, acidez média, corpo aveludado..."
            />
          </div>

          {ratioCalculado && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-center">
              <span className="text-xs text-amber-800 font-medium uppercase tracking-wider block">Proporção Estimada (Ratio)</span>
              <span className="text-lg font-bold text-amber-900">1:{ratioCalculado}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-neutral-800 text-white p-3 rounded-md font-semibold hover:bg-neutral-700 transition disabled:opacity-50 mt-4">
            {loading ? 'Processando...' : editingId ? 'Atualizar Receita' : 'Salvar Receita'}
          </button>
          
          {mensagem && (
            <p className={`text-center mt-4 text-sm font-medium ${mensagem.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
              {mensagem}
            </p>
          )}
        </form>
      </div>

      {/* Histórico com Filtro */}
      <div className="w-full max-w-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-neutral-800">Histórico de Receitas</h2>
          <span className="text-xs text-neutral-500">{receitasFiltradas.length} receita(s)</span>
        </div>

        {/* Botões de Filtro por Método */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {METODOS.map((metodo) => (
            <button
              key={metodo}
              onClick={() => setMetodoFiltro(metodo)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                metodoFiltro === metodo
                  ? 'bg-amber-800 text-white shadow-sm'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {metodo}
            </button>
          ))}
        </div>

        {receitasFiltradas.length === 0 ? (
          <p className="text-neutral-500 text-sm italic py-4 text-center">Nenhuma receita encontrada para este filtro.</p>
        ) : (
          receitasFiltradas.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-neutral-200 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-neutral-900 text-lg">{item.nome_receita}</h3>
                  <p className="text-sm text-neutral-600">
                    {item.metodo_extracao} • {item.moedor} ({item.regulagem_moedor} cliques)
                  </p>
                </div>
                <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded">
                  Ratio 1:{Math.round(item.ratio)}
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-2 text-xs text-neutral-500 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                <div><span className="block font-medium text-neutral-700">Café</span>{item.quantidade_cafe_g}g</div>
                <div><span className="block font-medium text-neutral-700">Água</span>{item.quantidade_agua_g}g</div>
                <div><span className="block font-medium text-neutral-700">Temp</span>{item.temperatura_agua_c}°C</div>
                <div><span className="block font-medium text-neutral-700">Despejos</span>{item.quantidade_despejos}</div>
              </div>

              {item.notas_sensoriais && (
                <div className="bg-amber-50/60 border border-amber-100 p-2.5 rounded-md text-xs text-amber-900">
                  <span className="font-semibold block mb-0.5 text-amber-800">Notas Sensoriais:</span>
                  {item.notas_sensoriais}
                </div>
              )}

              {/* Botões de Ação: Editar / Excluir */}
              <div className="flex justify-end gap-3 pt-2 border-t border-neutral-100 text-xs">
                <button
                  onClick={() => handleEdit(item)}
                  className="text-amber-800 hover:text-amber-900 font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}