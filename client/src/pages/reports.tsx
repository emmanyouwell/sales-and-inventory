import { useEffect, useState, useMemo, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/context/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, ArrowLeft, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface Order {
  id: string;
  productId: string;
  quantity: number;
  totalPrice?: number;
  status: string;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    price: number;
  };
}

interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export default function Reports() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportType, setReportType] = useState("daily");
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) setLocation("/login");
  }, [user, setLocation]);

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: !!user,
  });

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const confirmed = orders.filter(o => o.status === "confirmed");
    if (reportType === "daily") {
      return confirmed.filter(o => new Date(o.createdAt).toDateString() === now.toDateString());
    } else {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return confirmed.filter(o => new Date(o.createdAt) >= weekAgo);
    }
  }, [orders, reportType]);

  const totalSold = useMemo(() => filteredOrders.reduce((sum, o) => sum + (o.quantity || 0), 0), [filteredOrders]);

  const totalSales = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + ((o.product?.price || 0) * (o.quantity || 0)), 0);
  }, [filteredOrders]);

  const lowStock = useMemo(() => products.filter(p => p.quantity < 10), [products]);
  const timestamp = new Date().toLocaleString();

  const handleExportPDF = async () => {
    if (!reportRef.current) return;

    const element = reportRef.current;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 190;
    const pageHeight = 290;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.text(`Inventory Report - ${reportType.toUpperCase()} (${timestamp})`, 10, 10);
    pdf.addImage(imgData, "PNG", 10, 20, imgWidth, imgHeight);
    pdf.save(`report-${reportType}-${new Date().toISOString().slice(0, 10)}.pdf`);

    toast({
      title: "PDF Exported",
      description: `Your ${reportType} report has been downloaded.`,
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Reports</h1>
                <p className="text-sm text-muted-foreground">Daily and Weekly Sales Overview</p>
              </div>
            </div>
          </div>

          <Button onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export to PDF
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6" ref={reportRef}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <span>{reportType === "daily" ? "Daily Report" : "Weekly Report"}</span>
            </CardTitle>
          </CardHeader>

          <CardContent>
            {ordersLoading || productsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading reports...</div>
            ) : (
              <>
                <Tabs value={reportType} onValueChange={setReportType}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  </TabsList>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardHeader><CardTitle>Total Products Sold</CardTitle></CardHeader>
                      <CardContent><p className="text-2xl font-bold">{totalSold}</p></CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle>Total Sales</CardTitle></CardHeader>
                      <CardContent><p className="text-2xl font-bold">₱{totalSales.toFixed(2)}</p></CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle>Low Stock Products</CardTitle></CardHeader>
                      <CardContent><p className="text-2xl font-bold">{lowStock.length}</p></CardContent>
                    </Card>
                  </div>

                  <h2 className="text-lg font-semibold mb-2">Products Needing Restock</h2>
                  {lowStock.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Stock</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lowStock.map(p => (
                          <TableRow key={p.id}>
                            <TableCell>{p.name}</TableCell>
                            <TableCell>{p.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-muted-foreground py-4">All stocks are sufficient</div>
                  )}
                </Tabs>
                <div className="text-sm text-muted-foreground mt-6 text-right">
                  Report generated on: {timestamp}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
