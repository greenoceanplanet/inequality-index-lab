import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { 
  Plus, 
  Trash2, 
  Info, 
  TrendingUp, 
  Users, 
  ArrowRight,
  RefreshCcw,
  BookOpen,
  PieChart as PieChartIcon,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Types ---

interface IncomeData {
  id: string;
  value: number;
}

interface LorenzPoint {
  popShare: number;
  incomeShare: number;
  equality: number;
}

// --- Constants & Presets ---

const PRESETS = {
  EQUALITY: [1000, 1000, 1000, 1000, 1000],
  EXTREME: [1, 1, 1, 1, 4996],
  REALISTIC: [500, 800, 1200, 2000, 5000],
  MIDDLE_HEAVY: [1500, 1800, 2000, 2200, 2500],
};

// --- Helper Functions ---

const calculateGini = (values: number[]) => {
  if (values.length === 0) return 0;
  const n = values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  if (mean === 0) return 0;

  let sumDiff = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      sumDiff += Math.abs(sorted[i] - sorted[j]);
    }
  }
  return sumDiff / (2 * n * n * mean);
};

const calculateTheilT = (values: number[]) => {
  if (values.length === 0) return 0;
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  if (mean === 0) return 0;

  let sum = 0;
  for (const x of values) {
    if (x > 0) {
      const ratio = x / mean;
      sum += ratio * Math.log(ratio);
    }
  }
  return sum / n;
};

const calculateTheilL = (values: number[]) => {
  if (values.length === 0) return 0;
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  if (mean === 0) return 0;

  let sum = 0;
  for (const x of values) {
    if (x > 0) {
      sum += Math.log(mean / x);
    } else {
      // Theil-L is undefined for 0 income, but often treated as very high
      return Infinity;
    }
  }
  return sum / n;
};

const getLorenzData = (values: number[]): LorenzPoint[] => {
  if (values.length === 0) return [{ popShare: 0, incomeShare: 0, equality: 0 }];
  const sorted = [...values].sort((a, b) => a - b);
  const totalIncome = sorted.reduce((a, b) => a + b, 0);
  const n = sorted.length;

  const points: LorenzPoint[] = [{ popShare: 0, incomeShare: 0, equality: 0 }];
  let cumulativeIncome = 0;

  for (let i = 0; i < n; i++) {
    cumulativeIncome += sorted[i];
    points.push({
      popShare: ((i + 1) / n) * 100,
      incomeShare: (cumulativeIncome / totalIncome) * 100,
      equality: ((i + 1) / n) * 100,
    });
  }

  return points;
};

// --- Components ---

const IndexCard = ({ title, value, description, icon: Icon, colorClass }: { 
  title: string; 
  value: string | number; 
  description: string; 
  icon: any;
  colorClass: string;
}) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className={cn("p-3 rounded-xl", colorClass)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-slate-900 font-mono">{value}</p>
      </div>
    </div>
    <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
  </div>
);

export default function App() {
  const [incomes, setIncomes] = useState<IncomeData[]>(
    PRESETS.REALISTIC.map((v, i) => ({ id: `init-${i}`, value: v }))
  );
  const [newValue, setNewValue] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'visual' | 'learn'>('visual');

  const incomeValues = useMemo(() => incomes.map(i => i.value), [incomes]);
  const gini = useMemo(() => calculateGini(incomeValues), [incomeValues]);
  const theilT = useMemo(() => calculateTheilT(incomeValues), [incomeValues]);
  const theilL = useMemo(() => calculateTheilL(incomeValues), [incomeValues]);
  const lorenzData = useMemo(() => getLorenzData(incomeValues), [incomeValues]);

  const handleAddIncome = () => {
    const val = parseFloat(newValue);
    if (!isNaN(val) && val >= 0) {
      setIncomes([...incomes, { id: Math.random().toString(36).substr(2, 9), value: val }]);
      setNewValue('');
    }
  };

  const handleRemoveIncome = (id: string) => {
    setIncomes(incomes.filter(i => i.id !== id));
  };

  const handleUpdateIncome = (id: string, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setIncomes(incomes.map(i => i.id === id ? { ...i, value: num } : i));
    }
  };

  const applyPreset = (preset: number[]) => {
    setIncomes(preset.map((v, i) => ({ id: `preset-${i}-${Date.now()}`, value: v })));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">불평등 지수 탐색기</h1>
          </div>
          <nav className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('visual')}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
                activeTab === 'visual' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              시뮬레이션
            </button>
            <button 
              onClick={() => setActiveTab('learn')}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
                activeTab === 'learn' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              학습하기
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'visual' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Controls & Data */}
            <div className="lg:col-span-4 space-y-6">
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    소득 데이터셋
                  </h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => applyPreset(PRESETS.EQUALITY)}
                      className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                    >
                      완전평등
                    </button>
                    <button 
                      onClick={() => applyPreset(PRESETS.EXTREME)}
                      className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                    >
                      극단불평등
                    </button>
                  </div>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence initial={false}>
                    {incomes.map((income, idx) => (
                      <motion.div 
                        key={income.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-100 group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">관측치 #{idx + 1}</span>
                          <button 
                            onClick={() => handleRemoveIncome(income.id)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <input 
                              type="range"
                              min="0"
                              max="10000"
                              step="10"
                              value={income.value}
                              onChange={(e) => handleUpdateIncome(income.id, e.target.value)}
                              className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <input 
                              type="number"
                              value={income.value}
                              onChange={(e) => handleUpdateIncome(income.id, e.target.value)}
                              className="w-20 bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      placeholder="새 소득 입력..."
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddIncome()}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button 
                      onClick={handleAddIncome}
                      className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </section>

              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                <h3 className="text-indigo-900 font-semibold mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  실험 팁
                </h3>
                <p className="text-sm text-indigo-700 leading-relaxed">
                  소득 값을 극단적으로 바꿔보세요. 예를 들어, 한 명에게 모든 소득을 몰아주면 지니계수가 어떻게 변하는지, 소득이 0인 사람이 생기면 타일 지수(L)가 어떻게 반응하는지 관찰해보세요.
                </p>
              </div>
            </div>

            {/* Right Column: Charts & Indices */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Indices Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <IndexCard 
                  title="지니 계수 (Gini)"
                  value={gini.toFixed(4)}
                  description="0(완전평등)에서 1(완전불평등) 사이의 값을 가집니다. 로렌츠 곡선 아래의 면적 비율로 계산됩니다."
                  icon={PieChartIcon}
                  colorClass="bg-indigo-600"
                />
                <IndexCard 
                  title="타일 지수 GE(1)"
                  value={theilT.toFixed(4)}
                  description="상위 소득층의 변화에 더 민감하게 반응하는 엔트로피 기반 지수입니다. (Theil's T)"
                  icon={TrendingUp}
                  colorClass="bg-emerald-600"
                />
                <IndexCard 
                  title="타일 지수 GE(0)"
                  value={theilL === Infinity ? "∞" : theilL.toFixed(4)}
                  description="하위 소득층의 변화에 더 민감합니다. 소득이 0인 사람이 있으면 무한대로 발산합니다. (MLD)"
                  icon={ArrowRight}
                  colorClass="bg-amber-600"
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Lorenz Curve */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    로렌츠 곡선 (Lorenz Curve)
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={lorenzData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="popShare" 
                          label={{ value: '인구 누적 비율 (%)', position: 'insideBottom', offset: -5 }} 
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          label={{ value: '소득 누적 비율 (%)', angle: -90, position: 'insideLeft' }} 
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                          labelFormatter={(label) => `인구 하위 ${label.toFixed(1)}%`}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="incomeShare" 
                          stroke="#4f46e5" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorIncome)" 
                          name="실제 소득 분포"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="equality" 
                          stroke="#94a3b8" 
                          strokeDasharray="5 5" 
                          dot={false}
                          name="완전 평등선"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Income Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    소득 분포 (Income Distribution)
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={incomes}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="id" hide />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          formatter={(value: number) => [value.toLocaleString(), '소득']}
                          labelFormatter={() => '개별 데이터'}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {incomes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4f46e5' : '#818cf8'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* Learning Content Tab */
          <div className="max-w-4xl mx-auto space-y-12 py-8">
            <section className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-900 border-l-4 border-indigo-600 pl-4">불평등 지수 이해하기</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                불평등 지수는 한 사회의 자원이 얼마나 고르게 분배되어 있는지를 숫자로 나타낸 것입니다. 
                단순히 평균만으로는 알 수 없는 분포의 특성을 파악하는 데 도움을 줍니다.
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="bg-indigo-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                  <PieChartIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold">지니 계수 (Gini Coefficient)</h3>
                <p className="text-slate-600 leading-relaxed">
                  가장 널리 쓰이는 지수입니다. 로렌츠 곡선과 완전 평등선 사이의 면적을 통해 계산합니다. 
                  전체적인 불평등도를 직관적으로 보여주지만, <b>분포의 어느 부분(상위 혹은 하위)에서 불평등이 심한지는 구별하지 못합니다.</b>
                </p>
                <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">산식 (Formula)</p>
                  <div className="text-sm font-mono text-slate-700 overflow-x-auto py-2">
                    G = ΣΣ|xᵢ - xⱼ| / (2n²x̄)
                  </div>
                  <p className="text-[10px] text-slate-500">* x̄: 평균 소득, n: 인구 수</p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="bg-emerald-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold">타일 지수 (Theil Index)</h3>
                <p className="text-slate-600 leading-relaxed">
                  정보 엔트로피 개념을 도입한 지수입니다. 집단 내 불평등과 집단 간 불평등으로 <b>분해(Decomposition)</b>가 가능하다는 강력한 장점이 있습니다.
                </p>
                <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">GE(1) 산식 (Theil's T)</p>
                    <div className="text-sm font-mono text-slate-700 overflow-x-auto py-2">
                      T = (1/n) Σ (xᵢ/x̄) · ln(xᵢ/x̄)
                    </div>
                  </div>
                  <div className="border-t border-slate-200 pt-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">GE(0) 산식 (Theil's L / MLD)</p>
                    <div className="text-sm font-mono text-slate-700 overflow-x-auto py-2">
                      L = (1/n) Σ ln(x̄/xᵢ)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <section className="bg-slate-900 text-white p-10 rounded-3xl space-y-6">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <HelpCircle className="w-8 h-8 text-indigo-400" />
                왜 여러 지수를 함께 보나요?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h4 className="font-bold text-indigo-300">사례 A: 상위 1%가 독점</h4>
                  <p className="text-slate-300 text-sm">
                    상위 1%의 소득이 더 늘어날 때, 지니계수보다 <b>타일 지수(T)</b>가 훨씬 더 민감하게 상승합니다.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-bold text-indigo-300">사례 B: 극빈층의 소득 감소</h4>
                  <p className="text-slate-300 text-sm">
                    가장 가난한 사람들의 소득이 조금만 줄어도 <b>타일 지수(L)</b>는 매우 크게 반응합니다.
                  </p>
                </div>
              </div>
              <p className="text-indigo-200 pt-4 border-t border-slate-800 text-center italic">
                "불평등의 양상은 다양합니다. 하나의 지수만으로는 사회의 모든 아픔을 읽어낼 수 없습니다."
              </p>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <p className="text-slate-500 text-sm">
            © 2026 Inequality Index Explorer. 교육용 시뮬레이션 도구입니다.
          </p>
          <div className="flex justify-center gap-6">
            <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors"><BookOpen className="w-5 h-5" /></a>
            <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors"><RefreshCcw className="w-5 h-5" /></a>
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
