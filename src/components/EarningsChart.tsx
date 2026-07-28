import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Booking {
  id: string;
  booking_date: string;
  price?: number;
}

interface Expense {
    id: string;
    date: string;
    type: 'gasolina' | 'manutencao';
    amount: number;
}

interface EarningsChartProps {
  bookings: Booking[];
  expenses: Expense[]; // Adicionar despesas às props
}

type DailyData = {
  day: number;
  earnings: number;
  expenses: number;
  profit: number;
};

type MonthlyData = {
  month: string;
  totalEarnings: number;
  totalExpenses: number;
  totalProfit: number;
  daily: DailyData[];
};

const processFinancialData = (bookings: Booking[], expenses: Expense[]): MonthlyData[] => {
  const dataByMonth: { 
    [key: string]: { 
        totalEarnings: number; 
        totalExpenses: number; 
        daily: { [key: number]: { earnings: number; expenses: number } };
    } 
  } = {};

  // Processar Ganhos (Bookings)
  bookings.forEach(booking => {
    if (typeof booking.price !== 'number') return;
    const date = new Date(booking.booking_date);
    const month = date.toLocaleString('pt-PT', { month: 'long', year: 'numeric' });
    const day = date.getUTCDate();

    if (!dataByMonth[month]) {
      dataByMonth[month] = { totalEarnings: 0, totalExpenses: 0, daily: {} };
    }
    if (!dataByMonth[month].daily[day]) {
      dataByMonth[month].daily[day] = { earnings: 0, expenses: 0 };
    }

    dataByMonth[month].totalEarnings += booking.price;
    dataByMonth[month].daily[day].earnings += booking.price;
  });

  // Processar Despesas (Expenses)
  expenses.forEach(expense => {
    if (typeof expense.amount !== 'number') return;
    const date = new Date(expense.date);
    const month = date.toLocaleString('pt-PT', { month: 'long', year: 'numeric' });
    const day = date.getUTCDate();

    if (!dataByMonth[month]) {
      dataByMonth[month] = { totalEarnings: 0, totalExpenses: 0, daily: {} };
    }
    if (!dataByMonth[month].daily[day]) {
      dataByMonth[month].daily[day] = { earnings: 0, expenses: 0 };
    }

    dataByMonth[month].totalExpenses += expense.amount;
    dataByMonth[month].daily[day].expenses += expense.amount;
  });

  return Object.entries(dataByMonth).map(([month, data]) => ({
    month,
    totalEarnings: data.totalEarnings,
    totalExpenses: data.totalExpenses,
    totalProfit: data.totalEarnings - data.totalExpenses,
    daily: Object.entries(data.daily)
      .map(([day, dailyData]) => ({ 
        day: parseInt(day), 
        earnings: dailyData.earnings, 
        expenses: dailyData.expenses,
        profit: dailyData.earnings - dailyData.expenses
      }))
      .sort((a, b) => a.day - b.day),
  }));
};

const EarningsChart = ({ bookings, expenses }: EarningsChartProps) => {
  const [financialData, setFinancialData] = useState<MonthlyData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    const processed = processFinancialData(bookings, expenses);
    setFinancialData(processed);
    if (processed.length > 0) {
      const sortedMonths = processed.sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());
      if (!selectedMonth || !processed.find(p => p.month === selectedMonth)) {
        setSelectedMonth(sortedMonths[0].month);
      }
    }
  }, [bookings, expenses]);

  const currentMonthData = useMemo(() => {
    return financialData.find(e => e.month === selectedMonth);
  }, [selectedMonth, financialData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Relatório Financeiro</CardTitle>
        {financialData.length > 0 ? (
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecionar Mês" />
            </SelectTrigger>
            <SelectContent>
              {financialData.map(item => (
                <SelectItem key={item.month} value={item.month}>
                  {item.month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </CardHeader>
      <CardContent>
        {currentMonthData ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Dia</TableHead>
                <TableHead className="text-right text-green-600">Ganhos</TableHead>
                <TableHead className="text-right text-red-600">Despesas</TableHead>
                <TableHead className="text-right font-bold">Lucro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentMonthData.daily.map(item => (
                <TableRow key={item.day}>
                  <TableCell className="font-medium">{item.day}</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(item.earnings)}</TableCell>
                  <TableCell className="text-right text-red-600">{item.expenses > 0 ? `-${formatCurrency(item.expenses)}` : formatCurrency(0)}</TableCell>
                  <TableCell className={`text-right font-bold ${item.profit < 0 ? 'text-red-600' : 'text-foreground'}`}>{formatCurrency(item.profit)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-muted/50 text-base">
                <TableCell>Total Mensal</TableCell>
                <TableCell className="text-right text-green-600">{formatCurrency(currentMonthData.totalEarnings)}</TableCell>
                <TableCell className="text-right text-red-600">{`-${formatCurrency(currentMonthData.totalExpenses)}`}</TableCell>
                <TableCell className={`text-right font-extrabold ${currentMonthData.totalProfit < 0 ? 'text-red-600' : 'text-foreground'}`}>{formatCurrency(currentMonthData.totalProfit)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-8">Ainda não existem dados financeiros para mostrar.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default EarningsChart;
