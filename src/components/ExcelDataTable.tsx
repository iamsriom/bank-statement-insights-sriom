import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Edit, Save, X, FileSpreadsheet, Filter } from "lucide-react";

interface ExcelDataTableProps {
  excelData: any;
  onDataUpdate?: (updatedData: any) => void;
}

const ExcelDataTable = ({ excelData, onDataUpdate }: ExcelDataTableProps) => {
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [localData, setLocalData] = useState(excelData);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const categories = [
    "Food & Dining", "Transportation", "Utilities", "Entertainment", 
    "Healthcare", "Shopping", "Income", "Financial", "Subscriptions", "Other"
  ];

  const handleEditRow = (rowIndex: number) => {
    setEditingRow(rowIndex);
  };

  const handleSaveRow = (rowIndex: number) => {
    setEditingRow(null);
    onDataUpdate?.(localData);
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setLocalData(excelData); // Reset to original data
  };

  const handleCellChange = (rowIndex: number, cellIndex: number, value: string) => {
    const updatedData = { ...localData };
    updatedData.sheets[0].data[rowIndex][cellIndex] = value;
    setLocalData(updatedData);
  };

  const filteredData = localData.sheets[0].data.filter((row: any[]) => {
    if (filterCategory === "all") return true;
    return row[5] === filterCategory; // Category column
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span>Excel Data Table - {localData.metadata.totalTransactions} Transactions</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto max-h-96">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  {localData.sheets[0].headers.map((header: string, index: number) => (
                    <TableHead key={index} className="font-semibold text-foreground">
                      {header}
                    </TableHead>
                  ))}
                  <TableHead className="font-semibold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((row: any[], rowIndex: number) => (
                  <TableRow key={rowIndex} className="hover:bg-muted/30">
                    {row.map((cell: any, cellIndex: number) => (
                      <TableCell key={cellIndex} className="p-2">
                        {editingRow === rowIndex && cellIndex !== 3 ? ( // Don't edit balance
                          cellIndex === 5 ? ( // Category dropdown
                            <Select 
                              value={cell || ""} 
                              onValueChange={(value) => handleCellChange(rowIndex, cellIndex, value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map(cat => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={cell}
                              onChange={(e) => handleCellChange(rowIndex, cellIndex, e.target.value)}
                              className="w-full"
                              type={cellIndex === 2 ? "number" : "text"}
                            />
                          )
                        ) : (
                          <div className="min-h-6 flex items-center">
                            {cellIndex === 2 || cellIndex === 3 ? ( // Amount and Balance
                              <span className={`font-medium ${
                                typeof cell === 'number' && cell < 0 ? 'text-destructive' : 'text-success'
                              }`}>
                                ${Math.abs(cell || 0).toFixed(2)}
                              </span>
                            ) : cellIndex === 5 && cell ? ( // Category
                              <Badge variant="secondary">{cell}</Badge>
                            ) : (
                              <span className={cellIndex === 5 && !cell ? 'text-muted-foreground italic' : ''}>
                                {cellIndex === 5 && !cell ? 'Uncategorized' : cell || ''}
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="p-2">
                      <div className="flex items-center space-x-1">
                        {editingRow === rowIndex ? (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleSaveRow(rowIndex)}
                              className="h-8 w-8 p-0"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={handleCancelEdit}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditRow(rowIndex)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-sm text-muted-foreground">
            <strong>Account Info:</strong> {localData.metadata.accountInfo.bankName} - 
            {localData.metadata.accountInfo.accountNumber} ({localData.metadata.accountInfo.accountType}) | 
            <strong>Date Range:</strong> {localData.metadata.dateRange.start} to {localData.metadata.dateRange.end}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExcelDataTable;