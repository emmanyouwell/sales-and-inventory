import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Printer, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // Add a Dialog component
import { BASE_API_URL } from "@/api";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  purchaseQty?: number;
}

export default function TransactionPage() {
  const [productId, setProductId] = useState("");
  const [cart, setCart] = useState<Product[]>([]);
  const [isPaid, setIsPaid] = useState(false);
  const [cashGiven, setCashGiven] = useState<number | "">("");
  const [showCashModal, setShowCashModal] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const fetchProduct = async (id: string): Promise<Product> => {
    const res = await fetch(`${BASE_API_URL}/api/products/${id}`);
    if (!res.ok) throw new Error("Product not found");
    return res.json();
  };

  const handleAddProduct = async () => {
    if (!productId.trim()) return;
    try {
      const product = await fetchProduct(productId);
      if (product.quantity <= 0) {
        toast({
          title: "Out of Stock",
          description: `${product.name} is currently out of stock.`,
          variant: "destructive",
        });
        return;
      }
      setCart((prev) => [...prev, { ...product, purchaseQty: 1 }]);
      setProductId("");
    } catch {
      toast({
        title: "Error",
        description: "Product not found",
        variant: "destructive",
      });
    }
  };

  const updateQty = (id: string, qty: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, purchaseQty: Math.max(1, qty) } : item
      )
    );
  };

  const deductStock = async () => {
    try {
      for (const item of cart) {
        await fetch(`/api/products/${item.id}/deduct`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: item.purchaseQty || 1 }),
        });
      }
    } catch (error) {
      console.error("Stock deduction error:", error);
    }
  };

  const handlePayClick = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add products before paying",
        variant: "destructive",
      });
      return;
    }
    setShowCashModal(true);
  };

  const handleConfirmPayment = async () => {
    if (typeof cashGiven !== "number" || cashGiven < total) {
      toast({
        title: "Invalid Amount",
        description: "Cash given must be greater than or equal to total",
        variant: "destructive",
      });
      return;
    }

    await deductStock();
    setIsPaid(true);
    setShowCashModal(false);
    toast({
      title: "Payment Successful",
      description: "Transaction completed — receipt ready.",
    });
  };

  const handlePrint = () => window.print();
  const handleReset = () => {
    setCart([]);
    setIsPaid(false);
    setCashGiven("");
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * (item.purchaseQty || 1),
    0
  );
  const change = cashGiven === "" ? 0 : Number(cashGiven) - total;
  const transactionId = Math.floor(100000 + Math.random() * 900000);
  const date = new Date().toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
          <CardTitle>Create New Transaction</CardTitle>
          {isPaid && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
              <Button onClick={handleReset} variant="outline" size="sm">
                New
              </Button>
              <Button
                onClick={() => setLocation("/products")}
                variant="secondary"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Products
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {!isPaid ? (
            <>
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <Input
                  placeholder="Enter Product ID"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddProduct()}
                  className="flex-1"
                />
                <Button onClick={handleAddProduct}>Add</Button>
              </div>

              {cart.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table className="min-w-[600px] sm:min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.id}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min={1}
                              max={item.quantity}
                              value={item.purchaseQty}
                              onChange={(e) =>
                                updateQty(item.id, parseInt(e.target.value))
                              }
                              className="w-20 text-center"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            ₱
                            {(item.price * (item.purchaseQty || 1)).toLocaleString(
                              "en-PH",
                              { minimumFractionDigits: 2 }
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="font-bold text-right">
                          Total
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          ₱
                          {total.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  No products added yet
                </p>
              )}

              <div className="flex flex-col sm:flex-row justify-end mt-4 gap-2">
                <Button
                  disabled={cart.length === 0}
                  onClick={handlePayClick}
                  className="gap-2 w-full sm:w-auto"
                >
                  <DollarSign className="w-4 h-4" /> Pay
                </Button>
              </div>

              {/* Payment Modal */}
              <Dialog open={showCashModal} onOpenChange={setShowCashModal}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enter Cash Received</DialogTitle>
                  </DialogHeader>
                  <div className="mt-2">
                    <Input
                      type="number"
                      placeholder="Cash given"
                      value={cashGiven}
                      min={total}
                      onChange={(e) =>
                        setCashGiven(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="h-10 w-full"
                    />
                    <p className="text-sm mt-1 text-muted-foreground">
                      Total: ₱{total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <DialogFooter className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCashModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleConfirmPayment}>Confirm</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <div
              id="receipt"
              className="font-mono text-sm bg-white text-black p-4 sm:p-6 rounded-md border border-gray-300 print:w-full print:shadow-none"
            >
              <h2 className="text-center font-bold text-lg mb-1">
                BLCM Hardware
              </h2>
              <p className="text-center text-xs mb-4">
                Rizal Ave., Malitbog, Bongabong Oriental Mindoro
                <br />
                Cellphone No: 09283160373
              </p>
              <div className="flex justify-between text-xs mb-2 flex-wrap gap-2">
                <span>Transaction ID: {transactionId}</span>
                <span>{date}</span>
              </div>
              <hr className="my-2 border-gray-400" />
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-400">
                    <th className="text-left">Item</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td className="text-center">{item.purchaseQty}</td>
                      <td className="text-right">
                        ₱
                        {(item.price * (item.purchaseQty || 1)).toLocaleString(
                          "en-PH",
                          { minimumFractionDigits: 2 }
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-400 font-bold">
                    <td className="pt-2">Total</td>
                    <td></td>
                    <td className="text-right pt-2">
                      ₱{total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="font-bold">
                    <td>Cash Given</td>
                    <td></td>
                    <td className="text-right">
                      ₱{Number(cashGiven).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="font-bold">
                    <td>Change</td>
                    <td></td>
                    <td className="text-right">
                      ₱{change.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
              <hr className="my-3 border-gray-400" />
              <p className="text-center text-xs">
                Thank you for shopping at BLCM Hardware!
                <br />
                Please come again.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
