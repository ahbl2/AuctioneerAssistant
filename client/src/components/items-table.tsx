import { useState } from "react";
import { ExternalLink, Heart, ArrowUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AuctionItem } from "@shared/schema";

interface ItemsTableProps {
  items: AuctionItem[];
}

export default function ItemsTable({ items }: ItemsTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const getConditionVariant = (condition: string) => {
    switch (condition) {
      case "Brand New":
        return "default";
      case "New/Like New":
        return "secondary";
      case "Good Condition":
        return "outline";
      case "As Is":
        return "destructive";
      default:
        return "outline";
    }
  };

  const calculateDiscount = (currentPrice: string, msrp: string) => {
    const current = parseFloat(currentPrice);
    const original = parseFloat(msrp);
    return Math.round(((original - current) / original) * 100);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <Card className="overflow-hidden" data-testid="items-table">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Photo</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('endDate')}
                  className="flex items-center"
                  data-testid="sort-button-end-date"
                >
                  Ends At
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('currentPrice')}
                  className="flex items-center"
                  data-testid="sort-button-price"
                >
                  Price
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('msrp')}
                  className="flex items-center"
                  data-testid="sort-button-msrp"
                >
                  MSRP
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/50" data-testid={`item-row-${item.id}`}>
                <TableCell>
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded-md border"
                    data-testid={`item-image-${item.id}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <p className="text-sm font-medium line-clamp-2" data-testid={`item-title-${item.id}`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1" data-testid={`item-description-${item.id}`}>
                      {item.description}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getConditionVariant(item.condition)} data-testid={`item-condition-${item.id}`}>
                    {item.condition}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm text-foreground" data-testid={`item-location-${item.id}`}>
                      {item.location}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.state}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-medium" data-testid={`item-end-date-${item.id}`}>
                    {formatDate(item.endDate)}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-lg font-bold text-primary" data-testid={`item-price-${item.id}`}>
                    ${parseFloat(item.currentPrice).toFixed(2)}
                  </p>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm text-muted-foreground line-through" data-testid={`item-msrp-${item.id}`}>
                      ${parseFloat(item.msrp).toFixed(2)}
                    </p>
                    <p className="text-xs font-semibold text-accent" data-testid={`item-discount-${item.id}`}>
                      {calculateDiscount(item.currentPrice, item.msrp)}% off
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      data-testid={`button-amazon-${item.id}`}
                    >
                      <a
                        href={item.amazonSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      data-testid={`button-watchlist-${item.id}`}
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
