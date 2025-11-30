
import React, { useState, useMemo } from 'react';
import { User, Resident, Visit } from '../../types';
import { Users, DoorOpen, ShieldAlert, Activity, UserCheck, Home, Truck, ChevronDown, ChevronUp, ShieldCheck as ShieldIcon, Sparkles, FileText, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { geminiService } from '../../services/gemini.service';

interface DashboardProps {
  user: User;
  residents: Resident[];
  visits: Visit[];
}

type DashboardSection = 'residents' | 'visits' | 'alerts' | 'status' | null;
type TimeRange = 'day' | 'week' | 'month' | 'year';

const Dashboard: React.FC<DashboardProps> = ({ user, residents, visits }) => {
  const [activeSection, setActiveSection] = useState<DashboardSection>('residents');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  const displayResidents = useMemo(() => 
    user.role === 'B' 
      ? residents.filter(r => r.unit === user.unit) 
      : residents
  , [residents, user.role, user.unit]);

  const displayVisits = useMemo(() => 
    user.role === 'B'
      ? visits.filter(v => displayResidents.some(r => r.id === v.residentId))
      : visits
  , [visits, displayResidents, user.role]);

  const toggleSection = (section: DashboardSection) => {
    setActiveSection(prev => prev === section ? null : section);
  };

  const todayVisitsCount = useMemo(() => 
    displayVisits.filter(v => v.date.startsWith(new Date().toISOString().split('T')[0])).length
  , [displayVisits]);

  // Chart Data Calculation
  const chartData = useMemo(() => {
    const now = new Date();
    const data: { name: string; visits: number }[] = [];

    if (timeRange === 'day') {
      const hours = Array.from({ length: 24 }, (_, i) => ({ 
        hour: i, 
        label: `${i}:00`,
        count: 0 
      }));

      displayVisits.forEach(v => {
        const vDate = new Date(v.date);
        if (vDate.toDateString() === now.toDateString()) {
           const h = v.date.includes('T') ? vDate.getHours() : 12;
           if (hours[h]) hours[h].count++;
        }
      });
      return hours.map(h => ({ name: h.label, visits: h.count }));

    } else if (timeRange === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' });
        const count = displayVisits.filter(v => v.date.startsWith(dateStr)).length;
        data.push({ name: dayName, visits: count });
      }
    } else if (timeRange === 'month') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const count = displayVisits.filter(v => v.date.startsWith(dateStr)).length;
        data.push({ name: String(i), visits: count });
      }
    } else if (timeRange === 'year') {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const year = now.getFullYear();
      const counts = new Array(12).fill(0);
      displayVisits.forEach(v => {
        const vDate = new Date(v.date);
        if (vDate.getFullYear() === year) counts[vDate.getMonth()]++;
      });
      counts.forEach((c, idx) => data.push({ name: months[idx], visits: c }));
    }
    return data;
  }, [displayVisits, timeRange]);

  const handleGenerateAIReport = async () => {
    setIsGeneratingReport(true);
    setAiReport(null);
    setActiveSection(null); // Close other sections to focus on report
    
    try {
      const report = await geminiService.analyzeDashboardStats({
        totalResidents: residents.length,
        todayVisits: todayVisitsCount,
        chartData: chartData,
        recentVisits: displayVisits.slice(0, 5)
      });
      setAiReport(report);
    } catch (e) {
      setAiReport("Error al contactar con la IA.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const stats = useMemo(() => [
    { 
      key: 'residents' as DashboardSection,
      title: user.role === 'B' ? 'Mi Familia' : 'Total Residentes', 
      value: displayResidents.length, 
      icon: Users, 
      color: 'bg-blue-500',
      ringColor: 'ring-blue-500'
    },
    { 
      key: 'visits' as DashboardSection,
      title: 'Visitas Hoy', 
      value: todayVisitsCount, 
      icon: DoorOpen, 
      color: 'bg-green-500',
      ringColor: 'ring-green-500'
    },
    { 
      key: 'alerts' as DashboardSection,
      title: 'Alertas', 
      value: '0', 
      icon: ShieldAlert, 
      color: 'bg-red-500',
      ringColor: 'ring-red-500'
    },
    { 
      key: 'status' as DashboardSection,
      title: 'Actividad', 
      value: 'Normal', 
      icon: Activity, 
      color: 'bg-purple-500',
      ringColor: 'ring-purple-500'
    },
  ], [user.role, displayResidents.length, todayVisitsCount]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Resident': return <UserCheck size={14} />;
      case 'Family': return <Users size={14} />;
      case 'Delivery': return <Truck size={14} />;
      case 'Visitor': return <Home size={14} />;
      default: return <UserCheck size={14} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-gray-800 font-bold text-xl hidden md:block">Resumen</h2>
        {(user.role === 'X' || user.role === 'A') && (
          <button 
            onClick={handleGenerateAIReport}
            disabled={isGeneratingReport}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all disabled:opacity-70"
          >
            {isGeneratingReport ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
            {isGeneratingReport ? 'Analizando...' : 'Reporte IA'}
          </button>
        )}
      </div>

      {/* AI REPORT SECTION */}
      {aiReport && (
        <div className="bg-white rounded-xl p-6 border border-purple-100 shadow-sm animate-in fade-in slide-in-from-top-4">
           <div className="flex items-center gap-2 mb-4 text-purple-700 font-bold border-b border-purple-50 pb-2">
             <FileText size={20} />
             <h3>Reporte de Seguridad Gemini</h3>
           </div>
           <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
             {aiReport}
           </div>
           <button onClick={() => setAiReport(null)} className="mt-4 text-xs text-purple-500 hover:text-purple-700 underline">Cerrar reporte</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isActive = activeSection === stat.key;
          return (
            <button
              key={stat.key}
              onClick={() => toggleSection(stat.key)}
              className={`
                relative bg-white p-6 rounded-xl shadow-sm border transition-all duration-200 text-left w-full
                flex items-center justify-between group outline-none
                ${isActive ? `ring-2 ${stat.ringColor} border-transparent transform scale-[1.02]` : 'border-gray-100 hover:border-gray-300 hover:shadow-md'}
              `}
            >
              <div>
                <p className="text-gray-500 text-sm font-medium group-hover:text-gray-700 transition-colors">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</h3>
              </div>
              <div className={`${stat.color} p-3 rounded-lg text-white shadow-sm shadow-blue-500/20`}>
                <Icon size={24} />
              </div>
              <div className="absolute bottom-2 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                 {isActive ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Dynamic Content Section */}
      <div className="transition-all duration-300 ease-in-out min-h-[400px]">
        {activeSection === 'residents' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
             {/* ... (Tabla de residentes existente sin cambios de lógica) ... */}
             <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-blue-50/30">
              <div className="flex items-center gap-2">
                <Users className="text-blue-500" size={20} />
                <h3 className="text-lg font-bold text-gray-800">
                  {user.role === 'B' ? 'Mi Grupo Familiar' : 'Directorio de Residentes'}
                </h3>
              </div>
              <span className="text-xs text-blue-700 bg-blue-100 px-3 py-1 rounded-full font-medium">
                {displayResidents.length} Registros
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3 font-medium">Nombre</th>
                    <th className="px-5 py-3 font-medium">Unidad</th>
                    <th className="px-5 py-3 font-medium">Tipo</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayResidents.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-sm font-medium text-gray-800 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-200">
                          {r.name.charAt(0)}
                        </div>
                        {r.name}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{r.unit}</td>
                      <td className="px-5 py-3">
                         <span className={`text-xs px-2.5 py-1 rounded-full border inline-flex items-center gap-1 bg-opacity-50 border-transparent 
                           ${r.type === 'Resident' ? 'bg-blue-100 text-blue-700' : ''}
                           ${r.type === 'Family' ? 'bg-purple-100 text-purple-700' : ''}
                           ${r.type === 'Visitor' ? 'bg-green-100 text-green-700' : ''}
                           ${r.type === 'Delivery' ? 'bg-orange-100 text-orange-700' : ''}
                         `}>
                            {getTypeIcon(r.type)}
                            {r.type}
                         </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100 font-medium">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ... (Resto de secciones sin cambios significativos) ... */}
        {activeSection === 'status' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
             {/* ... Gráfico existente ... */}
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} />
                    <Tooltip cursor={{fill: '#F3F4F6'}} />
                    <Bar dataKey="visits" name="Accesos" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
