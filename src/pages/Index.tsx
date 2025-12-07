import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ExcelData {
  headers: string[];
  rows: any[][];
}

interface CommandHistory {
  id: string;
  command: string;
  result: string;
  timestamp: Date;
}

const COLORS = ['#9b87f5', '#0EA5E9', '#F97316', '#10B981', '#EC4899'];

const Index = () => {
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processExcelFile = useCallback((file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
        
        if (jsonData.length > 0) {
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1);
          
          setExcelData({ headers, rows });
          setFileName(file.name);
          
          toast({
            title: 'Файл загружен',
            description: `${file.name} успешно обработан`,
          });
        }
      } catch (error) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось обработать файл',
          variant: 'destructive',
        });
      }
    };
    
    reader.readAsArrayBuffer(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(f => 
      f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
    );
    
    if (excelFile) {
      processExcelFile(excelFile);
    } else {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, загрузите Excel файл',
        variant: 'destructive',
      });
    }
  }, [processExcelFile, toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  }, [processExcelFile]);

  const executeCommand = useCallback(() => {
    if (!command.trim() || !excelData) return;
    
    setIsProcessing(true);
    
    setTimeout(() => {
      const newEntry: CommandHistory = {
        id: Date.now().toString(),
        command: command.trim(),
        result: `Анализирую команду: "${command}"\n\nНайдено ${excelData.rows.length} строк данных.\nКолонки: ${excelData.headers.join(', ')}\n\nДля полной интеграации с AI подключите DeepSeek API.`,
        timestamp: new Date(),
      };
      
      setCommandHistory(prev => [newEntry, ...prev]);
      setCommand('');
      setIsProcessing(false);
      
      toast({
        title: 'Команда выполнена',
        description: 'Результат добавлен в историю',
      });
    }, 1000);
  }, [command, excelData, toast]);

  const getChartData = useCallback(() => {
    if (!excelData || excelData.rows.length === 0) return [];
    
    return excelData.rows.slice(0, 10).map((row, index) => {
      const obj: any = { name: `Строка ${index + 1}` };
      excelData.headers.forEach((header, i) => {
        const value = row[i];
        if (typeof value === 'number') {
          obj[header] = value;
        }
      });
      return obj;
    });
  }, [excelData]);

  const chartData = getChartData();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg glow-effect">
              <Icon name="FileSpreadsheet" className="text-primary" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Excel AI Analyzer</h1>
              <p className="text-sm text-muted-foreground">Анализ данных с помощью искусственного интеллекта</p>
            </div>
          </div>
          
          {fileName && (
            <Badge variant="secondary" className="gap-2">
              <Icon name="File" size={14} />
              {fileName}
            </Badge>
          )}
        </header>

        {!excelData ? (
          <Card
            className={`border-2 border-dashed transition-all duration-300 ${
              isDragging 
                ? 'border-primary bg-primary/5 glow-effect' 
                : 'border-border hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="p-6 bg-primary/10 rounded-full mb-6 glow-effect">
                <Icon name="Upload" size={48} className="text-primary" />
              </div>
              
              <h3 className="text-xl font-semibold mb-2">Загрузите Excel файл</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Перетащите файл .xlsx или .xls сюда, либо нажмите кнопку для выбора
              </p>
              
              <label htmlFor="file-upload">
                <Button className="glow-effect">
                  <Icon name="FolderOpen" size={18} className="mr-2" />
                  Выбрать файл
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Icon name="Table" size={20} className="text-primary" />
                    Данные таблицы
                  </h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setExcelData(null);
                      setFileName('');
                      setCommandHistory([]);
                    }}
                  >
                    <Icon name="X" size={16} className="mr-2" />
                    Закрыть
                  </Button>
                </div>
                
                <ScrollArea className="h-[300px] rounded border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        {excelData.headers.map((header, i) => (
                          <th key={i} className="px-4 py-2 text-left font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {excelData.rows.map((row, i) => (
                        <tr key={i} className="border-b border-border hover:bg-muted/50">
                          {row.map((cell, j) => (
                            <td key={j} className="px-4 py-2">
                              {cell !== null && cell !== undefined ? String(cell) : '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </Card>

              <Card className="p-4">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Icon name="BarChart3" size={20} className="text-secondary" />
                  Визуализация
                </h2>
                
                <Tabs defaultValue="bar">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="bar">Столбцы</TabsTrigger>
                    <TabsTrigger value="line">Линии</TabsTrigger>
                    <TabsTrigger value="pie">Круг</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="bar" className="mt-4">
                    {chartData.length > 0 && (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="name" stroke="#999" />
                          <YAxis stroke="#999" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#2a2d3a', 
                              border: '1px solid #444',
                              borderRadius: '8px'
                            }} 
                          />
                          <Legend />
                          {Object.keys(chartData[0])
                            .filter(key => key !== 'name')
                            .map((key, i) => (
                              <Bar 
                                key={key} 
                                dataKey={key} 
                                fill={COLORS[i % COLORS.length]} 
                              />
                            ))}
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="line" className="mt-4">
                    {chartData.length > 0 && (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="name" stroke="#999" />
                          <YAxis stroke="#999" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#2a2d3a', 
                              border: '1px solid #444',
                              borderRadius: '8px'
                            }} 
                          />
                          <Legend />
                          {Object.keys(chartData[0])
                            .filter(key => key !== 'name')
                            .map((key, i) => (
                              <Line 
                                key={key} 
                                type="monotone" 
                                dataKey={key} 
                                stroke={COLORS[i % COLORS.length]}
                                strokeWidth={2}
                              />
                            ))}
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="pie" className="mt-4">
                    {chartData.length > 0 && (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={chartData.slice(0, 5)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => entry.name}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey={Object.keys(chartData[0]).find(k => k !== 'name') || 'value'}
                          >
                            {chartData.slice(0, 5).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#2a2d3a', 
                              border: '1px solid #444',
                              borderRadius: '8px'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-4 glow-effect-blue">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Icon name="Terminal" size={20} className="text-secondary" />
                  AI Командная строка
                </h2>
                
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && executeCommand()}
                      placeholder="Введите команду для AI..."
                      className="terminal-font flex-1 bg-muted"
                      disabled={isProcessing}
                    />
                    <Button 
                      onClick={executeCommand}
                      disabled={isProcessing || !command.trim()}
                      className="glow-effect-blue"
                    >
                      {isProcessing ? (
                        <Icon name="Loader2" size={18} className="animate-spin" />
                      ) : (
                        <Icon name="Send" size={18} />
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Примеры команд:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>Найди среднее значение</li>
                      <li>Заполни пропуски данных</li>
                      <li>Покажи тренды</li>
                      <li>Удали дубликаты</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Icon name="History" size={20} className="text-primary" />
                  История запросов
                </h2>
                
                <ScrollArea className="h-[400px]">
                  {commandHistory.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Icon name="FileQuestion" size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">История пуста</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {commandHistory.map((entry) => (
                        <Card key={entry.id} className="p-3 bg-muted">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline" className="text-xs">
                              {entry.timestamp.toLocaleTimeString()}
                            </Badge>
                          </div>
                          
                          <div className="terminal-font text-sm space-y-2">
                            <div>
                              <span className="text-secondary">$</span>{' '}
                              <span className="text-primary">{entry.command}</span>
                            </div>
                            <div className="text-muted-foreground text-xs whitespace-pre-wrap">
                              {entry.result}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
